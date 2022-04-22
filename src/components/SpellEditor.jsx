import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import Slot from './common/Slot';
import { SLOT_TYPE_SPELL } from '../constants';
import {
  selectSpell1,
  selectSpell2,
  selectSpell3,
  selectSpell4,
  selectSpell5,
  selectSpell6,
  selectSpell7,
  selectSpell8,
  selectSpell9,
  selectSpell10,
} from '../store/selectors';

function SpellEditor({ editable }) {
  const spell1 = useSelector(selectSpell1);
  const spell2 = useSelector(selectSpell2);
  const spell3 = useSelector(selectSpell3);
  const spell4 = useSelector(selectSpell4);
  const spell5 = useSelector(selectSpell5);
  const spell6 = useSelector(selectSpell6);
  const spell7 = useSelector(selectSpell7);
  const spell8 = useSelector(selectSpell8);
  const spell9 = useSelector(selectSpell9);
  const spell10 = useSelector(selectSpell10);

  const slotPoints = useMemo(() => {
    let count = 0;
    count += spell1 ? Number(spell1.slot) : 0;
    count += spell2 ? Number(spell2.slot) : 0;
    count += spell3 ? Number(spell3.slot) : 0;
    count += spell4 ? Number(spell4.slot) : 0;
    count += spell5 ? Number(spell5.slot) : 0;
    count += spell6 ? Number(spell6.slot) : 0;
    count += spell7 ? Number(spell7.slot) : 0;
    count += spell8 ? Number(spell8.slot) : 0;
    count += spell9 ? Number(spell9.slot) : 0;
    count += spell10 ? Number(spell10.slot) : 0;
    return count;
  }, [
    spell1,
    spell2,
    spell3,
    spell4,
    spell5,
    spell6,
    spell7,
    spell8,
    spell9,
    spell10,
  ]);

  const disabled = slotPoints >= 10 || !editable;

  return (
    <FlexGroup
      vertical
    >
      <Header>
        Spells
      </Header>
      <Count>
        {`${slotPoints}/10 Points Allocated`}
      </Count>
      <SlotContainer>
        <Slot
          disabled={disabled}
          id="spell1"
          item={spell1}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell2"
          item={spell2}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell3"
          item={spell3}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell4"
          item={spell4}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell5"
          item={spell5}
          type={SLOT_TYPE_SPELL}
        />
      </SlotContainer>
      <SlotContainer>
        <Slot
          disabled={disabled}
          id="spell6"
          item={spell6}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell7"
          item={spell7}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell8"
          item={spell8}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell9"
          item={spell9}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell10"
          item={spell10}
          type={SLOT_TYPE_SPELL}
        />
      </SlotContainer>
    </FlexGroup>
  );
}

const Header = styled.h2`
  margin-bottom: 20px;
`;

const Count = styled.span`
  font-weight: bold;
  margin-bottom: 20px;
`;

const SlotContainer = styled(FlexGroup)`
  flex-wrap: wrap;

  & > div {
    margin-bottom: 10px;
    margin-right: 10px;
  }
`;

SpellEditor.propTypes = {
  editable: PropTypes.bool.isRequired,
};

export default SpellEditor;
