import styled from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_INSET,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  RADIUS_FRAME,
  TEXT_SM,
} from '@/theme';

interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group (e.g. "Sort builds"). */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of toggle buttons where one is pressed (`aria-pressed`), e.g. sort order. */
function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <Group role="group" aria-label={label}>
      {options.map((option) => (
        <Segment
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}>
          {option.label}
        </Segment>
      ))}
    </Group>
  );
}

const Group = styled.div`
  background: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: ${RADIUS_FRAME};
  display: inline-flex;
`;

const Segment = styled.button`
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  font-size: ${TEXT_SM};
  font-weight: 500;
  min-height: 42px;
  padding: 0 16px;
  position: relative;

  & + & {
    border-left: 1px solid ${COLOR_LINE};
  }

  &:hover {
    color: ${COLOR_TEXT};
  }

  &[aria-pressed='true'] {
    background: ${COLOR_SURFACE_RAISED};
    color: ${COLOR_ACCENT_STRONG};
  }

  &[aria-pressed='true']::after {
    background: ${COLOR_ACCENT};
    bottom: 0;
    content: '';
    height: 2px;
    left: 0;
    position: absolute;
    right: 0;
  }
`;

export default SegmentedControl;
