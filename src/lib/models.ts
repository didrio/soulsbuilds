// Firestore document shapes, model v1 (2022). See docs/architecture.md "Firestore model (v1)".
// Reads are NOT validated: v1 documents are trusted as-is and may contain numeric strings or miss
// fields (code that reads them keeps its 2022 defaults). T3 replaces this with model v2 + rules.
import type { StatValue } from './buildMath';

export interface BuildComment {
  /** Author uid. */
  user: string;
  comment: string;
  /** Epoch milliseconds. */
  date: number;
}

/** builds/{id}. Weapon arrays are positional (slots 1–3 main hand, 4–6 off hand). */
export interface BuildDoc {
  /** Owner uid. */
  user: string;
  name: string;
  /** Markdown, rendered through rehype-sanitize. */
  description: string;
  tags: string[];
  /** Character level as a string ("131"). */
  level: string;
  likes: number;
  comments: BuildComment[];
  vigor: StatValue;
  mind: StatValue;
  end: StatValue;
  str: StatValue;
  dex: StatValue;
  int: StatValue;
  fai: StatValue;
  arc: StatValue;
  weapons: (string | null)[];
  weaponAffinities: (string | null)[];
  weaponSkills: (string | null)[];
  arrows: (string | null)[];
  tals: string[];
  spells: string[];
  tears: string[];
  cons: string[];
  helm: string | null;
  chest: string | null;
  gauntlet: string | null;
  leg: string | null;
}

export type Build = BuildDoc & { id: string };

/** users/{uid}. */
export interface UserDoc {
  /** Set by the client at signup (T3 moves admin to a custom claim). */
  admin: boolean;
  /** Public today (T3 moves it to a private doc). */
  email: string;
  name: string;
  builds?: string[];
  likedBuilds?: string[];
}

export type User = UserDoc & { id: string };
