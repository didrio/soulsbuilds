// Editor test helpers: the equipment editor with the item picker, as App renders them.
import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { useAppSelector } from '@/app/hooks';
import ItemSelector from '@/features/editor/ItemSelector';
import EquipmentEditor from '@/features/editor/sections/EquipmentEditor';
import { selectSlotType } from '@/features/editor/store/selectors';

/** The editor plus the picker modal (open while a slot type is set). */
export function EditorWithPicker() {
  const open = useAppSelector(selectSlotType) !== null;
  return (
    <>
      <EquipmentEditor editable />
      {open ? <ItemSelector /> : null}
    </>
  );
}

/** Types into the picker's search at once (typing letter by letter re-renders long lists). */
export async function searchItems(user: UserEvent, text: string) {
  await user.click(screen.getByLabelText('Search items'));
  await user.paste(text);
}
