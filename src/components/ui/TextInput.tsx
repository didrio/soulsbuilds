import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import { COLOR_GREEN, COLOR_LIGHT_GREEN, COLOR_GOLD, COLOR_DARK_GREEN, FONT_BODY } from '@/theme';

interface TextInputProps {
  centered?: boolean;
  disabled?: boolean;
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  /** Accepted but not rendered yet (T5). */
  placeholder?: string;
  type?: string;
  value: string | number;
}

function TextInput({
  centered = false,
  disabled = false,
  onChange,
  type = 'text',
  value,
}: TextInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = e.target;
    onChange(inputValue, e);
  };

  return (
    <Container
      $centered={centered}
      disabled={disabled}
      onChange={handleChange}
      type={type}
      value={value}
    />
  );
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
`;

export default TextInput;
