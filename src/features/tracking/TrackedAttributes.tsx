import styled from 'styled-components';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { CheckIcon, MinusIcon, PlusIcon } from '@/components/ui/icons';
import { MAX_STAT, type StatKey, type Stats } from '@/lib/buildMath';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_INSET,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  RADIUS_FRAME,
  TEXT_MD,
} from '@/theme';

/** The player's stats against the build's, while tracking (T34). */
export interface StatsTracking {
  stats: Stats;
  /** Where the − buttons stop (the starting class, or 10). */
  baseline: Stats;
  onChange: (key: StatKey, value: number) => void;
}

/**
 * The attributes while the player tracks the build (T34): each row is the attribute, a bar of how far
 * they are (up to the target), "yours / target" and − and + (44 px) to match their character. A tick
 * when the target is reached. Same layout on phones (one row per attribute), so it's one-handed.
 */
function TrackedAttributes({
  attributes,
  target,
  tracking,
}: {
  attributes: [key: StatKey, name: string, short: string][];
  target: Stats;
  tracking: StatsTracking;
}) {
  const { stats, baseline, onChange } = tracking;
  return (
    <Rows>
      {attributes.map(([key, name]) => {
        const yours = stats[key];
        const reached = yours >= target[key];
        const percent = target[key] > 0 ? (Math.min(yours, target[key]) / target[key]) * 100 : 100;
        return (
          <Row key={key}>
            <NameCell>
              <Name>
                {name}
                {reached ? (
                  <Reached>
                    <CheckIcon size={14} strokeWidth={2.4} />
                    <VisuallyHidden> target reached</VisuallyHidden>
                  </Reached>
                ) : null}
              </Name>
              <Bar aria-hidden="true">
                <BarFill style={{ width: `${percent}%` }} />
              </Bar>
            </NameCell>
            <Step
              type="button"
              aria-label={`Lower ${name}`}
              disabled={yours <= baseline[key]}
              onClick={() => onChange(key, yours - 1)}>
              <MinusIcon />
            </Step>
            <Value>
              <Yours $reached={reached}>{yours}</Yours>
              <Target>{` / ${target[key]}`}</Target>
            </Value>
            <Step
              type="button"
              aria-label={`Raise ${name}`}
              disabled={yours >= MAX_STAT}
              onClick={() => onChange(key, yours + 1)}>
              <PlusIcon />
            </Step>
          </Row>
        );
      })}
    </Rows>
  );
}

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Row = styled.li`
  align-items: center;
  border-top: 1px solid ${COLOR_LINE};
  display: grid;
  gap: 4px;
  grid-template-columns: minmax(0, 1fr) 44px 64px 44px;
  min-height: 52px;

  &:first-child {
    border-top: none;
  }
`;

const NameCell = styled.div`
  min-width: 0;
  padding-right: 8px;
`;

const Name = styled.span`
  align-items: center;
  display: flex;
  font-size: ${TEXT_MD};
  gap: 6px;
`;

const Reached = styled.span`
  color: ${COLOR_ACCENT};
  display: inline-flex;
`;

const Bar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 2px;
  display: block;
  height: 4px;
  margin-top: 6px;
  overflow: hidden;
`;

const BarFill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  display: block;
  height: 100%;
`;

const Step = styled.button`
  align-items: center;
  background: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: flex;
  height: 44px;
  justify-content: center;
  width: 44px;

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;

const Value = styled.span`
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  text-align: center;
`;

const Yours = styled.strong<{ $reached: boolean }>`
  color: ${({ $reached }) => ($reached ? COLOR_ACCENT : COLOR_TEXT)};
  font-weight: 600;
`;

const Target = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

export default TrackedAttributes;
