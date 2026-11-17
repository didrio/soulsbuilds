import CommentsSection from './CommentsSection';
import DescriptionSection from './DescriptionSection';

/**
 * The discussion tab on desktop (T63): like a post and its replies. The author's write-up, when there
 * is one, at the top (a pinned post: it isn't a comment, so the tab's count leaves it out), then the
 * comments. The tab is labelled for it ("Write-up & comments", T71). Phones show the two as their own
 * sections (`BuildSections`).
 */
function DiscussionSection({
  buildId,
  ownerId,
  description,
}: {
  buildId: string;
  ownerId: string;
  description: string;
}) {
  return (
    <>
      {description.trim() !== '' ? (
        <DescriptionSection description={description} editable={false} onChange={() => {}} />
      ) : null}
      <CommentsSection buildId={buildId} ownerId={ownerId} />
    </>
  );
}

export default DiscussionSection;
