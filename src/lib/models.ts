// Firestore data model v2 (T3): the app-side types and the document shapes behind them. See
// docs/architecture.md "Firestore model (v2)". firestore.rules validates every write, so reads are
// trusted to have these shapes (src/lib/firebase/ casts at the boundary).
import type { Timestamp } from 'firebase/firestore';
import type { AffinityKey } from '@/data/schema';
import type { Stats } from './buildMath';

export const GAME_ELDEN_RING = 'elden-ring';
export type GameId = typeof GAME_ELDEN_RING;

/** Limits enforced by firestore.rules; the UI uses them for maxLength and validation. */
export const LIMITS = {
  buildName: 80,
  description: 20000,
  tags: 20,
  displayName: 40,
  /** Minimum password length (T30), also set as the Firebase Auth password policy (docs/firebase.md). */
  password: 8,
  comment: 1000,
  reportNote: 500,
} as const;

/**
 * Items by game ID (the param row ID in src/data/er/; each field implies the file). Weapon lists are
 * positional, 6 long (slots 1–3 main hand, 4–6 off hand; null = empty); arrows positional, 4 long;
 * the rest compacted. A weapon's affinity is null for Standard, its skill the Ash of War applied
 * (null = the weapon's built-in skill); the editor keeps both valid for the weapon (src/data/rules.ts).
 */
export interface Equipment {
  weapons: (number | null)[];
  weaponAffinities: (AffinityKey | null)[];
  weaponSkills: (number | null)[];
  arrows: (number | null)[];
  talismans: number[];
  spells: number[];
  tears: number[];
  consumables: number[];
  helm: number | null;
  chest: number | null;
  gauntlet: number | null;
  leg: number | null;
  greatRune: number | null;
  spiritAsh: number | null;
}

/**
 * The kinds of item a build image can be (T40): gear, named like the `Equipment` fields (one kind per
 * data file or armor slot, since game IDs only identify an item within its file). No arrows or
 * consumables. firestore.rules lists the same kinds.
 */
export const IMAGE_KINDS = [
  'weapon',
  'helm',
  'chest',
  'gauntlet',
  'leg',
  'talisman',
  'spell',
  'tear',
  'greatRune',
  'spiritAsh',
] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

/** The item the author chose to represent the build (T40); see `buildImage` in ./equipment. */
export interface BuildImage {
  kind: ImageKind;
  id: number;
}

/** What the build editor saves: the owner-editable part of a build. */
export interface BuildContent {
  name: string;
  description: string;
  tags: string[];
  level: number;
  stats: Stats;
  /**
   * Starting class by CharaInitParam ID (3000 Vagabond … 3011 Heavy Knight; src/data/er/character.json), or
   * null for none. Builds from before T8 don't store it (read as null). The editor keeps every stat at
   * or above the class's base.
   */
  startingClass: number | null;
  equipment: Equipment;
  /**
   * The author's pick for the build's picture (T40), or null for the default (the main weapon). Shown
   * only while the item is still on the build (`buildImage`). Builds from before T40 don't store it.
   */
  image: BuildImage | null;
}

/** builds/{id} as stored. */
export interface BuildDoc extends Omit<BuildContent, 'startingClass' | 'image'> {
  /** Absent on builds saved before T8. */
  startingClass?: number | null;
  /** Absent on builds saved before T40. */
  image?: BuildImage | null;
  ownerId: string;
  game: GameId;
  /** `name.toLowerCase()`, for prefix search (T9). */
  nameLower: string;
  likeCount: number;
  commentCount: number;
  /**
   * Players tracking the build (in progress or finished) and those who finished it (T36). Moved by
   * exactly 1 with the player's tracking doc (firestore.rules). Absent on builds saved before T36
   * until `scripts/admin.mjs counts --write` backfills them.
   */
  playerCount?: number;
  finishedCount?: number;
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
  /** Everyone tracking it, playing or finished (T36). */
  playerCount: number;
  finishedCount: number;
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

/**
 * users/{uid}/tracking/{buildId} as stored (T34): one player's private progress on one build, read and
 * written only by them. The fields are `TrackingState` in src/lib/tracking.ts (item keys there).
 */
export interface TrackingDoc {
  game: GameId;
  collected: string[];
  seen: string[];
  /** Route stops marked done (T44); docs saved before T44 don't have it. */
  marked?: string[];
  stats: Stats;
  startedAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
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

/** Why something is reported (firestore.rules checks the value); labels are for the report form. */
export const REPORT_REASONS = {
  spam: 'Spam or advertising',
  offensive: 'Offensive or hateful',
  harassment: 'Harassment',
  other: 'Something else',
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

/** reports/{targetId}_{reporterUid} as stored. `commentId` is null for a report about a build. */
export interface ReportDoc {
  reporterId: string;
  buildId: string;
  commentId: string | null;
  reason: ReportReason;
  /** Optional detail from the reporter ('' when none). */
  note: string;
  /** 'open' from a client; scripts/admin.mjs sets 'removed' or 'dismissed' and resolvedAt. */
  status: 'open' | 'removed' | 'dismissed';
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

/** stats/{game} as stored: community numbers written once a day by `scripts/admin.mjs stats` (T20). */
export interface StatsDoc {
  buildCount: number;
  /** Distinct owners of the game's builds ("by M players"). */
  authorCount: number;
  /** Every account, with or without builds. */
  userCount: number;
  /** Builds per tag. */
  tagCounts: Record<string, number>;
  /** Builds per weapon game ID (T55); absent until the daily job has run since T55's deploy. */
  weaponCounts?: Record<string, number>;
  updatedAt: Timestamp;
}

export interface GameStats extends Omit<StatsDoc, 'updatedAt'> {
  updatedAt: Date;
}
