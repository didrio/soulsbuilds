import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router';
import styled, { css } from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Ornament from '@/components/ui/Ornament';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { useAppSelector } from '@/app/hooks';
import { errorMessage } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_BG,
  COLOR_FRAME,
  SHADOW_OVERLAY,
  SPACE_GUTTER,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XXL,
} from '@/theme';
import BuildDetailsForm from './sections/BuildDetailsForm';
import BuildHeader from './sections/BuildHeader';
import CommentsSection from './sections/CommentsSection';
import DescriptionSection from './sections/DescriptionSection';
import EquipmentEditor from './sections/EquipmentEditor';
import OwnerActions from './sections/OwnerActions';
import SpellEditor from './sections/SpellEditor';
import StatEditor from './sections/StatEditor';
import { selectLevel } from './store/build';
import { useBuildEditor } from './useBuildEditor';

// The route needs the ~400 KB acquisition data: its own chunk, loaded on the build view only.
const GuideSection = lazy(() => import('./guide/GuideSection'));

/** `/build/:buildId` (or `/build/new`): one editor per build, so state never leaks between builds. */
function BuildEditorPage() {
  const { buildId = 'new' } = useParams();
  const id = buildId === 'new' ? null : buildId;
  return <BuildEditor key={buildId} buildId={id} />;
}

/**
 * View, create and edit a build in one layout: the title block, then equipment, the write-up and
 * comments, with attributes and spells in a side panel (above everything on phones). Edit mode turns
 * the same panels into controls and adds a sticky Save/Cancel bar.
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
    <>
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
      <Ornament />
      <Layout>
        <Main>
          <EquipmentEditor editable={editable} />
          {!editable && build ? (
            <Suspense fallback={null}>
              <GuideSection equipment={build.equipment} />
            </Suspense>
          ) : null}
          <DescriptionSection
            description={editor.description}
            editable={editable}
            onChange={editor.setDescription}
          />
          {!editable && build ? <CommentsSection buildId={build.id} /> : null}
        </Main>
        <Aside>
          <StatEditor editable={editable} level={level} />
          <SpellEditor editable={editable} />
        </Aside>
      </Layout>
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
    </>
  );
}

const Back = styled(TextLink)`
  margin-top: ${SPACE_MD};
`;

// Main column + a 330 px side panel; on tablets and phones one column with the side panel first.
const Layout = styled.div`
  align-items: start;
  display: grid;
  gap: ${SPACE_LG};
  grid-template-areas: 'main aside';
  grid-template-columns: minmax(0, 1fr) 330px;
  margin-bottom: ${SPACE_XXL};

  @media ${BELOW_TABLET} {
    grid-template-areas: 'aside' 'main';
    grid-template-columns: minmax(0, 1fr);
  }
`;

const column = css`
  display: grid;
  gap: ${SPACE_LG};
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
  border-top: 1px solid ${COLOR_FRAME};
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
