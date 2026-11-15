import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { useAppSelector } from '@/app/hooks';
import { COLOR_LIGHTEST_GREEN } from '@/theme';
import Slot from '../Slot';
import { SLOT_TYPE_SPELL, SPELL_SLOTS, type SpellSlot } from '../slots';
import { selectSpellSlots } from '../store/selectors';

/** Spells section: 10 spell slots and the memory slot points they use. */
function SpellEditor({ editable }: { editable: boolean }) {
  const spells = useAppSelector(selectSpellSlots);

  const slotPoints = SPELL_SLOTS.reduce((count, slot) => {
    const spell = spells[slot];
    return count + (spell ? Number(spell.slot) : 0);
  }, 0);

  const disabled = !editable;

  const spellSlot = (id: SpellSlot) => (
    <Slot disabled={disabled} id={id} item={spells[id]} key={id} type={SLOT_TYPE_SPELL} />
  );

  return (
    <FlexGroup vertical>
      <HeaderContainer>
        <Header>Spells</Header>
      </HeaderContainer>
      <Count>{`${slotPoints}/10 Points Allocated`}</Count>
      <SlotContainer>{SPELL_SLOTS.slice(0, 5).map(spellSlot)}</SlotContainer>
      <SlotContainer>{SPELL_SLOTS.slice(5).map(spellSlot)}</SlotContainer>
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

export default SpellEditor;
