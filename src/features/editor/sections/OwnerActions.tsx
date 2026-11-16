import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { COLOR_TEXT, TEXT_SM } from '@/theme';

interface OwnerActionsProps {
  confirmingDelete: boolean;
  deleting: boolean;
  deleteError: string;
  onEdit: () => void;
  onAskDelete: (asking: boolean) => void;
  onDelete: () => void;
}

/** The build owner's Edit and Delete, with an inline "are you sure?" step before deleting. */
function OwnerActions({
  confirmingDelete,
  deleting,
  deleteError,
  onEdit,
  onAskDelete,
  onDelete,
}: OwnerActionsProps) {
  if (confirmingDelete) {
    return (
      <>
        <Question>Delete this build, with its likes and comments? This can’t be undone.</Question>
        <Button variant="danger" onClick={onDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </Button>
        <Button variant="secondary" onClick={() => onAskDelete(false)} disabled={deleting}>
          Keep it
        </Button>
        {deleteError ? (
          <Full>
            <ErrorMessage>{deleteError}</ErrorMessage>
          </Full>
        ) : null}
      </>
    );
  }
  return (
    <>
      <Button variant="secondary" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="ghost" onClick={() => onAskDelete(true)}>
        Delete build
      </Button>
    </>
  );
}

// Inside the title block's wrapping actions row: these take a line of their own.
const Full = styled.div`
  flex-basis: 100%;
`;

const Question = styled.p`
  color: ${COLOR_TEXT};
  flex-basis: 100%;
  font-size: ${TEXT_SM};
  margin: 0;
`;

export default OwnerActions;
