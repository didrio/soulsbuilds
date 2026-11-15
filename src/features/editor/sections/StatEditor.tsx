import { useState } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import TextInput from '@/components/ui/TextInput';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { StatKey } from '@/lib/buildMath';
import { COLOR_LIGHTEST_GREEN, BELOW_1100, BELOW_1400 } from '@/theme';
import { selectStats } from '../store/selectors';
import { updateStat } from '../store/stats';

const STAT_NAMES: Record<StatKey, string> = {
  arc: 'Arcane',
  dex: 'Dexterity',
  end: 'Endurance',
  fai: 'Faith',
  int: 'Intelligence',
  mind: 'Mind',
  str: 'Strength',
  vigor: 'Vigor',
};

/**
 * One stat input. Accepts digits only (at most 2); each keystroke stores the value clamped to 1–99,
 * and the field shows the stored value again once it loses focus (so an emptied field reverts).
 */
function StatInput({ statKey, value }: { statKey: StatKey; value: number }) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setDraft(digits);
    if (digits) dispatch(updateStat({ key: statKey, value: Number(digits) }));
  };

  return (
    <TextInput
      aria-label={STAT_NAMES[statKey]}
      centered
      inputMode="numeric"
      onBlur={() => setDraft(null)}
      onChange={handleChange}
      value={draft ?? value}
    />
  );
}

/** Two rows of four, in the 2022 (alphabetical by label) order. */
const STAT_ROWS: [label: string, key: StatKey][][] = [
  [
    ['ARC', 'arc'],
    ['DEX', 'dex'],
    ['END', 'end'],
    ['FAI', 'fai'],
  ],
  [
    ['INT', 'int'],
    ['MIN', 'mind'],
    ['STR', 'str'],
    ['VIG', 'vigor'],
  ],
];

/** Stats section: the level and the 8 stats (inputs when editable, text otherwise). */
function StatEditor({ editable, level }: { editable: boolean; level: number }) {
  const stats = useAppSelector(selectStats);

  return (
    <FlexGroup vertical>
      <HeaderContainer>
        <Header>Stats</Header>
        <Level>Level {level}</Level>
      </HeaderContainer>
      {STAT_ROWS.map((row) => (
        <StatsContainer key={row[0]![1]}>
          {row.map(([label, key], index) => {
            const StatBox = index === row.length - 1 ? StatNoMargin : Stat;
            return (
              <StatBox key={key}>
                <StatName title={STAT_NAMES[key]}>{label}</StatName>
                <StatBoxInput>
                  <StatContainer>
                    {editable ? <StatInput statKey={key} value={stats[key]} /> : stats[key]}
                  </StatContainer>
                </StatBoxInput>
              </StatBox>
            );
          })}
        </StatsContainer>
      ))}
    </FlexGroup>
  );
}

const HeaderContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: normal;
`;

const Level = styled(FlexGroup)`
  margin-bottom: 20px;
  font-size: 20px;
`;

const StatsContainer = styled(FlexGroup)`
  flex-wrap: wrap;
`;

const Stat = styled(FlexGroup)`
  align-items: center;
  margin-bottom: 15px;
  margin-right: 30px;

  @media ${BELOW_1400} {
    margin-right: 20px;
  }

  @media ${BELOW_1100} {
    margin-right: 10px;
  }
`;

const StatNoMargin = styled(Stat)`
  margin-right: 0px;
`;

const StatName = styled.span`
  font-size: 12px;
  margin-right: 10px;
  width: 30px;

  @media ${BELOW_1400} {
    width: 20px;
  }

  @media ${BELOW_1100} {
    width: 20px;
    font-size: 10px;
  }
`;

const StatBoxInput = styled(FlexGroup)`
  max-width: 40px;
  width: 40px;
`;

const StatContainer = styled.span`
  font-weight: bold;
`;

export default StatEditor;
