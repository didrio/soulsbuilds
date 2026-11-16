// Layout pieces shared by the auth dialog's views (and the delete-account form).
import styled from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_SUCCESS,
  COLOR_TEXT_MUTED,
  SPACE_SM,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { labelText } from '@/components/ui/typography';

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;

  & > button[type='submit'] {
    margin-top: 6px;
    width: 100%;
  }
`;

export const AuthField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  & > label {
    ${labelText}
  }
`;

/** A short note under a field ("At least 8 characters."). */
export const FieldHint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  margin: 0;
`;

/** The error about one field, under it (the field points to it with aria-describedby). */
export const FieldError = styled.p`
  color: ${COLOR_DANGER};
  font-size: ${TEXT_SM};
  margin: 0;
`;

export const AuthNotice = styled.p`
  color: ${COLOR_SUCCESS};
  font-size: ${TEXT_SM};
  margin: 0;
`;

/** A sentence of context at the top of a view. */
export const AuthLead = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

/** "or", between "Continue with Google" and the email form. */
export const AuthDivider = styled.p`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_XS};
  gap: ${SPACE_SM};
  margin: 2px 0;

  &::before,
  &::after {
    border-top: 1px solid ${COLOR_LINE};
    content: '';
    flex: 1;
  }
`;

/** The small print under the sign-up button, with inline links. */
export const AuthFinePrint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  margin: 0;
  text-align: center;

  & a {
    color: ${COLOR_ACCENT};
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

/** "New here? Sign up" under the form. */
export const AuthSwitch = styled.p`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_SM};
  gap: 4px;
  justify-content: center;
  margin: 4px 0 0;
`;
