import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { errorField, errorMessage } from '@/lib/firebase';

/** Errors by field, plus `form` for the ones about the whole form. */
export type FieldErrors<Field extends string> = Partial<Record<Field | 'form', string>>;

/** An Auth error as field errors: next to the field it's about, or for the form. */
export function authErrors(error: unknown): FieldErrors<'email' | 'password'> {
  return { [errorField(error) ?? 'form']: errorMessage(error) };
}

/**
 * A form's errors (T30): each shows next to its field, and showing them moves focus to the first
 * field (in `fields` order) that has one, so keyboard and screen-reader users land on the problem.
 */
export function useFieldErrors<Field extends string>(fields: readonly Field[]) {
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  const show = (next: FieldErrors<Field>) => {
    // Rendered before focusing, so the field's aria-describedby already names its error.
    flushSync(() => setErrors(next));
    const first = fields.find((field) => next[field]);
    if (first) inputs.current[first]?.focus();
  };

  /** The `ref` for a field's input. */
  const ref = (field: Field) => (element: HTMLInputElement | null) => {
    inputs.current[field] = element;
  };

  /** An `onChange` for a field: sets the value and drops that field's error, now out of date. */
  const edit = (field: Field, setValue: (value: string) => void) => (value: string) => {
    setValue(value);
    if (errors[field]) setErrors(({ [field]: _gone, ...rest }) => rest as FieldErrors<Field>);
  };

  return { errors, show, clear: () => setErrors({}), ref, edit };
}
