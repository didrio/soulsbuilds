// Per-game skins: the only colors that change between games (function and layout never do). Each is
// written to CSS custom properties by GameSkinStyle and read through the COLOR_ACCENT… tokens.
// A new game adds an entry here (and colors.test.ts checks its contrast).
import { GAME_ELDEN_RING, type GameId } from '@/lib/models';

export interface GameSkin {
  accent: string;
  accentStrong: string;
  accentDeep: string;
  onAccent: string;
  frame: string;
  frameSoft: string;
  glow: string;
  /** The hero's glow. */
  tint: string;
  /** A collected item's border while tracking (T34). */
  accentLine: string;
  /** The bright glow of a moment: an item collected, a build complete (T34). */
  celebrate: string;
}

export const SKINS: Record<GameId, GameSkin> = {
  // Elden Ring: Erdtree gold (T79: a shade deeper, so the primary button doesn't glare).
  [GAME_ELDEN_RING]: {
    accent: '#cdad6c',
    accentStrong: '#e2c487',
    accentDeep: '#8a6d35',
    onAccent: '#1a1307',
    frame: 'rgba(205, 173, 108, 0.34)',
    frameSoft: 'rgba(205, 173, 108, 0.16)',
    glow: 'rgba(232, 196, 120, 0.13)',
    tint: 'rgba(232, 196, 120, 0.15)',
    accentLine: 'rgba(205, 173, 108, 0.6)',
    celebrate: 'rgba(240, 212, 149, 0.55)',
  },
};

/** The CSS custom properties for a game's skin, as a declaration block. */
export const skinVariables = (skin: GameSkin) => `
  --sb-accent: ${skin.accent};
  --sb-accent-strong: ${skin.accentStrong};
  --sb-accent-deep: ${skin.accentDeep};
  --sb-on-accent: ${skin.onAccent};
  --sb-frame: ${skin.frame};
  --sb-frame-soft: ${skin.frameSoft};
  --sb-glow: ${skin.glow};
  --sb-tint: ${skin.tint};
  --sb-accent-line: ${skin.accentLine};
  --sb-celebrate: ${skin.celebrate};
`;
