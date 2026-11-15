import styled from 'styled-components';
import Button from '@/components/ui/Button';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { useAppSelector } from '@/app/hooks';
import useAuth from '@/features/auth/useAuth';
import useUser from '@/features/auth/useUser';
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
import { useBuildComments } from './useBuildComments';
import { useBuildEditor } from './useBuildEditor';
import { useLikeBuild } from './useLikeBuild';

/**
 * `/build/:buildId`: view, create (`/build/new`) and edit a build in one page, plus likes and
 * comments. Slots live in Redux (./store); everything else in the hooks.
 */
function BuildEditorPage() {
  const auth = useAuth();
  const loggedInUser = useUser();
  const editor = useBuildEditor(auth);
  const { buildId, editable, setLikes } = editor;
  const level = useAppSelector(selectLevel);
  const { handleLike } = useLikeBuild({ auth, buildId, loggedInUser, setLikes });

  const isLoggedIn = Boolean(auth && auth.uid && loggedInUser);
  const comments = useBuildComments({ auth, buildId, comments: editor.comments, isLoggedIn });

  if (auth === null) {
    return null;
  }

  if (editor.loading) {
    return (
      <LoadingContainer>
        <LoadingAnimation size={50} />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      {editable ? null : (
        <BuildTitle
          buildUser={editor.buildUser}
          canLike={Boolean(auth && loggedInUser)}
          likes={editor.likes}
          name={editor.name}
          onLike={handleLike}
        />
      )}
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
        {editable || editor.tags.length <= 0 ? null : <BuildTags tags={editor.tags} />}
        {editable ? (
          <SaveContainer>
            {editor.saveLoading ? (
              <LoadingAnimation size={30} />
            ) : (
              <Button disabled={editor.saveLoading || !isLoggedIn} onClick={editor.handleSave}>
                Save
              </Button>
            )}
          </SaveContainer>
        ) : null}
        {!editable && editor.userOwnsBuild ? (
          <EditContainer>
            <Button onClick={editor.handleEdit}>Edit</Button>
          </EditContainer>
        ) : null}
        {editable ? null : (
          <CommentsSection
            commentText={comments.commentText}
            commentUsers={comments.commentUsers}
            isLoggedIn={isLoggedIn}
            onCommentTextChange={comments.setCommentText}
            onPost={comments.handleSaveComment}
            saveCommentLoading={comments.saveCommentLoading}
            sortedComments={comments.sortedComments}
          />
        )}
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

const LoadingContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  min-height: 400px;
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

const SaveContainer = styled(EditorContainer)`
  justify-content: center;
  margin-top: 50px;
  margin-bottom: -10px;
  width: 100%;

  & > button {
    width: 250px;
  }
`;

const EditContainer = styled(EditorContainer)`
  justify-content: center;
  margin-top: 20px;
  width: 100%;

  & > button {
    width: 250px;
  }
`;

export default BuildEditorPage;
