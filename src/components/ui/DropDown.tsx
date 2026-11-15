import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import { COLOR_GREEN, COLOR_LIGHT_GREEN, COLOR_GOLD, COLOR_DARK_GREEN, FONT_BODY } from '@/theme';

interface DropDownProps {
  /** Accessible name of the select. */
  label: string;
  /** The chosen option, or null when the placeholder ("none") is chosen. */
  onChange: (value: string | null) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}

/** A `<select>` with a placeholder option, which clears the value. */
function DropDown({ label, onChange, options, placeholder, value }: DropDownProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value || null);
  };

  return (
    <Container aria-label={label} onChange={handleChange} value={value}>
      <Option value="">{placeholder}</Option>
      {options.map((option) => (
        <Option key={option} value={option}>
          {option}
        </Option>
      ))}
    </Container>
  );
}

const Container = styled.select`
  border: 1px solid ${COLOR_LIGHT_GREEN};
  border-radius: 2px;
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  outline: none;
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  font-size: 16px;
  font-family: ${FONT_BODY};
  box-shadow: inset 0 0 3px ${COLOR_DARK_GREEN};
  cursor: pointer;
`;

const Option = styled.option`
  text-align: center;
`;

export default DropDown;
