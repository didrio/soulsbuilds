// Types for scripts/lib/build-from-names.mjs (used by tests).
import type { BuildImage, Equipment } from '../../src/lib/models';

/** An item from one of src/data/er/'s lists (the fields beyond id and name depend on the file). */
export type Item = { id: number; name: string } & Record<string, unknown>;

/** The game data as read from src/data/er/: each item list by file, the classes and curves, the tags. */
export type ItemData = Record<string, Item[]> & {
  character: {
    classes: { id: number; name: string; level: number; stats: Record<string, number> }[];
    curves: Record<string, unknown>;
  };
  tags: Set<string>;
};

export function loadItemData(dir?: string): ItemData;

export const ARMOR_SLOTS: Record<'helm' | 'chest' | 'gauntlet' | 'leg', string>;

/** Equipment by item names (weapons positional, Ashes by skill name) → game IDs; throws on anything invalid. */
export function toEquipmentIds(
  equipment: Record<string, unknown>,
  data: ItemData,
  label?: string,
): Equipment;

export const IMAGE_FILES: Record<BuildImage['kind'], string>;

export function imageOf(
  image: { kind: BuildImage['kind']; name: string } | null | undefined,
  data: ItemData,
  label?: string,
): BuildImage | null;

export function classId(
  name: string | null | undefined,
  data: ItemData,
  label?: string,
): number | null;
