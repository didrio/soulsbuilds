import { Link, useParams } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageMessage from '@/components/ui/PageMessage';
import { useAppSelector } from '@/app/hooks';
import { errorMessage } from '@/lib/firebase';
import { BELOW_1100 } from '@/theme';
import BuildDetailsForm from './sections/BuildDetailsForm';
import BuildTags from './sections/BuildTags';
import BuildTitle from './sections/BuildTitle';
import CommentsSection from './sections/CommentsSection';
import DescriptionSection from './sections/DescriptionSection';
import EquipmentEditor from './sections/EquipmentEditor';
import SpellEditor from './sections/SpellEditor';
import StatEditor from './sections/StatEditor';
import TearEditor from './sections/TearEditor';
import { selectLevel } from './store/build';
import { EditorContainer } from './styles';
import { useBuildEditor } from './useBuildEditor';

/** `/build/:buildId` (or `/build/new`): one editor per build, so state never leaks between builds. */
function BuildEditorPage() {
  const { buildId = 'new' } = useParams();
  const id = buildId === 'new' ? null : buildId;
  return <BuildEditor key={buildId} buildId={id} />;
}

/** View, create and edit a build in one page, plus likes, comments and delete. */
function BuildEditor({ buildId }: { buildId: string | null }) {
  const editor = useBuildEditor(buildId);
  const level = useAppSelector(selectLevel);
  const { auth, build, buildQuery, editable, isNew } = editor;

  if (isNew) {
    if (auth.loading) return <PageMessage loading />;
    if (!auth.uid) {
      return (
        <PageMessage title="Log in to create a build">
          <p>Use Login or Register at the top of the page, then come back here.</p>
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
    <Container>
      {!editable && build ? <BuildTitle build={build} /> : null}
      <UpperSection>
        <LeftColumn vertical>
          {editable ? (
            <BuildDetailsForm
              name={editor.name}
              onAddTag={editor.handleAddTag}
              onNameChange={editor.setName}
              onRemoveTag={editor.handleRemoveTag}
              tags={editor.tags}
            />
          ) : null}
          <EditorContainer>
            <EquipmentEditor editable={editable} />
          </EditorContainer>
        </LeftColumn>
        <RightColumn vertical>
          <EditorContainer>
            <StatEditor editable={editable} level={level} />
          </EditorContainer>
          <EditorContainer>
            <TearEditor editable={editable} />
          </EditorContainer>
          <EditorContainer>
            <SpellEditor editable={editable} />
          </EditorContainer>
        </RightColumn>
      </UpperSection>
      <LowerSection vertical>
        <DescriptionSection
          description={editor.description}
          editable={editable}
          onChange={editor.setDescription}
        />
        {editable || editor.tags.length === 0 ? null : <BuildTags tags={editor.tags} />}
        {editable ? (
          <Actions vertical>
            <ErrorMessage>{editor.saveError}</ErrorMessage>
            {editor.saving ? (
              <LoadingAnimation size={30} />
            ) : (
              <FlexGroup>
                <Button onClick={editor.handleSave}>Save</Button>
                <SecondaryButton onClick={editor.handleCancel}>Cancel</SecondaryButton>
              </FlexGroup>
            )}
          </Actions>
        ) : null}
        {!editable && editor.isOwner ? (
          <Actions vertical>
            <ErrorMessage>{editor.deleteError}</ErrorMessage>
            {editor.confirmingDelete ? (
              <>
                <p>Delete this build, with its likes and comments? This can’t be undone.</p>
                {editor.deleting ? (
                  <LoadingAnimation size={30} />
                ) : (
                  <FlexGroup>
                    <Button onClick={editor.handleDelete}>Yes, delete</Button>
                    <SecondaryButton onClick={() => editor.setConfirmingDelete(false)}>
                      Keep it
                    </SecondaryButton>
                  </FlexGroup>
                )}
              </>
            ) : (
              <FlexGroup>
                <Button onClick={editor.handleEdit}>Edit</Button>
                <SecondaryButton onClick={() => editor.setConfirmingDelete(true)}>
                  Delete build
                </SecondaryButton>
              </FlexGroup>
            )}
          </Actions>
        ) : null}
        {!editable && build ? <CommentsSection buildId={build.id} /> : null}
      </LowerSection>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  flex-direction: column;
  align-items: center;
`;

const UpperSection = styled(FlexGroup)`
  min-height: 400px;
  width: 100%;

  @media ${BELOW_1100} {
    flex-direction: column;
  }
`;

const LowerSection = styled(FlexGroup)`
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 20px;
  width: 95%;
`;

const LeftColumn = styled(FlexGroup)`
  max-width: 50%;
  width: 50%;
  align-items: center;

  @media ${BELOW_1100} {
    max-width: 100%;
    width: 100%;
  }
`;

const RightColumn = styled(FlexGroup)`
  max-width: 50%;
  width: 50%;
  align-items: center;

  @media ${BELOW_1100} {
    max-width: 100%;
    width: 100%;
  }
`;

const Actions = styled(EditorContainer)`
  align-items: center;
  margin-top: 30px;
  text-align: center;
  width: 100%;
`;

const SecondaryButton = styled(Button)`
  margin-left: 20px;
`;

export default BuildEditorPage;
