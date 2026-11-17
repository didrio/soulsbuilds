import styled from 'styled-components';
import Label from '@/components/ui/Label';
import { COLOR_LINE, SPACE_LG, SPACE_MD, SPACE_SM } from '@/theme';
import CommentsSection from './CommentsSection';
import DescriptionSection from './DescriptionSection';

/**
 * The Discussion tab (T63): like a post and its replies. The author's write-up, when there is one, at
 * the top (a pinned post: it isn't a comment, so the tab's count leaves it out), then the comments.
 * `bare`: the phone's Discussion section, one body with a "Comments" label between the two.
 */
function DiscussionSection({
  buildId,
  ownerId,
  description,
  bare = false,
}: {
  buildId: string;
  ownerId: string;
  description: string;
  bare?: boolean;
}) {
  const written = description.trim() !== '';
  const comments = <CommentsSection buildId={buildId} ownerId={ownerId} bare={bare} />;
  if (!written) return comments;
  const writeUp = (
    <DescriptionSection
      description={description}
      editable={false}
      onChange={() => {}}
      bare={bare}
    />
  );
  if (!bare) {
    return (
      <>
        {writeUp}
        {comments}
      </>
    );
  }
  return (
    <div>
      {writeUp}
      <CommentsHead>
        <Label as="h3">Comments</Label>
      </CommentsHead>
      {comments}
    </div>
  );
}

const CommentsHead = styled.div`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: ${SPACE_LG};
  padding-top: ${SPACE_MD};

  h3 {
    margin: 0 0 ${SPACE_SM};
  }
`;

export default DiscussionSection;
