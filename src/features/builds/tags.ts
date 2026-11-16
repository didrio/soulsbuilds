// How many of a row's tags fit on its one tags line (T22: every build row is the same height).

/**
 * The number of chips, in order, that fit in `available` px with `gap` px between them. When not all
 * of them fit, room is kept for a "+N" chip of `moreWidth` px after the last one shown. Nothing laid
 * out yet (`available` 0, e.g. in tests or before the first layout) shows them all.
 */
export function fitCount(widths: number[], available: number, gap: number, moreWidth: number) {
  if (available <= 0) return widths.length;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
  if (total <= available) return widths.length;

  let used = moreWidth;
  let count = 0;
  for (const width of widths) {
    used += width + gap;
    if (used > available) break;
    count += 1;
  }
  return count;
}
