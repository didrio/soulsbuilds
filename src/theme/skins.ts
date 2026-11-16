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
  glowStrong: string;
}

export const SKINS: Record<GameId, GameSkin> = {
  // Elden Ring: Erdtree gold.
  [GAME_ELDEN_RING]: {
    accent: '#d8b874',
    accentStrong: '#f0d495',
    accentDeep: '#8a6d35',
    onAccent: '#1a1307',
    frame: 'rgba(216, 184, 116, 0.34)',
    frameSoft: 'rgba(216, 184, 116, 0.16)',
    glow: 'rgba(232, 196, 120, 0.13)',
    glowStrong: 'rgba(232, 196, 120, 0.24)',
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
  --sb-glow-strong: ${skin.glowStrong};
`;
