import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAppSelector } from '@/app/hooks';
import { COLOR_DANGER, COLOR_TEXT_MUTED, SPACE_SM, TEXT_SM } from '@/theme';
import { filledAndNext, ItemRows, type SlotEntry } from '../ItemRow';
import { itemWarning } from '../itemDetails';
import { SLOT_TYPE_SPELL, SPELL_SLOTS } from '../slots';
import {
  selectMemorySlots,
  selectMemoryUsed,
  selectRequirementChecks,
  selectSpellsOverSlots,
} from '../store/derived';
import { selectSpellSlots } from '../store/selectors';

/**
 * Spells panel: the memory slots the spells use (10 with all Memory Stones, 12 with Moon of
 * Nokstella), then the spells (and a "Choose spell" row when editable). A spell whose requirements
 * aren't met, or that doesn't fit in the slots, says so.
 */
function SpellEditor({ editable }: { editable: boolean }) {
  const spells = useAppSelector(selectSpellSlots);
  const checks = useAppSelector(selectRequirementChecks);
  const over = useAppSelector(selectSpellsOverSlots);
  const available = useAppSelector(selectMemorySlots);
  const used = useAppSelector(selectMemoryUsed);

  const entries: SlotEntry[] = SPELL_SLOTS.map((id) => ({
    id,
    type: SLOT_TYPE_SPELL,
    item: spells[id],
    warning: itemWarning(checks[id], over.has(id)),
  }));
  const shown = editable ? filledAndNext(entries) : entries.filter((entry) => entry.item);

  return (
    <Frame aria-labelledby="spells-title">
      <SectionHeading id="spells-title">Spells</SectionHeading>
      {shown.length === 0 ? (
        <Muted>No spells.</Muted>
      ) : (
        <>
          <Muted $over={used > available}>{`${used} of ${available} memory slots used`}</Muted>
          <ItemRows entries={shown} editable={editable} columns={1} />
        </>
      )}
    </Frame>
  );
}

const Muted = styled.p<{ $over?: boolean }>`
  color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_SM};
  text-align: center;

  &:only-of-type:last-child {
    margin-bottom: 0;
  }
`;

export default SpellEditor;
