import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import { COLOR_TEXT_MUTED, SPACE_SM, TEXT_SM } from '@/theme';
import { filledAndNext, ItemRows, type SlotEntry } from '../ItemRow';
import { SLOT_TYPE_SPELL, SPELL_SLOTS } from '../slots';
import { selectSpellSlots } from '../store/selectors';

/** Spells panel: the memory slots the spells use, then the spells (and a "Choose spell" row when editable). */
function SpellEditor({ editable }: { editable: boolean }) {
  const spells = useAppSelector(selectSpellSlots);

  const entries: SlotEntry[] = SPELL_SLOTS.map((id) => ({
    id,
    type: SLOT_TYPE_SPELL,
    item: spells[id],
  }));
  const shown = editable ? filledAndNext(entries) : entries.filter((entry) => entry.item);
  const slotPoints = SPELL_SLOTS.reduce((count, slot) => count + (spells[slot]?.slots ?? 0), 0);

  return (
    <Frame aria-labelledby="spells-title">
      <SectionHeading id="spells-title">Spells</SectionHeading>
      {shown.length === 0 ? (
        <Muted>No spells.</Muted>
      ) : (
        <>
          <Muted>{`${slotPoints} of 10 memory slots used`}</Muted>
          <ItemRows entries={shown} editable={editable} columns={1} />
        </>
      )}
    </Frame>
  );
}

const Muted = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_SM};
  text-align: center;

  &:only-of-type:last-child {
    margin-bottom: 0;
  }
`;

export default SpellEditor;
