// Layout pieces shared by the Login and SignUp forms (shown in the auth dialog).
import styled from 'styled-components';
import { COLOR_SUCCESS, COLOR_TEXT_MUTED, TEXT_SM } from '@/theme';
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

export const AuthNotice = styled.p`
  color: ${COLOR_SUCCESS};
  font-size: ${TEXT_SM};
  margin: 0;
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
