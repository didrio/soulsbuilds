// Firestore data model v2 (T3): the app-side types and the document shapes behind them. See
// docs/architecture.md "Firestore model (v2)". firestore.rules validates every write, so reads are
// trusted to have these shapes (src/lib/firebase/ casts at the boundary).
import type { Timestamp } from 'firebase/firestore';
import type { Stats } from './buildMath';

export const GAME_ELDEN_RING = 'elden-ring';
export type GameId = typeof GAME_ELDEN_RING;

/** Limits enforced by firestore.rules; the UI uses them for maxLength and validation. */
export const LIMITS = {
  buildName: 80,
  description: 20000,
  tags: 20,
  displayName: 40,
  comment: 1000,
} as const;

/**
 * Item names per slot group (T7 moves to IDs). Weapon lists are positional, 6 long (slots 1–3 main
 * hand, 4–6 off hand; null = empty); arrows positional, 4 long; the rest compacted.
 */
export interface Equipment {
  weapons: (string | null)[];
  weaponAffinities: (string | null)[];
  weaponSkills: (string | null)[];
  arrows: (string | null)[];
  talismans: string[];
  spells: string[];
  tears: string[];
  consumables: string[];
  helm: string | null;
  chest: string | null;
  gauntlet: string | null;
  leg: string | null;
}

/** What the build editor saves: the owner-editable part of a build. */
export interface BuildContent {
  name: string;
  description: string;
  tags: string[];
  level: number;
  stats: Stats;
  equipment: Equipment;
}

/** builds/{id} as stored. */
export interface BuildDoc extends BuildContent {
  ownerId: string;
  game: GameId;
  /** `name.toLowerCase()`, for prefix search (T9). */
  nameLower: string;
  likeCount: number;
  commentCount: number;
  /** Set by the comment counter (see firestore.rules); not used by the UI. */
  lastCommentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Build extends BuildContent {
  id: string;
  ownerId: string;
  game: GameId;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** users/{uid} as stored: the public profile. Email lives only in Firebase Auth. */
export interface UserDoc {
  displayName: string;
  createdAt: Timestamp;
}

export interface UserProfile {
  id: string;
  displayName: string;
  createdAt: Date;
}

/** builds/{buildId}/comments/{id} as stored. */
export interface CommentDoc {
  authorId: string;
  text: string;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

/** builds/{buildId}/likes/{uid} as stored (the doc id is the liker's uid). */
export interface LikeDoc {
  userId: string;
  createdAt: Timestamp;
}
