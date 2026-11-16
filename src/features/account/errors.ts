import type { FieldErrors } from '@/features/auth/useFieldErrors';
import { errorField, errorMessage, isWrongPassword } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';

/** The fields of a settings change: the current password, a new email, a new password. */
export type ChangeField = 'current' | 'email' | 'password';

export const WRONG_PASSWORD = 'That’s not your current password.';
export const PASSWORD_TOO_SHORT = `Choose a password of at least ${LIMITS.password} characters.`;

/**
 * An error from a settings change, next to the field it's about. Unlike logging in, a wrong
 * password here can only be the current one, so it says so.
 */
export function changeErrors(error: unknown): FieldErrors<ChangeField> {
  if (isWrongPassword(error)) return { current: WRONG_PASSWORD };
  return { [errorField(error) ?? 'form']: errorMessage(error) };
}
