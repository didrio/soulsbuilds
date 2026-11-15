import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import TextInput from '@/components/ui/TextInput';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { StatKey } from '@/lib/buildMath';
import { COLOR_LIGHTEST_GREEN, BELOW_1100, BELOW_1400 } from '@/theme';
import { selectStats } from '../store/selectors';
import {
  updateArc,
  updateDex,
  updateEnd,
  updateFai,
  updateInt,
  updateMind,
  updateStr,
  updateVigor,
} from '../store/stats';

const STAT_ACTIONS = {
  arc: updateArc,
  dex: updateDex,
  end: updateEnd,
  fai: updateFai,
  int: updateInt,
  mind: updateMind,
  str: updateStr,
  vigor: updateVigor,
} satisfies Record<StatKey, unknown>;

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
function StatEditor({ editable, level }: { editable: boolean; level: string }) {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectStats);

  const handleChange = (key: StatKey) => (value: string) => {
    dispatch(STAT_ACTIONS[key](value));
  };

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
                <StatName>{label}</StatName>
                <StatInput>
                  <StatContainer>
                    {editable ? (
                      <TextInput centered onChange={handleChange(key)} value={stats[key]} />
                    ) : (
                      stats[key]
                    )}
                  </StatContainer>
                </StatInput>
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

const StatInput = styled(FlexGroup)`
  max-width: 40px;
  width: 40px;
`;

const StatContainer = styled.span`
  font-weight: bold;
`;

export default StatEditor;
