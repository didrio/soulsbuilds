// Native replacements for the lodash helpers the 2022 code used.

/** Drops falsy values (null, undefined, '', 0, false), like lodash `compact`. */
export function compact<T>(items: readonly (T | null | undefined | false | '' | 0)[]): T[] {
  return items.filter((item): item is T => Boolean(item));
}

/** Stable ascending sort by a key, returning a new array, like lodash `sortBy` with one iteratee. */
export function sortBy<T>(items: readonly T[], key: (item: T) => number | string): T[] {
  return items
    .map((item, index) => ({ item, index, value: key(item) }))
    .sort((a, b) => {
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
