import type { ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { slugify } from '@/lib/slug';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageMessage from '@/components/ui/PageMessage';
import { useAppSelector } from '@/app/hooks';
import { useMediaQuery } from '@/app/useMediaQuery';
import { errorMessage } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_BG,
  COLOR_LINE_STRONG,
  COLOR_TEXT_MUTED,
  SHADOW_OVERLAY,
  SPACE_GUTTER,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  SPACE_XXL,
  TEXT_SM,
} from '@/theme';
import BuildDetailsForm from './sections/BuildDetailsForm';
import BuildHeader, { BuildActions } from './sections/BuildHeader';
import BuildSections from './sections/BuildSections';
import BuildSidebar from './sections/BuildSidebar';
import BuildTabs from './sections/BuildTabs';
import CommentsSection from './sections/CommentsSection';
import DescriptionSection from './sections/DescriptionSection';
import DiscussionSection from './sections/DiscussionSection';
import EquipmentSection from './sections/EquipmentSection';
import { STATS_COLUMN_WIDTH } from './sections/StatsCard';
import GuideSection from './guide/GuideSection';
import OwnerActions from './sections/OwnerActions';
import { TrackButton } from '@/features/tracking/TrackButton';
import { TrackingBar } from '@/features/tracking/TrackingBar';
import { NewItemsNotice } from '@/features/tracking/TrackingCards';
import { useBuildTracking } from '@/features/tracking/useBuildTracking';
import { selectLevel } from './store/build';
import {
  hasWriteUp,
  isCanonical,
  parseTab,
  splitBuildPath,
  tabPath,
  visibleTabs,
  type BuildTab,
} from './tabs';
import { useBuildEditor } from './useBuildEditor';

/**
 * `/build/:buildId/<slug>/<tab>` (slug and tab optional, T56; or `/build/new`): one editor per build, so state never leaks between
 * builds; switching tabs keeps it (and an edit in progress).
 */
function BuildEditorPage() {
  const { buildId = 'new', '*': rest } = useParams();
  const id = buildId === 'new' ? null : buildId;
  return <BuildEditor key={buildId} buildId={id} rest={rest} />;
}

/**
 * View, create and edit a build (T22, T28, T48, T63, T66: the owner's design). The top section,
 * unframed: the title block, then one row with the tabs (Equipment, Guide, and the discussion:
 * "Write-up & comments", or "Comments" when the author wrote nothing, T71) and the
 * build's actions (Track, Like, Share). Under it, framed: the build sidebar (`BuildSidebar`) beside
 * the tab. A fully equipped build's Equipment tab fits a 1440×820 window (T66; e2e `fold.spec`). Equipment
 * (the build's own URL): the stats in the sidebar and the equipment as the main content, the two the
 * same height. Guide and Discussion: the sidebar has the stats and the equipment as small tiles.
 * Discussion: the author's write-up (if any) at the top, then the comments. Editing (and new builds):
 * "edit mode is the view layout": Equipment is the only tab, with the stats, every slot and the
 * write-up editable, and a sticky Save/Cancel bar. Tracking (T34, view mode) lives in the Guide only
 * (T46): the progress bar, the player's stats and the new-items notice at the top, the route as the
 * checklist; the title section's "Track this build" (or "Tracking") opens it. Phones and tablets
 * (< 900 px, T49): one layout picked in JS, collapsible sections (`BuildSections`) instead of the tab
 * bar and the sidebar, the write-up and the comments each their own section (T71).
 */
function BuildEditor({ buildId, rest }: { buildId: string | null; rest?: string }) {
  const editor = useBuildEditor(buildId);
  const level = useAppSelector(selectLevel);
  const { auth, build, buildQuery, editable, isNew } = editor;
  const tracking = useBuildTracking(editable ? null : build);
  const routeId = buildId ?? 'new';
  const phone = useMediaQuery(BELOW_TABLET);

  // A new build opens for anyone (T68): signed out, Save asks for an account first.
  if (isNew) {
    if (auth.loading) return <PageMessage loading />;
  } else {
    if (buildQuery.isPending) return <PageMessage loading />;
    if (buildQuery.isError) {
      return (
        <PageMessage title="Couldn’t load this build">
          <ErrorMessage onRetry={() => void buildQuery.refetch()}>
            {errorMessage(buildQuery.error)}
          </ErrorMessage>
        </PageMessage>
      );
    }
    if (!build) {
      return (
        <PageMessage title="Build not found">
          <p>It may have been deleted, or the link is wrong.</p>
          <Link to="/">Browse builds</Link>
        </PageMessage>
      );
    }
  }

  // The URL's one shape (T56): `/build/<id>/<slug of the name>/<tab>`. A missing or stale slug (the
  // build was renamed), an old link (`/route`, `/description`, before T48) or a tab this build doesn't
  // show (editing) is replaced, with no extra history entry.
  const tabs = visibleTabs({ editable });
  const { slug, tabSegment } = splitBuildPath(rest);
  const tab = parseTab(tabSegment);
  const name = build?.name;
  if (!tab || !tabs.includes(tab)) {
    return <Navigate to={tabPath(routeId, 'equipment', name)} replace />;
  }
  if (!isCanonical(tabSegment, tab) || slug !== (name === undefined ? null : slugify(name))) {
    return <Navigate to={tabPath(routeId, tab, name)} replace />;
  }

  // The write-up's editor: under the equipment on desktop, its own section on phones.
  const descriptionEditor = editable ? (
    <DescriptionSection
      description={editor.description}
      editable
      onChange={editor.setDescription}
      bare={phone}
    />
  ) : null;

  // Track, Like and Share: on the tab row on desktop, under the tags on phones.
  const actions = build ? (
    <BuildActions
      build={build}
      trackAction={
        <TrackButton tracking={tracking} guidePath={tabPath(build.id, 'guide', build.name)} />
      }
    />
  ) : null;

  // Each tab's content: beside the sidebar on desktop, in its section on phones (bare: the section
  // is the panel and has the heading). Phones show the equipment as their own gear sections.
  const bodies: Record<BuildTab, ReactNode> = {
    equipment: phone ? null : (
      <>
        <EquipmentSection editable={editable} />
        {descriptionEditor}
      </>
    ),
    guide: build ? (
      <>
        <TrackingBar tracking={tracking} buildName={build.name} target={build.stats} />
        <NewItemsNotice tracking={tracking} />
        <GuideSection
          equipment={build.equipment}
          bare={phone}
          tracking={
            tracking.state
              ? {
                  collected: tracking.state.collected,
                  marked: tracking.state.marked,
                  onToggle: tracking.toggle,
                  onMark: tracking.mark,
                }
              : undefined
          }
        />
      </>
    ) : null,
    discussion: !build ? null : phone ? (
      <CommentsSection buildId={build.id} ownerId={build.ownerId} bare />
    ) : (
      <DiscussionSection
        buildId={build.id}
        ownerId={build.ownerId}
        description={build.description}
      />
    ),
  };

  // Phones: the write-up is its own section, ahead of the Guide (T71).
  const writeUp =
    phone && build && !editable && hasWriteUp(build.description) ? (
      <DescriptionSection
        description={build.description}
        editable={false}
        onChange={() => {}}
        bare
      />
    ) : null;

  return (
    <Page>
      {editable ? (
        <BuildDetailsForm
          isNew={isNew}
          name={editor.name}
          image={editor.image}
          equipment={editor.equipment}
          onImageChange={editor.setImage}
          onAddTag={editor.handleAddTag}
          onNameChange={editor.setName}
          onRemoveTag={editor.handleRemoveTag}
          tags={editor.tags}
        />
      ) : build ? (
        <BuildHeader
          build={build}
          actions={phone ? actions : undefined}
          ownerActions={
            editor.isOwner ? (
              <OwnerActions
                confirmingDelete={editor.confirmingDelete}
                deleting={editor.deleting}
                deleteError={editor.deleteError}
                onEdit={editor.handleEdit}
                onAskDelete={editor.setConfirmingDelete}
                onDelete={editor.handleDelete}
              />
            ) : null
          }
        />
      ) : null}
      {phone ? (
        <BuildSections
          routeId={routeId}
          tab={tab}
          tabs={tabs}
          editable={editable}
          level={level}
          description={editor.description}
          descriptionEditor={descriptionEditor}
          writeUp={writeUp}
          build={build}
          tracking={tracking}
          bodies={bodies}
        />
      ) : (
        <div>
          <BuildTabs
            buildId={routeId}
            buildName={build?.name}
            current={tab}
            tabs={tabs}
            commentCount={editable ? undefined : build?.commentCount}
            hasWriteUp={hasWriteUp(build?.description)}
            actions={editable ? undefined : actions}
          />
          <WithSidebar>
            <BuildSidebar
              editable={editable}
              level={level}
              equipment={tab !== 'equipment'}
              fill={tab === 'equipment' && !editable}
            />
            <Content $fill={tab === 'equipment' && !editable}>{bodies[tab]}</Content>
          </WithSidebar>
        </div>
      )}
      {editable ? (
        <EditBar aria-label="Save changes">
          <ErrorMessage>{editor.saveError}</ErrorMessage>
          {editor.signedOutDraft && !editor.saveError ? (
            <SaveNote>
              Free account needed to save: you’ll sign up or log in, and keep this build.
            </SaveNote>
          ) : null}
          <EditButtons>
            <Button variant="secondary" onClick={editor.handleCancel} disabled={editor.saving}>
              Cancel
            </Button>
            <Button onClick={editor.handleSave} disabled={editor.saving}>
              {editor.saving ? 'Saving…' : 'Save'}
            </Button>
          </EditButtons>
        </EditBar>
      ) : null}
    </Page>
  );
}

// The panels stacked with even gaps; the page ends with room before the footer.
const Page = styled.div`
  display: grid;
  gap: ${SPACE_LG};
  margin-bottom: ${SPACE_XXL};
  padding-top: ${SPACE_MD};

  /* Desktop: the title block sits close to its tab row, one top section. */
  > section:first-child {
    margin-bottom: -${SPACE_MD};

    @media ${BELOW_TABLET} {
      margin-bottom: 0;
    }
  }
`;

// The tab's panels, stacked. Equipment: a column whose first panel stretches to the sidebar's height.
const Content = styled.div<{ $fill: boolean }>`
  align-self: ${({ $fill }) => ($fill ? 'stretch' : 'start')};
  display: flex;
  flex-direction: column;
  gap: ${SPACE_LG};
  min-width: 0;
`;

// Desktop: the sidebar on the left (it sticks under the tab bar itself when it fits), the tab beside it.
const WithSidebar = styled.div`
  align-items: start;
  display: grid;
  gap: ${SPACE_REGION};
  grid-template-columns: ${STATS_COLUMN_WIDTH}px minmax(0, 1fr);
  margin-top: ${SPACE_MD};
`;

// Stays on screen at the bottom while editing, so Save is always one Tab or tap away.
const EditBar = styled.section`
  align-items: center;
  background: ${COLOR_BG};
  border-top: 1px solid ${COLOR_LINE_STRONG};
  bottom: 0;
  box-shadow: ${SHADOW_OVERLAY};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_LG};
  justify-content: flex-end;
  margin: 0 -24px;
  padding: ${SPACE_MD} 24px;
  position: sticky;
  z-index: 10;

  @media ${BELOW_MOBILE} {
    margin: 0 -${SPACE_GUTTER};
    padding: ${SPACE_SM} ${SPACE_GUTTER};
  }
`;

const EditButtons = styled.div`
  display: flex;
  gap: ${SPACE_SM};
  margin-left: auto;
`;

// Signed out: why Save asks for an account (T68).
const SaveNote = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

export default BuildEditorPage;
