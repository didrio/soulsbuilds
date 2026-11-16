import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';
import { fieldStyles } from './fieldStyles';

type TextInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'> & {
  centered?: boolean;
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
};

/**
 * A text input (44 px, sunken). Give it a visible `<label htmlFor>` or an `aria-label`. Other
 * `<input>` props (placeholder, aria-invalid, onBlur…) pass through.
 */
function TextInput({ centered = false, onChange, type = 'text', ...rest }: TextInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, e);
  };

  return <Container $centered={centered} onChange={handleChange} type={type} {...rest} />;
}

const Container = styled.input<{ $centered: boolean }>`
  ${fieldStyles}
  font-variant-numeric: tabular-nums;
  text-align: ${({ $centered }) => ($centered ? 'center' : 'left')};
`;

export default TextInput;
