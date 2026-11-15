import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';
import { COLOR_GREEN, COLOR_LIGHT_GREEN, COLOR_GOLD, FONT_BODY } from '@/theme';

type TextAreaInputProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'onChange' | 'value'> & {
  onChange: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  value: string;
};

/** A styled textarea. Other `<textarea>` props (aria-label, maxLength…) pass through. */
function TextAreaInput({ onChange, rows = 5, ...rest }: TextAreaInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value, e);
  };

  return <Container onChange={handleChange} rows={rows} {...rest} />;
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

  &:focus-visible {
    border-color: ${COLOR_GOLD};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

export default TextAreaInput;
