import { Link, useParams } from 'react-router';
import styled, { css } from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { useAppSelector } from '@/app/hooks';
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
import CommentsSection from './sections/CommentsSection';
import DescriptionSection from './sections/DescriptionSection';
import Loadout from './sections/Loadout';
import MoreByAuthor from './sections/MoreByAuthor';
import GuideSection from './guide/GuideSection';
import OwnerActions from './sections/OwnerActions';
import StatsCard from './sections/StatsCard';
import { selectLevel } from './store/build';
import { useBuildEditor } from './useBuildEditor';

/** `/build/:buildId` (or `/build/new`): one editor per build, so state never leaks between builds. */
function BuildEditorPage() {
  const { buildId = 'new' } = useParams();
  const id = buildId === 'new' ? null : buildId;
  return <BuildEditor key={buildId} buildId={id} />;
}

/**
 * View, create and edit a build in one layout (T22, T27): the title pane, the loadout across the page,
 * the write-up beside the stats card (on tablets and phones: the stats card, the loadout, then the
 * write-up), then "How to get this build" (collapsed) and comments across the page. Edit mode turns the same panels into controls,
 * leaves out the guide and comments, and adds a sticky Save/Cancel bar.
 */
function BuildEditor({ buildId }: { buildId: string | null }) {
  const editor = useBuildEditor(buildId);
  const level = useAppSelector(selectLevel);
  const { auth, build, buildQuery, editable, isNew } = editor;

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
      <Layout>
        <LoadoutArea>
          <Loadout editable={editable} />
        </LoadoutArea>
        <Main>
          <DescriptionSection
            description={editor.description}
            editable={editable}
            onChange={editor.setDescription}
          />
        </Main>
        <Aside>
          <StatsCard editable={editable} level={level} />
        </Aside>
      </Layout>
      {!editable && build ? <GuideSection equipment={build.equipment} /> : null}
      {!editable && build ? <CommentsSection buildId={build.id} ownerId={build.ownerId} /> : null}
      {!editable && build ? <MoreByAuthor buildId={build.id} ownerId={build.ownerId} /> : null}
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

// The loadout across the page, then the write-up + the 340 px stats card; on tablets and phones one
// column, the stats card first (T27).
const Layout = styled.div`
  align-items: start;
  display: grid;
  gap: ${SPACE_LG} ${SPACE_REGION};
  grid-template-areas: 'loadout loadout' 'main aside';
  grid-template-columns: minmax(0, 1fr) 340px;

  @media ${BELOW_TABLET} {
    grid-template-areas: 'aside' 'loadout' 'main';
    grid-template-columns: minmax(0, 1fr);
  }
`;

const LoadoutArea = styled.div`
  grid-area: loadout;
  min-width: 0;
`;

const column = css`
  display: grid;
  gap: ${SPACE_REGION};
  min-width: 0;
`;

const Main = styled.div`
  ${column}
  grid-area: main;
`;

const Aside = styled.aside`
  ${column}
  grid-area: aside;
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
