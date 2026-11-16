import { useState, type ComponentProps } from 'react';
import styled from 'styled-components';
import { COLOR_TEXT_MUTED, COLOR_TEXT, TEXT_SM } from '@/theme';
import TextInput from './TextInput';
import VisuallyHidden from './VisuallyHidden';

type PasswordInputProps = Omit<ComponentProps<typeof TextInput>, 'type'>;

/**
 * A password field with a Show / Hide toggle inside it (T30), so people can check what they typed
 * instead of typing it twice. Same props as `TextInput`; give it a `<label htmlFor>`.
 */
function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Wrapper>
      <TextInput {...props} type={visible ? 'text' : 'password'} />
      <Toggle type="button" onClick={() => setVisible((shown) => !shown)}>
        {visible ? 'Hide' : 'Show'}
        <VisuallyHidden> password</VisuallyHidden>
      </Toggle>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;

  & > input {
    padding-right: 64px;
  }
`;

const Toggle = styled.button`
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  font: inherit;
  font-size: ${TEXT_SM};
  min-height: 44px;
  min-width: 56px;
  padding: 0 12px;
  position: absolute;
  right: 0;
  top: 0;

  &:hover {
    color: ${COLOR_TEXT};
  }
`;

export default PasswordInput;
