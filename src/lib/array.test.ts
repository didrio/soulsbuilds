import { describe, expect, it } from 'vitest';
import { compact, sortBy } from './array';

describe('compact', () => {
  it('drops falsy values and keeps order', () => {
    expect(compact(['a', null, 'b', undefined, '', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('sortBy', () => {
  it('sorts ascending by the key without mutating the input', () => {
    const input = [{ n: 3 }, { n: 1 }, { n: 2 }];
    expect(sortBy(input, ({ n }) => n)).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(input[0]).toEqual({ n: 3 });
  });

  it('is stable for equal keys', () => {
    const input = [
      { name: 'b', id: 1 },
      { name: 'a', id: 2 },
      { name: 'b', id: 3 },
    ];
    expect(sortBy(input, ({ name }) => name).map(({ id }) => id)).toEqual([2, 1, 3]);
  });

  it('compares strings by code unit like lodash (uppercase before lowercase)', () => {
    expect(sortBy(['b', 'B', 'a'], (s) => s)).toEqual(['B', 'a', 'b']);
  });
});
