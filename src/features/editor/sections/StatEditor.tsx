import { useState } from 'react';
import styled from 'styled-components';
import DropDown from '@/components/ui/DropDown';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import TextInput from '@/components/ui/TextInput';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { fadingRule } from '@/components/ui/inWorld';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getStartingClass, startingClasses } from '@/data';
import { MAX_STAT, MIN_STAT, type StatKey } from '@/lib/buildMath';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_ACCENT_STRONG,
  COLOR_GLOW_STRONG,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_MD,
  SPACE_SM,
  TEXT_LG,
  TEXT_SM,
  TEXT_XS,
  TRACKING_CAPS,
} from '@/theme';
import { selectStatBonuses } from '../store/derived';
import { selectStartingClass, selectStats } from '../store/selectors';
import { setStartingClass } from '../store/startingClass';
import { updateStat } from '../store/stats';

/** The eight attributes, in the game's order. */
const STATS: [key: StatKey, name: string][] = [
  ['vigor', 'Vigor'],
  ['mind', 'Mind'],
  ['end', 'Endurance'],
  ['str', 'Strength'],
  ['dex', 'Dexterity'],
  ['int', 'Intelligence'],
  ['fai', 'Faith'],
  ['arc', 'Arcane'],
];

/**
 * One stat input. Accepts digits only (at most 2); each keystroke stores the value clamped to
 * `min`–99 (`min` is the starting class's base), and the field shows the stored value again once it
 * loses focus (so an emptied field, or one below the base, reverts).
 */
function StatInput({
  statKey,
  name,
  value,
  min,
}: {
  statKey: StatKey;
  name: string;
  value: number;
  min: number;
}) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setDraft(digits);
    if (digits) dispatch(updateStat({ key: statKey, value: Number(digits), min }));
  };

  return (
    <TextInput
      aria-label={name}
      centered
      inputMode="numeric"
      onBlur={() => setDraft(null)}
      onChange={handleChange}
      value={draft ?? value}
    />
  );
}

/**
 * Attributes panel: the rune level and starting class (a picker when editable: choosing one raises the
 * stats to its base, and no stat can go below it), then each stat as a bar and its value (an input when
 * editable), with what talismans add ("+5").
 */
function StatEditor({ editable, level }: { editable: boolean; level: number }) {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectStats);
  const startingClass = useAppSelector(selectStartingClass);
  const bonuses = useAppSelector(selectStatBonuses);

  return (
    <Frame aria-labelledby="stats-title">
      <SectionHeading id="stats-title">Attributes</SectionHeading>
      <Level>
        <LevelValue>{level}</LevelValue>
        <LevelLabel>Rune level</LevelLabel>
        {editable ? (
          <ClassPicker>
            <DropDown
              label="Starting class"
              placeholder="No starting class"
              options={startingClasses.map(({ id, name, level: classLevel }) => ({
                value: String(id),
                label: `${name} · level ${classLevel}`,
              }))}
              value={startingClass ? String(startingClass.id) : ''}
              onChange={(value) =>
                dispatch(setStartingClass(getStartingClass(Number(value)) ?? null))
              }
            />
          </ClassPicker>
        ) : startingClass ? (
          <ClassName>
            Starting class: <strong>{startingClass.name}</strong>
          </ClassName>
        ) : null}
      </Level>
      <Stats>
        {STATS.map(([key, name]) => (
          <Stat key={key} $editable={editable}>
            <span>
              {name}
              {bonuses[key] ? (
                <Bonus>
                  {` +${bonuses[key]}`}
                  <VisuallyHidden> from talismans</VisuallyHidden>
                </Bonus>
              ) : null}
            </span>
            <Bar aria-hidden="true">
              <BarFill style={{ width: `${(stats[key] / MAX_STAT) * 100}%` }} />
            </Bar>
            {editable ? (
              <StatInput
                statKey={key}
                name={name}
                value={stats[key]}
                min={startingClass?.stats[key] ?? MIN_STAT}
              />
            ) : (
              <StatValue>{stats[key]}</StatValue>
            )}
          </Stat>
        ))}
      </Stats>
    </Frame>
  );
}

const Level = styled.div`
  margin-bottom: ${SPACE_MD};
  padding-bottom: ${SPACE_MD};
  position: relative;
  text-align: center;

  &::after {
    background: ${fadingRule};
    bottom: 0;
    content: '';
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
  }
`;

const LevelValue = styled.span`
  color: ${COLOR_ACCENT_STRONG};
  display: block;
  font-family: ${FONT_DISPLAY};
  font-size: 44px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow: 0 0 24px ${COLOR_GLOW_STRONG};
`;

const LevelLabel = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  letter-spacing: ${TRACKING_CAPS};
  text-transform: uppercase;
`;

const ClassPicker = styled.div`
  margin: ${SPACE_SM} auto 0;
  max-width: 260px;
  text-align: left;
`;

const ClassName = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: ${SPACE_SM} 0 0;

  strong {
    color: ${COLOR_TEXT};
    font-weight: 600;
  }
`;

const Bonus = styled.span`
  color: ${COLOR_ACCENT};
  font-size: ${TEXT_XS};
  font-weight: 600;
`;

const Stats = styled.ul`
  display: grid;
  gap: 9px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Stat = styled.li<{ $editable: boolean }>`
  align-items: center;
  display: grid;
  font-size: ${TEXT_SM};
  gap: 10px;
  grid-template-columns: 92px 1fr ${({ $editable }) => ($editable ? '56px' : '30px')};
`;

const Bar = styled.span`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid ${COLOR_LINE};
  height: 5px;
`;

const BarFill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  box-shadow: 0 0 8px ${COLOR_GLOW_STRONG};
  display: block;
  height: 100%;
  max-width: 100%;
`;

const StatValue = styled.span`
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_LG};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

export default StatEditor;
