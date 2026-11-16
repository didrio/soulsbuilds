import styled from 'styled-components';
import { COLOR_ACCENT, COLOR_ACCENT_DEEP, COLOR_LINE } from '@/theme';

/** A thin progress bar in the accent (decorative: the number is shown next to it). */
function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <Bar aria-hidden="true" className={className}>
      <Fill style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </Bar>
  );
}

const Bar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 3px;
  display: block;
  height: 6px;
  overflow: hidden;
`;

const Fill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  display: block;
  height: 100%;
`;

export default ProgressBar;
