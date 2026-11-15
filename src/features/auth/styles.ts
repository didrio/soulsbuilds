// Layout pieces shared by the Login and SignUp forms.
import styled from 'styled-components';
import { COLOR_LIGHTEST_GREEN } from '@/theme';

export const AuthForm = styled.form`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
`;

export const AuthField = styled.div`
  display: flex;
  flex-direction: column;
  width: 200px;

  & > label {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 2px;
    text-transform: uppercase;
  }
`;

export const LinkButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
`;

export const AuthNotice = styled.p`
  color: ${COLOR_LIGHTEST_GREEN};
  font-size: 14px;
  margin: 0;
`;
