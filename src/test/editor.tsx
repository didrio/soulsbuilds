// Editor test helpers: the build sidebar (editable) with the item picker, as the page and App render them.
import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { useAppSelector } from '@/app/hooks';
import ItemSelector from '@/features/editor/ItemSelector';
import BuildSidebar from '@/features/editor/sections/BuildSidebar';
import { selectSlotType } from '@/features/editor/store/selectors';

/** The editor plus the picker modal (open while a slot type is set). */
export function EditorWithPicker() {
  const open = useAppSelector(selectSlotType) !== null;
  return (
    <>
      <BuildSidebar editable level={1} />
      {open ? <ItemSelector /> : null}
    </>
  );
}

/** Types into the picker's search at once (typing letter by letter re-renders long lists). */
export async function searchItems(user: UserEvent, text: string) {
  await user.click(screen.getByLabelText('Search items'));
  await user.paste(text);
}
