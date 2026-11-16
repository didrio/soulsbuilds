// Layout pieces shared by the Account page's sections (T31).
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import { labelText } from '@/components/ui/typography';
import { BELOW_MOBILE, COLOR_LINE, COLOR_TEXT_MUTED, SPACE_MD, SPACE_SM, TEXT_SM } from '@/theme';

/** One settings group: a panel with a heading. */
export const Section = styled(Frame)`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_MD};

  & > h2 {
    margin: 0;
  }
`;

/** A settings form: fields at a readable width, the submit button at its own width. */
export const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 420px;

  & > button[type='submit'] {
    align-self: flex-start;
  }
`;

/** "Email · you@example.com · Verified": a label, a value, and actions or a status. */
export const Row = styled.div`
  align-items: center;
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_MD};
  padding-top: ${SPACE_SM};

  @media ${BELOW_MOBILE} {
    row-gap: 2px;
  }

  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
`;

export const RowLabel = styled.span`
  ${labelText}
  min-width: 120px;

  @media ${BELOW_MOBILE} {
    flex-basis: 100%;
  }
`;

export const RowValue = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

/** A muted status next to a value ("Verified"). */
export const RowStatus = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

/** Under a section's heading, before its rows. */
export const SectionLead = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: -6px 0 0;
`;

/** A form's buttons: submit, then Cancel. */
export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
`;
