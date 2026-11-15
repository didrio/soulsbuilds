import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';
import { COLOR_GREEN, COLOR_LIGHT_GREEN, COLOR_GOLD, COLOR_DARK_GREEN, FONT_BODY } from '@/theme';

type TextInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'> & {
  centered?: boolean;
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
};

/** A styled text input. Other `<input>` props (placeholder, aria-label, onBlur…) pass through. */
function TextInput({ centered = false, onChange, type = 'text', ...rest }: TextInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, e);
  };

  return <Container $centered={centered} onChange={handleChange} type={type} {...rest} />;
}

const Container = styled.input<{ $centered: boolean }>`
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  padding: 5px 10px;
  outline: none;
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  font-size: 16px;
  text-align: ${({ $centered }) => ($centered ? 'center' : 'left')};
  font-family: ${FONT_BODY};
  box-shadow: inset 0 0 3px ${COLOR_DARK_GREEN};

  &::placeholder {
    color: ${COLOR_GOLD};
    opacity: 0.5;
  }

  &:focus-visible {
    border-color: ${COLOR_GOLD};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

export default TextInput;
