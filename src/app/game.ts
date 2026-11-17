// The game registry and "which game are we looking at". Souls Builds will cover more FromSoftware
// games; function and UX stay the same across them, and the look changes through the game's skin
// (src/theme/skins.ts). Only Elden Ring exists today.
import { GAME_ELDEN_RING, type GameId } from '@/lib/models';

export interface Game {
  id: GameId;
  /** Full name, for headings ("Elden Ring builds"). */
  name: string;
}

export const GAMES: Record<GameId, Game> = {
  [GAME_ELDEN_RING]: { id: GAME_ELDEN_RING, name: 'Elden Ring' },
};

/** Games the header's game menu lists as "Coming soon" (T79): where players will switch games. */
export const UPCOMING_GAMES: readonly string[] = [
  'Dark Souls Remastered',
  'Dark Souls II',
  'Dark Souls III',
];

/**
 * The game the current page is about. One game today; when per-game routes arrive (e.g. `/ds3/…`),
 * this reads the route (or the build's `game`) and nothing that calls it changes.
 */
export function useCurrentGame(): Game {
  return GAMES[GAME_ELDEN_RING];
}
