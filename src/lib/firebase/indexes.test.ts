// Every builds list/search query has its composite index in firestore.indexes.json. The emulator never
// checks indexes, so a missing or mis-ordered one only fails in production ("The query requires an
// index"). This records the constraints each query sends and derives the index Firestore asks for.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listBuilds, searchBuilds, type BuildSort } from './builds';

type Constraint =
  | { kind: 'where'; field: string; op: string }
  | { kind: 'orderBy'; field: string; direction: 'asc' | 'desc' }
  | { kind: 'other' };

const sent: Constraint[][] = [];

vi.mock('./app', () => ({ firestore: {} }));
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  collection: () => ({}),
  where: (field: string, op: string): Constraint => ({ kind: 'where', field, op }),
  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc'): Constraint => ({
    kind: 'orderBy',
    field,
    direction,
  }),
  limit: (): Constraint => ({ kind: 'other' }),
  startAfter: (): Constraint => ({ kind: 'other' }),
  query: (_collection: unknown, ...constraints: Constraint[]) => constraints,
  getDocs: (constraints: Constraint[]) => {
    sent.push(constraints);
    return Promise.resolve({ docs: [] });
  },
}));

interface IndexField {
  fieldPath: string;
  order?: 'ASCENDING' | 'DESCENDING';
  arrayConfig?: 'CONTAINS';
}
// A JSON boundary: the file's shape is Firebase's index format.
const indexes = (
  JSON.parse(readFileSync('firestore.indexes.json', 'utf8')) as {
    indexes: { collectionGroup: string; queryScope: string; fields: IndexField[] }[];
  }
).indexes.filter(
  (index) => index.collectionGroup === 'builds' && index.queryScope === 'COLLECTION',
);

const RANGE_OPS = new Set(['<', '<=', '>', '>=', '!=']);

/**
 * The index a query needs, as "field:ORDER" strings: equality and array-contains fields (any order, so
 * sorted here), then the orderBy fields, then the range fields not ordered on, by name, in the direction
 * of the last orderBy (Firestore's implicit order; docs "multiple-range-fields").
 */
function requiredIndex(constraints: Constraint[]) {
  const wheres = constraints.filter((c) => c.kind === 'where');
  const orders = constraints.filter((c) => c.kind === 'orderBy');
  const equality = wheres
    .filter((c) => !RANGE_OPS.has(c.op))
    .map((c) => `${c.field}:${c.op === 'array-contains' ? 'CONTAINS' : 'ASCENDING'}`)
    .sort();
  const toOrder = (direction: 'asc' | 'desc') => (direction === 'asc' ? 'ASCENDING' : 'DESCENDING');
  const lastDirection = toOrder(orders.at(-1)?.direction ?? 'asc');
  const ordered = orders.map((c) => `${c.field}:${toOrder(c.direction)}`);
  const ranges = [
    ...new Set(
      wheres
        .filter((c) => RANGE_OPS.has(c.op) && !orders.some((o) => o.field === c.field))
        .map((c) => c.field),
    ),
  ]
    .sort()
    .map((field) => `${field}:${lastDirection}`);
  return { equality, rest: [...ordered, ...ranges] };
}

function hasIndex({ equality, rest }: ReturnType<typeof requiredIndex>) {
  return indexes.some((index) => {
    const fields = index.fields.map((f) => `${f.fieldPath}:${f.arrayConfig ?? f.order}`);
    const head = fields.slice(0, equality.length);
    return (
      [...head].sort().join() === equality.join() &&
      fields.slice(equality.length).join() === rest.join()
    );
  });
}

const LEVELS = [{}, { minLevel: 50 }, { maxLevel: 150 }, { minLevel: 50, maxLevel: 150 }];

describe('firestore.indexes.json', () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it('covers every listBuilds query (sort × tag or weapon × level range)', async () => {
    const sorts: BuildSort[] = ['top', 'new', 'played'];
    const narrows = [{}, { tag: 'PVE' }, { weaponId: 2000000 }];
    for (const sort of sorts)
      for (const narrow of narrows)
        for (const levels of LEVELS) await listBuilds({ sort, ...narrow, ...levels });

    expect(sent).toHaveLength(sorts.length * narrows.length * LEVELS.length);
    const missing = sent.map(requiredIndex).filter((needed) => !hasIndex(needed));
    expect(missing).toEqual([]);
  });

  it('covers every searchBuilds query (tag × level range)', async () => {
    for (const tag of [undefined, 'PVE'])
      for (const levels of LEVELS) await searchBuilds('moon', { tag, ...levels });

    const missing = sent.map(requiredIndex).filter((needed) => !hasIndex(needed));
    expect(missing).toEqual([]);
  });
});
