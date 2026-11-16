import { useState } from 'react';
import styled, { css } from 'styled-components';
import DropDown from '@/components/ui/DropDown';
import Frame from '@/components/ui/Frame';
import Label from '@/components/ui/Label';
import SectionHeading from '@/components/ui/SectionHeading';
import TextInput from '@/components/ui/TextInput';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { displayText } from '@/components/ui/typography';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getStartingClass, startingClasses } from '@/data';
import { MAX_STAT, MIN_STAT, type RollType, type StatKey } from '@/lib/buildMath';
import {
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_SUCCESS,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_DISPLAY,
  TEXT_LABEL,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
  TEXT_XXL,
} from '@/theme';
import {
  selectEquipWeight,
  selectPoise,
  selectRollType,
  selectStatBonuses,
  selectVitals,
} from '../store/derived';
import { selectStartingClass, selectStats } from '../store/selectors';
import { setStartingClass } from '../store/startingClass';
import { updateStat } from '../store/stats';

/** The eight attributes, in the game's order, with the short names phones show. */
export const STATS: [key: StatKey, name: string, short: string][] = [
  ['vigor', 'Vigor', 'Vig'],
  ['mind', 'Mind', 'Mnd'],
  ['end', 'Endurance', 'End'],
  ['str', 'Strength', 'Str'],
  ['dex', 'Dexterity', 'Dex'],
  ['int', 'Intelligence', 'Int'],
  ['fai', 'Faith', 'Fai'],
  ['arc', 'Arcane', 'Arc'],
];

/** The equip load scale: each roll and where it ends (`rollType` in buildMath.ts). */
const ROLLS: { roll: Exclude<RollType, 'overloaded'>; name: string }[] = [
  { roll: 'light', name: 'Light' },
  { roll: 'medium', name: 'Medium' },
  { roll: 'heavy', name: 'Heavy' },
];

/** The stats column's width on desktop (T28): the Loadout tab's left part and the other tabs' summary. */
export const STATS_COLUMN_WIDTH = 340;

export const formatNumber = (value: number) => value.toLocaleString('en-US');

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
 * The Stats card (T27: the attributes and character panels in one): the rune level, the starting class
 * (a picker when editable: choosing one raises the stats to its base, and no stat can go below it),
 * each attribute as a row with a bar and its value (an input when editable) and what talismans add
 * ("+5"), then what it all adds up to: HP, FP and stamina, the equip load on a bar marked where the
 * rolls change, and poise. Talisman effects count (store/derived.ts). Phones and tablets: the
 * attributes in a 4×2 grid with short names, HP, FP, stamina and poise in one row.
 */
function StatsCard({ editable, level }: { editable: boolean; level: number }) {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectStats);
  const startingClass = useAppSelector(selectStartingClass);
  const bonuses = useAppSelector(selectStatBonuses);
  const { hp, fp, stamina, equipLoad } = useAppSelector(selectVitals);
  const weight = useAppSelector(selectEquipWeight);
  const roll = useAppSelector(selectRollType);
  const poise = useAppSelector(selectPoise);
  const percent = equipLoad > 0 ? Math.round((weight / equipLoad) * 1000) / 10 : 0;

  return (
    <Frame aria-labelledby="stats-title">
      <Head>
        <div>
          <SectionHeading id="stats-title">Stats</SectionHeading>
          {!editable && startingClass ? (
            <ClassName>
              Starting class: <strong>{startingClass.name}</strong>
            </ClassName>
          ) : null}
        </div>
        <Level>
          <Label>Rune level</Label>
          <LevelValue>{level}</LevelValue>
        </Level>
      </Head>
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
      ) : null}

      <Block aria-labelledby="attributes-title">
        <BlockLabel as="h3" id="attributes-title">
          Attributes
        </BlockLabel>
        <Attributes $editable={editable}>
          {STATS.map(([key, name, short]) => (
            <Attribute key={key} $editable={editable}>
              <AttributeName>
                <Full>{name}</Full>
                <Short aria-hidden="true">{short}</Short>
                {bonuses[key] ? (
                  <Bonus>
                    {` +${bonuses[key]}`}
                    <VisuallyHidden> from talismans</VisuallyHidden>
                  </Bonus>
                ) : null}
              </AttributeName>
              <Bar aria-hidden="true">
                <BarFill style={{ width: `${(stats[key] / MAX_STAT) * 100}%` }} />
              </Bar>
              <AttributeValue>
                {editable ? (
                  <StatInput
                    statKey={key}
                    name={name}
                    value={stats[key]}
                    min={startingClass?.stats[key] ?? MIN_STAT}
                  />
                ) : (
                  stats[key]
                )}
              </AttributeValue>
            </Attribute>
          ))}
        </Attributes>
      </Block>

      <Block aria-labelledby="character-title">
        <BlockLabel as="h3" id="character-title">
          Character
        </BlockLabel>
        <Vitals>
          <Vital $area="hp">
            <dt>HP</dt>
            <dd>{formatNumber(hp)}</dd>
          </Vital>
          <Vital $area="fp">
            <dt>FP</dt>
            <dd>{formatNumber(fp)}</dd>
          </Vital>
          <Vital $area="stamina">
            <dt>Stamina</dt>
            <dd>{formatNumber(stamina)}</dd>
          </Vital>
          <Load>
            <dt>Equip load</dt>
            <dd>
              <LoadNumbers>
                <strong>{weight.toFixed(1)}</strong>
                {` / ${equipLoad.toFixed(1)}`}
              </LoadNumbers>
              <LoadBar aria-hidden="true">
                <LoadFill
                  $over={roll === 'overloaded'}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
                <Mark style={{ left: '30%' }} />
                <Mark style={{ left: '70%' }} />
              </LoadBar>
              {roll === 'overloaded' ? (
                <Overloaded>{`Overloaded · ${percent}%`}</Overloaded>
              ) : (
                <Scale>
                  {ROLLS.map(({ roll: each, name }) =>
                    each === roll ? (
                      <Current key={each}>
                        {name}
                        <VisuallyHidden> roll</VisuallyHidden>
                        {` · ${percent}%`}
                      </Current>
                    ) : (
                      <span key={each} aria-hidden="true">
                        {name}
                      </span>
                    ),
                  )}
                </Scale>
              )}
            </dd>
          </Load>
          <Poise>
            <dt>Poise</dt>
            <dd>{formatNumber(poise)}</dd>
          </Poise>
        </Vitals>
      </Block>
    </Frame>
  );
}

const Head = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${SPACE_MD};
  justify-content: space-between;

  h2 {
    margin: 0;
  }

  @media ${BELOW_TABLET} {
    align-items: center;
  }
`;

const ClassName = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: ${SPACE_XS} 0 0;

  strong {
    color: ${COLOR_TEXT};
    font-weight: 600;
  }
`;

// Desktop: the label over the number, right-aligned. Phones: side by side.
const Level = styled.p`
  margin: 0;
  text-align: right;

  @media ${BELOW_TABLET} {
    align-items: baseline;
    display: flex;
    gap: ${SPACE_SM};
  }
`;

const LevelValue = styled.span`
  ${displayText}
  color: ${COLOR_ACCENT};
  display: block;
  font-size: ${TEXT_DISPLAY};
  font-variant-numeric: tabular-nums;
  line-height: 1;

  @media ${BELOW_TABLET} {
    font-size: ${TEXT_XXL};
  }
`;

const ClassPicker = styled.div`
  margin-top: ${SPACE_GROUP};
`;

const Block = styled.section`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: ${SPACE_MD};
  padding-top: ${SPACE_MD};
`;

const BlockLabel = styled(Label)`
  display: block;
  margin-bottom: ${SPACE_SM};
`;

const Attributes = styled.ul<{ $editable: boolean }>`
  display: grid;
  gap: ${({ $editable }) => ($editable ? '6px' : '0')};
  list-style: none;
  margin: 0;
  padding: 0;

  @media ${BELOW_TABLET} {
    gap: ${SPACE_GROUP};
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

// Desktop: a row about 30px tall (name, bar, value). Phones: a cell, the name and value over the bar.
const Attribute = styled.li<{ $editable: boolean }>`
  align-items: center;
  column-gap: 12px;
  display: grid;
  grid-template-areas: 'name bar value';
  grid-template-columns: 96px minmax(0, 1fr) ${({ $editable }) => ($editable ? '56px' : '30px')};
  min-height: 30px;

  @media ${BELOW_TABLET} {
    grid-template-areas: ${({ $editable }) => ($editable ? `'name' 'value' 'bar'` : `'name value' 'bar bar'`)};
    grid-template-columns: ${({ $editable }) => ($editable ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto')};
    min-height: 0;
    row-gap: ${SPACE_XS};
  }
`;

const AttributeName = styled.span`
  font-size: ${TEXT_MD};
  grid-area: name;
  white-space: nowrap;

  @media ${BELOW_TABLET} {
    color: ${COLOR_TEXT_MUTED};
    font-size: ${TEXT_XS};
  }
`;

// The full name on desktop; on phones it stays for screen readers while the short name shows.
const Full = styled.span`
  @media ${BELOW_TABLET} {
    clip: rect(0 0 0 0);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
`;

const Short = styled.span`
  display: none;

  @media ${BELOW_TABLET} {
    display: inline;
  }
`;

const Bonus = styled.span`
  color: ${COLOR_SUCCESS};
  font-size: ${TEXT_XS};
  font-weight: 600;
`;

const Bar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 2px;
  grid-area: bar;
  height: 3px;
  overflow: hidden;
`;

const BarFill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  display: block;
  height: 100%;
  max-width: 100%;
`;

const AttributeValue = styled.span`
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  grid-area: value;
  text-align: right;
`;

// Desktop: HP | FP | Stamina, then the load, then poise. Phones: HP | FP | Stamina | Poise, then the load.
const Vitals = styled.dl`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-areas: 'hp fp stamina' 'load load load' 'poise poise poise';
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;

  dt {
    color: ${COLOR_TEXT_MUTED};
    font-size: ${TEXT_XS};
  }

  dd {
    font-variant-numeric: tabular-nums;
    margin: 0;
  }

  @media ${BELOW_TABLET} {
    grid-template-areas: 'hp fp stamina poise' 'load load load load';
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const bigValue = css`
  color: ${COLOR_TEXT};
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;

  @media ${BELOW_TABLET} {
    font-size: 17px;
  }
`;

const Vital = styled.div<{ $area: string }>`
  grid-area: ${({ $area }) => $area};

  dd {
    ${bigValue}
  }
`;

const Load = styled.div`
  grid-area: load;
  position: relative;
  margin-top: ${SPACE_XS};
`;

const LoadNumbers = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_MD};
  position: absolute;
  right: 0;
  top: 0;

  strong {
    color: ${COLOR_TEXT};
    font-weight: 600;
  }
`;

const LoadBar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 2px;
  display: block;
  height: 6px;
  margin-top: ${SPACE_SM};
  position: relative;
`;

const LoadFill = styled.span<{ $over: boolean }>`
  background: ${({ $over }) =>
    $over ? COLOR_DANGER : `linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT})`};
  border-radius: 2px;
  display: block;
  height: 100%;
`;

// Where the roll changes: 30% (medium) and 70% (heavy).
const Mark = styled.span`
  background: ${COLOR_TEXT_MUTED};
  height: 12px;
  position: absolute;
  top: -3px;
  width: 1px;
`;

const Scale = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: grid;
  font-size: ${TEXT_LABEL};
  grid-template-columns: 30% 40% 30%;
  margin-top: 6px;

  & > :nth-child(2) {
    text-align: center;
  }

  & > :nth-child(3) {
    text-align: right;
  }
`;

const Current = styled.span`
  color: ${COLOR_TEXT};
  font-weight: 600;
  white-space: nowrap;
`;

const Overloaded = styled.span`
  color: ${COLOR_DANGER};
  display: block;
  font-size: ${TEXT_XS};
  font-weight: 600;
  margin-top: 6px;
  text-align: right;
`;

// Desktop: a row under a rule. Phones: a cell like HP.
const Poise = styled.div`
  align-items: baseline;
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  grid-area: poise;
  justify-content: space-between;
  padding-top: ${SPACE_GROUP};

  dd {
    color: ${COLOR_TEXT};
    font-size: 16px;
    font-weight: 600;
  }

  @media ${BELOW_TABLET} {
    border-top: none;
    display: block;
    padding-top: 0;

    dd {
      ${bigValue}
    }
  }
`;

export default StatsCard;
