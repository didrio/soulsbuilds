import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import { COLOR_TEXT_MUTED } from '@/theme';
import { fieldStyles } from './fieldStyles';
import { ChevronDownIcon } from './icons';

/** An option: a string is both value and label. */
export type DropDownOption = string | { value: string; label: string };

interface DropDownProps {
  /** Accessible name of the select. */
  label: string;
  /** The chosen option's value, or null when the placeholder ("none") is chosen. */
  onChange: (value: string | null) => void;
  options: readonly DropDownOption[];
  placeholder: string;
  value: string;
}

const optionOf = (option: DropDownOption) =>
  typeof option === 'string' ? { value: option, label: option } : option;

/** A native `<select>` in the field style, with a placeholder option that clears the value. */
function DropDown({ label, onChange, options, placeholder, value }: DropDownProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value || null);
  };

  return (
    <Wrapper>
      <Select aria-label={label} onChange={handleChange} value={value}>
        <option value="">{placeholder}</option>
        {options.map(optionOf).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Chevron />
    </Wrapper>
  );
}

const Wrapper = styled.span`
  display: block;
  position: relative;
  width: 100%;
`;

const Select = styled.select`
  ${fieldStyles}
  appearance: none;
  cursor: pointer;
  padding-right: 36px;
`;

const Chevron = styled(ChevronDownIcon)`
  color: ${COLOR_TEXT_MUTED};
  pointer-events: none;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
`;

export default DropDown;
