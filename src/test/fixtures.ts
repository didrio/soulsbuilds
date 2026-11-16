// Model v2 fixtures for component tests.
import type { Build, Comment, Equipment, UserProfile } from '@/lib/models';

/** Game IDs used across tests. */
export const MOONVEIL = 9060000;
export const UCHIGATANA = 9000000;
export const SEPPUKU_ASH = 60600;
export const WHITE_MASK = 680000;
export const GODRICKS_GREAT_RUNE = 191;

export const emptyEquipment = (): Equipment => ({
  weapons: [null, null, null, null, null, null],
  weaponAffinities: [null, null, null, null, null, null],
  weaponSkills: [null, null, null, null, null, null],
  arrows: [null, null, null, null],
  talismans: [],
  spells: [],
  tears: [],
  consumables: [],
  helm: null,
  chest: null,
  gauntlet: null,
  leg: null,
  greatRune: null,
  spiritAsh: null,
});

export const makeBuild = (overrides: Partial<Build> = {}): Build => ({
  id: 'SEEDMOON0001',
  ownerId: 'seed-ranni',
  game: 'elden-ring',
  name: 'Carian Moon Knight',
  description: 'Moonveil and full-moon sorceries.',
  tags: ['Rennala'],
  level: 132,
  stats: { vigor: 40, mind: 30, end: 15, str: 12, dex: 18, int: 80, fai: 7, arc: 9 },
  startingClass: null,
  equipment: { ...emptyEquipment(), weapons: [MOONVEIL, null, null, null, null, null] },
  image: null,
  likeCount: 1,
  commentCount: 0,
  playerCount: 0,
  finishedCount: 0,
  createdAt: new Date(Date.UTC(2026, 9, 5)),
  updatedAt: new Date(Date.UTC(2026, 9, 5)),
  ...overrides,
});

export const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'seed-ranni',
  displayName: 'Ranni Fan',
  createdAt: new Date(Date.UTC(2026, 8, 3)),
  ...overrides,
});

export const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 'c1',
  authorId: 'seed-tarnished',
  text: 'Nice build!',
  createdAt: new Date(Date.UTC(2026, 10, 1)),
  ...overrides,
});
