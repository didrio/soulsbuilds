import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import DropDown from '@/components/ui/DropDown';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FocusScope from '@/components/ui/FocusScope';
import TextAreaInput from '@/components/ui/TextAreaInput';
import useAuth from '@/features/auth/useAuth';
import { errorMessage, type ReportTarget } from '@/lib/firebase';
import { LIMITS, REPORT_REASONS, type ReportReason } from '@/lib/models';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  FONT_BODY,
  SPACE_MD,
  SPACE_SM,
} from '@/theme';
import { useReport } from './queries';

const reasonByLabel = Object.fromEntries(
  Object.entries(REPORT_REASONS).map(([reason, label]) => [label, reason as ReportReason]),
);

interface ReportButtonProps {
  target: ReportTarget;
  /** The content's author: they can't report their own. */
  authorId: string;
  /** What is reported, for the accessible names ("build", "comment"). */
  kind: 'build' | 'comment';
  /** Where the form sits when open: under a centered title, or left-aligned in a list. */
  align?: 'center' | 'start';
}

/**
 * A "Report" link-style button that opens a small inline form (reason + optional note). Hidden when
 * signed out and on your own content. Escape or Cancel closes it.
 */
function ReportButton({ target, authorId, kind, align = 'start' }: ReportButtonProps) {
  const { uid } = useAuth();
  const report = useReport(target, uid);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');

  if (!uid || uid === authorId) return null;

  if (report.data) {
    return (
      <Done role="status">
        {report.data === 'reported'
          ? 'Thanks, an admin will take a look.'
          : `You already reported this ${kind}.`}
      </Done>
    );
  }

  const close = () => {
    setOpen(false);
    report.reset();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (reason) report.mutate({ reason, note });
  };

  return (
    <>
      <LinkButton
        type="button"
        aria-expanded={open}
        aria-label={`Report this ${kind}`}
        onClick={() => (open ? close() : setOpen(true))}>
        Report
      </LinkButton>
      {open ? (
        // Focuses the reason; Escape closes and focus returns to "Report".
        <FormScope onEscape={close} $align={align}>
          <Form aria-label={`Report this ${kind}`} onSubmit={handleSubmit}>
            <DropDown
              label="Reason"
              options={Object.values(REPORT_REASONS)}
              placeholder="Choose a reason"
              value={reason ? REPORT_REASONS[reason] : ''}
              onChange={(label) => setReason(label ? (reasonByLabel[label] ?? null) : null)}
            />
            <NoteContainer>
              <TextAreaInput
                aria-label="Details (optional)"
                placeholder="Details (optional)"
                maxLength={LIMITS.reportNote}
                rows={3}
                value={note}
                onChange={setNote}
              />
            </NoteContainer>
            <ErrorMessage>{report.error ? errorMessage(report.error) : ''}</ErrorMessage>
            <Actions>
              <Button type="submit" disabled={!reason || report.isPending}>
                Send report
              </Button>
              <LinkButton type="button" onClick={close}>
                Cancel
              </LinkButton>
            </Actions>
          </Form>
        </FormScope>
      ) : null}
    </>
  );
}

const LinkButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
`;

const FormScope = styled(FocusScope)<{ $align: 'center' | 'start' }>`
  display: flex;
  flex-basis: 100%;
  justify-content: ${({ $align }) => $align};
  width: 100%;
`;

const Form = styled.form`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  box-sizing: border-box;
  display: flex;
  flex-basis: 100%;
  flex-direction: column;
  gap: ${SPACE_SM};
  max-width: 400px;
  padding: 12px;
  width: 100%;
  font-family: ${FONT_BODY};
`;

const NoteContainer = styled.div`
  height: 80px;
`;

const Actions = styled.div`
  align-items: center;
  display: flex;
  gap: ${SPACE_MD};
`;

const Done = styled.span`
  color: ${COLOR_LIGHTEST_GREEN};
  font-size: 14px;
`;

export default ReportButton;
