import type { ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { useAppSelector } from '@/app/hooks';
import { useOpenAuthDialog } from '@/app/authDialog';
import { useMediaQuery } from '@/app/useMediaQuery';
import { errorMessage } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_BG,
  COLOR_LINE_STRONG,
  SHADOW_OVERLAY,
  SPACE_GUTTER,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  SPACE_XXL,
} from '@/theme';
import BuildDetailsForm from './sections/BuildDetailsForm';
import BuildHeader from './sections/BuildHeader';
import BuildSections from './sections/BuildSections';
import BuildSidebar from './sections/BuildSidebar';
import BuildTabs from './sections/BuildTabs';
import CommentsSection from './sections/CommentsSection';
import DescriptionSection from './sections/DescriptionSection';
import { STATS_COLUMN_WIDTH } from './sections/StatsCard';
import GuideSection from './guide/GuideSection';
import OwnerActions from './sections/OwnerActions';
import { TrackButton } from '@/features/tracking/TrackButton';
import { TrackingBar } from '@/features/tracking/TrackingBar';
import { NewItemsNotice } from '@/features/tracking/TrackingCards';
import { useBuildTracking } from '@/features/tracking/useBuildTracking';
import { selectLevel } from './store/build';
import { isCanonical, parseTab, tabPath, visibleTabs, type BuildTab } from './tabs';
import { useBuildEditor } from './useBuildEditor';

/**
 * `/build/:buildId/:tab?` (or `/build/new`): one editor per build, so state never leaks between
 * builds; switching tabs keeps it (and an edit in progress).
 */
function BuildEditorPage() {
  const { buildId = 'new', tab } = useParams();
  const id = buildId === 'new' ? null : buildId;
  return <BuildEditor key={buildId} buildId={id} tabParam={tab} />;
}

/**
 * View, create and edit a build (T22, T28, T48: the owner's design): the title section, a tab bar
 * (Description, Guide, Comments), then the build sidebar (stats and gear, `BuildSidebar`) beside the
 * tab, the same on every tab, signed in or out, tracking or not. Below 900 px the sidebar sits above
 * the tab (until T49's collapsible sections). Editing (and new builds): "edit mode is the view
 * layout": the sidebar takes the stats and gear, Description is the only tab (the write-up), and a
 * sticky Save/Cancel bar. Tracking (T34, view mode) lives in the Guide only (T46): the progress bar,
 * the player's stats and the new-items notice at the top, the route as the checklist; the title
 * section's "Track this build" (or "Tracking") opens it. Phones and tablets (< 900 px, T49): one layout
 picked in JS, collapsible sections (`BuildSections`) instead of the tab bar and the sidebar.
 */
function BuildEditor({ buildId, tabParam }: { buildId: string | null; tabParam?: string }) {
  const editor = useBuildEditor(buildId);
  const level = useAppSelector(selectLevel);
  const { auth, build, buildQuery, editable, isNew } = editor;
  const tracking = useBuildTracking(editable ? null : build);
  const routeId = buildId ?? 'new';
  const openAuthDialog = useOpenAuthDialog();
  const phone = useMediaQuery(BELOW_TABLET);

  if (isNew) {
    if (auth.loading) return <PageMessage loading />;
    if (!auth.uid) {
      return (
        <PageMessage title="Log in to create a build">
          <p>Builds are saved to your account. Once you’re in, the editor opens right here.</p>
          <SignInActions>
            <Button onClick={() => openAuthDialog('signup')}>Create account</Button>
            <Button variant="secondary" onClick={() => openAuthDialog('login')}>
              Log in
            </Button>
          </SignInActions>
        </PageMessage>
      );
    }
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

  // An unknown tab, or one this build doesn't show (editing): Description. An old link (`/route`,
  // `/description`, before T48): its tab's own URL.
  const tabs = visibleTabs({ editable });
  const tab = parseTab(tabParam);
  if (!tab || !tabs.includes(tab)) return <Navigate to={tabPath(routeId, 'description')} replace />;
  if (!isCanonical(tabParam, tab)) return <Navigate to={tabPath(routeId, tab)} replace />;

  // Each tab's content: beside the sidebar on desktop, in its section on phones (bare: the section
  // is the panel and has the heading).
  const bodies: Record<BuildTab, ReactNode> = {
    description: (
      <DescriptionSection
        description={editor.description}
        editable={editable}
        onChange={editor.setDescription}
        bare={phone}
      />
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
    comments: build ? (
      <CommentsSection buildId={build.id} ownerId={build.ownerId} bare={phone} />
    ) : null,
  };

  return (
    <Page>
      <Back to="/">← All builds</Back>
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
          trackAction={<TrackButton tracking={tracking} guidePath={tabPath(build.id, 'guide')} />}
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
          build={build}
          tracking={tracking}
          bodies={bodies}
        />
      ) : (
        <div>
          <BuildTabs
            buildId={routeId}
            current={tab}
            tabs={tabs}
            commentCount={editable ? undefined : build?.commentCount}
          />
          <WithSidebar>
            <BuildSidebar editable={editable} level={level} />
            <Content>{bodies[tab]}</Content>
          </WithSidebar>
        </div>
      )}
      {editable ? (
        <EditBar aria-label="Save changes">
          <ErrorMessage>{editor.saveError}</ErrorMessage>
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
`;

const Back = styled(TextLink)`
  justify-self: start;
  margin: ${SPACE_MD} 0 -${SPACE_SM};
`;

// The tab's panels, stacked.
const Content = styled.div`
  display: grid;
  gap: ${SPACE_LG};
  min-width: 0;
`;

// Desktop: the sidebar on the left (it sticks under the tab bar itself when it fits), the tab beside it.
const WithSidebar = styled.div`
  align-items: start;
  display: grid;
  gap: ${SPACE_REGION};
  grid-template-columns: ${STATS_COLUMN_WIDTH}px minmax(0, 1fr);
  margin-top: ${SPACE_REGION};
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

const SignInActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: center;
`;

export default BuildEditorPage;
