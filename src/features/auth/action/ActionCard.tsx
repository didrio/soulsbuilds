import type { ReactNode } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import PageHero from '@/components/ui/PageHero';
import { COLOR_TEXT, SPACE_REGION, TEXT_MD } from '@/theme';

/** A page for one email link's outcome (T43): a title, and a card with the text and what to do next. */
function ActionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PageHero title={title} />
      <Card>{children}</Card>
    </>
  );
}

const Card = styled(Frame)`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: ${SPACE_REGION} 0 0;
  max-width: 480px;

  & > p {
    color: ${COLOR_TEXT};
    font-size: ${TEXT_MD};
    line-height: 1.6;
    margin: 0;
  }

  & > form {
    align-self: stretch;
  }
`;

export default ActionCard;
