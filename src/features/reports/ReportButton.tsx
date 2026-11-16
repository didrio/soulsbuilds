import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import DropDown from '@/components/ui/DropDown';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FocusScope from '@/components/ui/FocusScope';
import TextAreaInput from '@/components/ui/TextAreaInput';
import { TextButton } from '@/components/ui/TextButton';
import useAuth from '@/features/auth/useAuth';
import { errorMessage, type ReportTarget } from '@/lib/firebase';
import { LIMITS, REPORT_REASONS, type ReportReason } from '@/lib/models';
import {
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT_MUTED,
  SHADOW_OVERLAY,
  SPACE_MD,
  SPACE_SM,
  TEXT_SM,
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
  /** A ghost button (title blocks) or a text link (comment rows). */
  appearance?: 'button' | 'text';
}

/**
 * A "Report" link-style button that opens a small inline form (reason + optional note). Hidden when
 * signed out and on your own content. Escape or Cancel closes it.
 */
function ReportButton({
  target,
  authorId,
  kind,
  align = 'start',
  appearance = 'text',
}: ReportButtonProps) {
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

  const toggleProps = {
    'aria-expanded': open,
    'aria-label': `Report this ${kind}`,
    onClick: () => (open ? close() : setOpen(true)),
  };

  return (
    <>
      {appearance === 'button' ? (
        <Button variant="ghost" {...toggleProps}>
          Report
        </Button>
      ) : (
        <TextButton {...toggleProps}>Report</TextButton>
      )}
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
              <TextButton onClick={close}>Cancel</TextButton>
            </Actions>
          </Form>
        </FormScope>
      ) : null}
    </>
  );
}

const FormScope = styled(FocusScope)<{ $align: 'center' | 'start' }>`
  display: flex;
  flex-basis: 100%;
  justify-content: ${({ $align }) => $align};
  width: 100%;
`;

const Form = styled.form`
  background-color: ${COLOR_SURFACE_RAISED};
  border: 1px solid ${COLOR_LINE};
  box-shadow: ${SHADOW_OVERLAY};
  display: flex;
  flex-basis: 100%;
  flex-direction: column;
  gap: ${SPACE_SM};
  max-width: 400px;
  padding: ${SPACE_MD};
  text-align: left;
  width: 100%;
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
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

export default ReportButton;
