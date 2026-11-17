import { useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { LEVEL_BANDS, levelBand, type LevelBandKey } from '@/lib/levels';
import {
  COLOR_LEVEL_EARLY,
  COLOR_LEVEL_END,
  COLOR_LEVEL_LATE,
  COLOR_LEVEL_MID,
  COLOR_LEVEL_PVP,
  COLOR_TEXT_MUTED,
  TEXT_XS,
} from '@/theme';
import Tooltip from './Tooltip';
import VisuallyHidden from './VisuallyHidden';

/** Each level band's color (T79; the bands are `lib/levels.ts`). */
export const LEVEL_BAND_COLORS: Record<LevelBandKey, string> = {
  early: COLOR_LEVEL_EARLY,
  mid: COLOR_LEVEL_MID,
  late: COLOR_LEVEL_LATE,
  pvp: COLOR_LEVEL_PVP,
  end: COLOR_LEVEL_END,
};

export const levelColor = (level: number) => LEVEL_BAND_COLORS[levelBand(level).key];

/**
 * A level, in its band's color (T79), everywhere a level shows. With `legend`, hovering it shows the
 * bands (visual only: the band's name is in the accessible text). Leave `legend` off inside anything
 * that clips (an ellipsized line).
 */
function LevelNumber({
  level,
  legend = false,
  className,
  children,
}: {
  level: number;
  legend?: boolean;
  className?: string;
  /** What to show instead of the bare number ("RL 135"). */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const band = levelBand(level);
  return (
    <Value
      className={className}
      style={{ color: LEVEL_BAND_COLORS[band.key] }}
      data-band={band.key}
      onMouseEnter={legend ? () => setOpen(true) : undefined}
      onMouseLeave={legend ? () => setOpen(false) : undefined}>
      {children ?? level}
      {legend ? <VisuallyHidden>{` (${band.note})`}</VisuallyHidden> : null}
      {legend ? (
        <Tooltip open={open} width={210}>
          <Legend>
            {LEVEL_BANDS.map((each) => (
              <li key={each.key} data-current={each.key === band.key || undefined}>
                <Swatch style={{ background: LEVEL_BAND_COLORS[each.key] }} />
                <span style={{ color: LEVEL_BAND_COLORS[each.key] }}>{each.label}</span>
                <Note>{each.note}</Note>
              </li>
            ))}
          </Legend>
        </Tooltip>
      ) : null}
    </Value>
  );
}

const Value = styled.span`
  font-variant-numeric: tabular-nums;
  position: relative;
`;

const Legend = styled.ul`
  display: grid;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 2px 0;

  & > li {
    align-items: center;
    display: flex;
    gap: 8px;
    opacity: 0.75;
    white-space: nowrap;
  }

  & > li[data-current] {
    opacity: 1;
  }
`;

const Swatch = styled.span`
  border-radius: 50%;
  flex: none;
  height: 8px;
  width: 8px;
`;

const Note = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-weight: 400;
  margin-left: auto;
`;

export default LevelNumber;
