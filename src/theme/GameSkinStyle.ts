import { createGlobalStyle } from 'styled-components';
import type { GameId } from '@/lib/models';
import { SKINS, skinVariables } from './skins';

/** Writes the current game's skin (accent, frame, glow) to :root as CSS custom properties. */
const GameSkinStyle = createGlobalStyle<{ $game: GameId }>`
  :root {
    ${({ $game }) => skinVariables(SKINS[$game])}
  }
`;

export default GameSkinStyle;
