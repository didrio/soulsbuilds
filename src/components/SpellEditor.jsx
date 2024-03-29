import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './common/FlexGroup';
import Slot from './common/Slot';
import { COLOR_LIGHTEST_GREEN, SLOT_TYPE_SPELL } from '../constants';
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
import { updateSpell } from '../store/spells';

function SpellEditor({ editable }) {
  const dispatch = useDispatch();

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

  const disabled = !editable;

  const handleRemoveSpell = (id) => () => {
    dispatch(updateSpell({ id, item: null }));
  };

  return (
    <FlexGroup
      vertical
    >
      <HeaderContainer>
        <Header>
          Spells
        </Header>
      </HeaderContainer>
      <Count>
        {`${slotPoints}/10 Points Allocated`}
      </Count>
      <SlotContainer>
        <Slot
          disabled={disabled}
          id="spell1"
          item={spell1}
          onRemove={handleRemoveSpell('spell1')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell2"
          item={spell2}
          onRemove={handleRemoveSpell('spell2')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell3"
          item={spell3}
          onRemove={handleRemoveSpell('spell3')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell4"
          item={spell4}
          onRemove={handleRemoveSpell('spell4')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell5"
          item={spell5}
          onRemove={handleRemoveSpell('spell5')}
          type={SLOT_TYPE_SPELL}
        />
      </SlotContainer>
      <SlotContainer>
        <Slot
          disabled={disabled}
          id="spell6"
          item={spell6}
          onRemove={handleRemoveSpell('spell6')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell7"
          item={spell7}
          onRemove={handleRemoveSpell('spell7')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell8"
          item={spell8}
          onRemove={handleRemoveSpell('spell8')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell9"
          item={spell9}
          onRemove={handleRemoveSpell('spell9')}
          type={SLOT_TYPE_SPELL}
        />
        <Slot
          disabled={disabled}
          id="spell10"
          item={spell10}
          onRemove={handleRemoveSpell('spell10')}
          type={SLOT_TYPE_SPELL}
        />
      </SlotContainer>
    </FlexGroup>
  );
}

const HeaderContainer = styled(FlexGroup)`
  justify-content: center;
`;

const Header = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: normal;
`;

const Count = styled(FlexGroup)`
  font-size: 18px;
  margin-bottom: 20px;
  justify-content: center;
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
