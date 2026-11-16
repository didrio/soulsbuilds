// Where every item comes from (T14): sources per item, Sites of Grace, regions in route order and the
// gate graph, written by `npm run data` (docs/data.md "Acquisition"). T15's "How to get this build"
// reads it. It's ~400 KB, so it stays its own module: neither core.ts nor index.ts imports it, and the
// guide should load it lazily (`import('@/data/acquisition')`).
//
// JSON boundary: the cast asserts the type from ./schema (src/data/data.test.ts validates the file).
import acquisitionJson from './er/acquisition.json';
import type { Acquisition, AcquisitionFile, Gate, Location, Region, Source } from './schema';

export const acquisition = acquisitionJson as Acquisition;

const locations = new Map(acquisition.locations.map((location) => [location.id, location]));
const regions = new Map(acquisition.regions.map((region) => [region.id, region]));
const gates = new Map(acquisition.gates.map((gate) => [gate.id, gate]));
const keyItems = new Map(acquisition.keyItems.map((item) => [item.id, item.name]));

/** An item's sources, best (earliest on the route) first; [] when none is known. */
export const sourcesOf = (file: AcquisitionFile, id: number): Source[] =>
  acquisition.items[file][String(id)] ?? [];

export const getLocation = (id: number | null | undefined): Location | undefined =>
  id == null ? undefined : locations.get(id);

export const getRegion = (id: number | null | undefined): Region | undefined =>
  id == null ? undefined : regions.get(id);

export const getGate = (id: string): Gate | undefined => gates.get(id);

/** Name of a key item (whetblade, cookbook, remembrance…), the `keyItems` file of a source's `item`. */
export const keyItemName = (id: number): string | undefined => keyItems.get(id);

/** Gates an item needs by what it is (Ash of War → Whetstone Knife, affinity → its whetblade…). */
export const implied = acquisition.implied;
