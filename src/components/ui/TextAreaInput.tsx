import type { ChangeEvent, ComponentProps } from 'react';
import styled from 'styled-components';
import { fieldStyles } from './fieldStyles';

type TextAreaInputProps = Omit<ComponentProps<'textarea'>, 'onChange' | 'value'> & {
  onChange: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  value: string;
};

/**
 * A textarea in the field style. Other `<textarea>` props (aria-label, maxLength, ref…) pass through.
 */
function TextAreaInput({ onChange, rows = 5, ...rest }: TextAreaInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value, e);
  };

  return <Container onChange={handleChange} rows={rows} {...rest} />;
}

const Container = styled.textarea`
  ${fieldStyles}
  height: 100%;
  line-height: 1.5;
  resize: vertical;
`;

export default TextAreaInput;
