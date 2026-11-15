import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import { COLOR_GREEN, COLOR_LIGHT_GREEN, COLOR_GOLD, FONT_BODY } from '@/theme';

interface TextAreaInputProps {
  disabled?: boolean;
  onChange: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  value: string;
}

function TextAreaInput({ disabled = false, onChange, value }: TextAreaInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value: inputValue } = e.target;
    onChange(inputValue, e);
  };

  return <Container disabled={disabled} onChange={handleChange} rows={5} value={value} />;
}

const Container = styled.textarea`
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  padding: 5px 10px;
  outline: none;
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  font-size: 16px;
  text-align: left;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  font-family: ${FONT_BODY};
  resize: none;
`;

export default TextAreaInput;
