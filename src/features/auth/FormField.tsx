import type { ComponentProps } from 'react';
import PasswordInput from '@/components/ui/PasswordInput';
import TextInput from '@/components/ui/TextInput';
import { AuthField, FieldError, FieldHint } from './styles';

type FormFieldProps = ComponentProps<typeof TextInput> & {
  id: string;
  label: string;
  /** Shown under the field and tied to it (aria-invalid, aria-describedby). */
  error?: string;
  hint?: string;
  /** A password field with a Show / Hide toggle. */
  password?: boolean;
};

/** A labelled text field for the auth forms: its hint and its own error sit right under it. */
function FormField({ id, label, error, hint, password = false, ...input }: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const Input = password ? PasswordInput : TextInput;
  return (
    <AuthField>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...input}
      />
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </AuthField>
  );
}

export default FormField;
