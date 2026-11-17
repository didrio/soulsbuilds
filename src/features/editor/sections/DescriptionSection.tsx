import { lazy, Suspense } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import SectionHeading from '@/components/ui/SectionHeading';
import { COLOR_TEXT_MUTED, SPACE_SM, TEXT_SM } from '@/theme';

// The markdown editor is large: load it only when a description is edited (view mode has a light renderer).
const MarkdownEditor = lazy(() =>
  import('./Markdown').then((module) => ({ default: module.MarkdownEditor })),
);
const MarkdownView = lazy(() => import('./MarkdownView'));

interface DescriptionSectionProps {
  description: string;
  editable: boolean;
  onChange: (description: string) => void;
  /** In a phone section (T49): no panel or heading of its own. */
  bare?: boolean;
}

/**
 * The author's write-up: a markdown editor in edit mode (on the Equipment tab, under the equipment),
 * the sanitized markdown otherwise, at the top of the discussion tab like a pinned post (T63; on phones
 * its own Write-up section, T71). The page
 * leaves it out when the author wrote none.
 */
function DescriptionSection({
  description,
  editable,
  onChange,
  bare = false,
}: DescriptionSectionProps) {
  const body = (
    <>
      {editable ? (
        <Hint>
          How to play it, what it’s for, the levels it works at. Shown on the build’s Write-up &
          comments tab, above the comments. Markdown works.
        </Hint>
      ) : null}
      <Suspense fallback={<LoadingAnimation size={30} />}>
        {editable ? (
          <MarkdownEditor value={description} onChange={onChange} />
        ) : (
          <MarkdownView source={description} />
        )}
      </Suspense>
    </>
  );
  if (bare) return <div>{body}</div>;
  return (
    <Frame aria-labelledby="about-title">
      <SectionHeading id="about-title">Write-up</SectionHeading>
      {body}
    </Frame>
  );
}

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_SM};
`;

export default DescriptionSection;
