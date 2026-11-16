import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import type { RollType } from '@/lib/buildMath';
import {
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  TEXT_LG,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { selectEquipWeight, selectPoise, selectRollType, selectVitals } from '../store/derived';

const ROLL_LABELS: Record<RollType, string> = {
  light: 'Light roll',
  medium: 'Medium roll',
  heavy: 'Heavy roll',
  overloaded: 'Overloaded',
};

/**
 * Character panel (T8): what the stats and gear add up to: HP, FP and stamina, equip load with the
 * roll type it gives, and poise. Talisman effects count (src/features/editor/store/derived.ts).
 */
function CharacterStats() {
  const { hp, fp, stamina, equipLoad } = useAppSelector(selectVitals);
  const weight = useAppSelector(selectEquipWeight);
  const roll = useAppSelector(selectRollType);
  const poise = useAppSelector(selectPoise);
  const percent = equipLoad > 0 ? Math.round((weight / equipLoad) * 1000) / 10 : 0;

  return (
    <Frame aria-labelledby="character-title">
      <SectionHeading id="character-title">Character</SectionHeading>
      <List>
        <Row>
          <dt>HP</dt>
          <dd>{hp}</dd>
        </Row>
        <Row>
          <dt>FP</dt>
          <dd>{fp}</dd>
        </Row>
        <Row>
          <dt>Stamina</dt>
          <dd>{stamina}</dd>
        </Row>
        <Row>
          <dt>Equip load</dt>
          <dd>
            {`${weight.toFixed(1)} / ${equipLoad.toFixed(1)}`}
            <Detail $danger={roll === 'overloaded'}>{`${ROLL_LABELS[roll]} · ${percent}%`}</Detail>
          </dd>
        </Row>
        <Row>
          <dt>Poise</dt>
          <dd>{poise}</dd>
        </Row>
      </List>
    </Frame>
  );
}

const List = styled.dl`
  display: grid;
  margin: 0;
`;

const Row = styled.div`
  align-items: baseline;
  border-bottom: 1px solid ${COLOR_LINE};
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 7px 0;

  &:last-child {
    border-bottom: none;
  }

  dt {
    color: ${COLOR_TEXT_MUTED};
    font-size: ${TEXT_SM};
  }

  dd {
    color: ${COLOR_TEXT};
    font-family: ${FONT_DISPLAY};
    font-size: ${TEXT_LG};
    font-variant-numeric: tabular-nums;
    margin: 0;
    text-align: right;
  }
`;

const Detail = styled.span<{ $danger: boolean }>`
  color: ${({ $danger }) => ($danger ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  display: block;
  font-family: inherit;
  font-size: ${TEXT_XS};
  font-weight: ${({ $danger }) => ($danger ? 600 : 400)};
`;

export default CharacterStats;
