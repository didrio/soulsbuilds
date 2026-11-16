import { Suspense } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { useAppSelector } from '@/app/hooks';
import { errorMessage } from '@/lib/firebase';
import { firstParagraph } from '@/lib/markdown';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_BG,
  COLOR_LINE_STRONG,
  SHADOW_OVERLAY,
  SHORT_SCREEN,
  SPACE_GUTTER,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  SPACE_XXL,
} from '@/theme';
import BuildDetailsForm from './sections/BuildDetailsForm';
import BuildHeader from './sections/BuildHeader';
import BuildSummary from './sections/BuildSummary';
import BuildTabs, { TAB_BAR_HEIGHT } from './sections/BuildTabs';
import CommentsSection from './sections/CommentsSection';
import DescriptionSection from './sections/DescriptionSection';
import LoadoutPanel from './sections/LoadoutPanel';
import MoreByAuthor from './sections/MoreByAuthor';
import { STATS_COLUMN_WIDTH } from './sections/StatsCard';
import TabLinkCard from './sections/TabLinkCard';
import GuideSection, { hasItems, loadRoute, NextStop } from './guide/GuideSection';
import OwnerActions from './sections/OwnerActions';
import { TrackButton, TrackingHero } from '@/features/tracking/TrackingHero';
import { NewItemsNotice } from '@/features/tracking/TrackingCards';
import { useBuildTracking } from '@/features/tracking/useBuildTracking';
import { selectLevel } from './store/build';
import { parseTab, tabPath, visibleTabs } from './tabs';
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
 * View, create and edit a build (T22, T27, T28): the hero, a tab bar (Loadout, Description, How to
 * get, Comments), then the tab. Desktop: the stats in a fixed left column on every tab: on Loadout
 * one panel with the gear, elsewhere a condensed summary. Tablets and phones: one column, the stats
 * on the Loadout tab only. Editing (and new builds): Loadout and Description only, and a sticky
 * Save/Cancel bar. Tracking (T34, view mode): "Track this build" in the hero, the progress there on
 * every tab, the Loadout tab as a checklist under the route's next stop (T35), and progress along
 * the route on How to get.
 */
function BuildEditor({ buildId, tabParam }: { buildId: string | null; tabParam?: string }) {
  const editor = useBuildEditor(buildId);
  const level = useAppSelector(selectLevel);
  const { auth, build, buildQuery, editable, isNew } = editor;
  const tracking = useBuildTracking(editable ? null : build);
  const routeId = buildId ?? 'new';

  if (isNew) {
    if (auth.loading) return <PageMessage loading />;
    if (!auth.uid) {
      return (
        <PageMessage title="Log in to create a build">
          <p>Use Log in or Sign up at the top of the page, then come back here.</p>
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

  // An unknown tab, or one this build doesn't show (no description, or editing): Loadout.
  const tabs = visibleTabs({ editable, hasDescription: Boolean(build?.description) });
  const tab = parseTab(tabParam);
  if (!tab || !tabs.includes(tab)) return <Navigate to={tabPath(routeId, 'loadout')} replace />;

  const preview = build ? firstParagraph(build.description) : '';

  return (
    <Page>
      <Back to="/">← All builds</Back>
      {editable ? (
        <BuildDetailsForm
          isNew={isNew}
          name={editor.name}
          onAddTag={editor.handleAddTag}
          onNameChange={editor.setName}
          onRemoveTag={editor.handleRemoveTag}
          tags={editor.tags}
        />
      ) : build ? (
        <BuildHeader
          build={build}
          trackAction={<TrackButton tracking={tracking} />}
          progress={
            tracking.state ? <TrackingHero tracking={tracking} buildName={build.name} /> : null
          }
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
      {!editable && tracking.state ? <NewItemsNotice tracking={tracking} /> : null}
      <div>
        <BuildTabs
          buildId={routeId}
          current={tab}
          tabs={tabs}
          commentCount={editable ? undefined : build?.commentCount}
        />
        {tab === 'loadout' ? (
          <Content>
            {!editable && build && tracking.state && hasItems(build.equipment) ? (
              <Suspense fallback={null}>
                <NextStop
                  buildId={build.id}
                  equipment={build.equipment}
                  collected={tracking.state.collected}
                />
              </Suspense>
            ) : null}
            <LoadoutPanel
              editable={editable}
              level={level}
              tracking={
                !editable && tracking.state && tracking.baseline
                  ? {
                      stats: {
                        stats: tracking.state.stats,
                        baseline: tracking.baseline,
                        onChange: tracking.setStat,
                      },
                      loadout: { collected: tracking.state.collected, onToggle: tracking.toggle },
                    }
                  : undefined
              }
            />
            {!editable && build ? (
              <>
                {preview || hasItems(build.equipment) ? (
                  <Cards>
                    {preview ? (
                      <TabLinkCard
                        to={tabPath(build.id, 'description')}
                        label="Description"
                        action="Read the description">
                        {preview}
                      </TabLinkCard>
                    ) : null}
                    {hasItems(build.equipment) ? (
                      <TabLinkCard
                        to={tabPath(build.id, 'route')}
                        label="How to get this build"
                        action="See the route"
                        onPrefetch={() => void loadRoute()}>
                        Every item, in a sensible order through the usual progression from a fresh
                        save.
                      </TabLinkCard>
                    ) : null}
                  </Cards>
                ) : null}
                <MoreByAuthor buildId={build.id} ownerId={build.ownerId} />
              </>
            ) : null}
          </Content>
        ) : (
          <WithSummary>
            <Summary>
              <BuildSummary level={level} />
            </Summary>
            <Content>
              {tab === 'description' ? (
                <DescriptionSection
                  description={editor.description}
                  editable={editable}
                  onChange={editor.setDescription}
                />
              ) : null}
              {tab === 'route' && build ? (
                <GuideSection equipment={build.equipment} collected={tracking.state?.collected} />
              ) : null}
              {tab === 'comments' && build ? (
                <CommentsSection buildId={build.id} ownerId={build.ownerId} />
              ) : null}
            </Content>
          </WithSummary>
        )}
      </div>
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

// A tab's panels, stacked under the tab bar.
const Content = styled.div`
  display: grid;
  gap: ${SPACE_LG};
  margin-top: ${SPACE_REGION};
  min-width: 0;
`;

// The other tabs: the summary column on the left, sticky under the tab bar; the tab beside it. Tablets
// and phones: the tab alone.
const WithSummary = styled.div`
  align-items: start;
  column-gap: ${SPACE_REGION};
  display: grid;
  grid-template-columns: ${STATS_COLUMN_WIDTH}px minmax(0, 1fr);

  @media ${BELOW_TABLET} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Summary = styled.div`
  margin-top: ${SPACE_REGION};
  position: sticky;
  top: ${TAB_BAR_HEIGHT + 16}px;

  @media ${SHORT_SCREEN} {
    position: static;
  }

  @media ${BELOW_TABLET} {
    display: none;
  }
`;

// "Read the description" and "See the route", side by side; stacked on phones.
const Cards = styled.div`
  display: grid;
  gap: ${SPACE_LG};
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;

  @media ${BELOW_MOBILE} {
    grid-auto-flow: row;
  }
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

export default BuildEditorPage;
