import { lazy, Suspense } from 'react';
import styled from 'styled-components';
import { useAppSelector } from '@/app/hooks';
import Frame from '@/components/ui/Frame';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import SectionHeading from '@/components/ui/SectionHeading';
import { COLOR_TEXT_MUTED, SPACE_MD, SPACE_SM, TEXT_SM } from '@/theme';
import { describeBuild, GENERATED_NOTE } from '../describe';
import { selectDescriptionFacts } from '../store/derived';

// The markdown editor is large: load it only when a description is edited (view mode has a light renderer).
const MarkdownEditor = lazy(() =>
  import('./Markdown').then((module) => ({ default: module.MarkdownEditor })),
);
const MarkdownView = lazy(() => import('./MarkdownView'));

interface DescriptionSectionProps {
  description: string;
  editable: boolean;
  onChange: (description: string) => void;
  /** The phone's Description section (T49): no panel or heading of its own. */
  bare?: boolean;
}

/**
 * "About this build": a markdown editor in edit mode, the sanitized write-up otherwise, or (T47) a short
 * one generated from the build when the author wrote none.
 */
function DescriptionSection({
  description,
  editable,
  onChange,
  bare = false,
}: DescriptionSectionProps) {
  const facts = useAppSelector(selectDescriptionFacts);
  const generated = !editable && !description;
  const body = (
    <>
      {editable ? (
        <Hint>How to play it, what it's for, the levels it works at. Markdown works.</Hint>
      ) : null}
      <Suspense fallback={<LoadingAnimation size={30} />}>
        {editable ? (
          <MarkdownEditor value={description} onChange={onChange} />
        ) : (
          <MarkdownView source={generated ? describeBuild(facts) : description} />
        )}
      </Suspense>
      {generated ? <Note>{GENERATED_NOTE}</Note> : null}
    </>
  );
  if (bare) return <div>{body}</div>;
  return (
    <Frame aria-labelledby="about-title">
      <SectionHeading id="about-title">About this build</SectionHeading>
      {body}
    </Frame>
  );
}

const Note = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: ${SPACE_MD} 0 0;
`;

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_SM};
`;

export default DescriptionSection;
