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
}

/** "About this build": a markdown editor in edit mode, the sanitized write-up otherwise. */
function DescriptionSection({ description, editable, onChange }: DescriptionSectionProps) {
  if (!editable && !description) return null;
  return (
    <Frame aria-labelledby="about-title">
      <SectionHeading id="about-title">About this build</SectionHeading>
      {editable ? (
        <Hint>How to play it, what it's for, the levels it works at. Markdown works.</Hint>
      ) : null}
      <Suspense fallback={<LoadingAnimation size={30} />}>
        {editable ? (
          <MarkdownEditor value={description} onChange={onChange} />
        ) : (
          <MarkdownView source={description} />
        )}
      </Suspense>
    </Frame>
  );
}

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_SM};
`;

export default DescriptionSection;
