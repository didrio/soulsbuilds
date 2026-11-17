import { useEffect, useRef, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TextAreaInput from '@/components/ui/TextAreaInput';
import { TextButton } from '@/components/ui/TextButton';
import { labelText } from '@/components/ui/typography';
import { useOpenAuthDialog } from '@/app/authDialog';
import { errorMessage } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import { SPACE_SM } from '@/theme';

/**
 * The comment box: the post form under the comments, and a reply form under a thread (T62). Signed
 * out, it's one "Log in to comment" button. `onSubmit` gets the text and a callback that clears it.
 */
function CommentForm({
  id,
  label,
  placeholder,
  initialText = '',
  signedIn,
  pending,
  error,
  submitLabel,
  onSubmit,
  onCancel,
  focus = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  initialText?: string;
  signedIn: boolean;
  pending: boolean;
  error: unknown;
  submitLabel: string;
  onSubmit: (text: string, clear: () => void) => void;
  onCancel?: () => void;
  /** Focus the box when it opens, the caret after `initialText` (a reply). */
  focus?: boolean;
}) {
  const [text, setText] = useState(initialText);
  const field = useRef<HTMLTextAreaElement>(null);
  const openAuthDialog = useOpenAuthDialog();

  useEffect(() => {
    const element = field.current;
    if (!focus || !element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [focus]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) onSubmit(text, () => setText(''));
  };

  // Signed out there's nothing to type into: one button that opens the log in dialog.
  if (!signedIn)
    return (
      <Form as="div">
        <Button variant="secondary" onClick={() => openAuthDialog('login')}>
          Log in to comment
        </Button>
      </Form>
    );

  return (
    <Form onSubmit={handleSubmit}>
      <Label htmlFor={id}>{label}</Label>
      <TextAreaInput
        ref={field}
        id={id}
        disabled={pending}
        maxLength={LIMITS.comment}
        onChange={setText}
        placeholder={placeholder}
        rows={3}
        value={text}
      />
      <ErrorMessage>{error ? errorMessage(error) : ''}</ErrorMessage>
      <Actions>
        <Button type="submit" disabled={!text.trim() || pending}>
          {submitLabel}
        </Button>
        {onCancel ? <TextButton onClick={onCancel}>Cancel</TextButton> : null}
      </Actions>
    </Form>
  );
}

const Form = styled.form`
  display: grid;
  gap: ${SPACE_SM};
`;

const Label = styled.label`
  ${labelText}
`;

const Actions = styled.div`
  align-items: center;
  display: flex;
  gap: ${SPACE_SM};
`;

export default CommentForm;
