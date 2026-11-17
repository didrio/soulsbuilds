// The preview image of a build (1200×630): its picture item, name, level, author and gear, in the game's
// skin. Satori turns the element tree into SVG and resvg into a PNG; both run in the function.
import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';
import {
  COLOR_BG,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_TILE_BORDER,
} from '@/theme/colors';
import { SKINS } from '@/theme/skins';
import { GAME_ELDEN_RING, type GameId } from '@/lib/models';
import { truncate } from '@/lib/share';

interface CardTreeData extends Omit<CardData, 'icon'> {
  icon: string | null;
}

export interface CardData {
  game: GameId;
  name: string;
  level: number;
  author: string;
  weapons: string[];
  /** The picture item's icon (a webp file), or null (the card shows the mark instead). */
  icon: Uint8Array | null;
}

/** Longest name the card sets (two lines at its size); build names are capped at 80 by the rules. */
const NAME_MAX = 50;
/** Up to this many characters the name is set large (two lines); longer ones smaller. */
const NAME_LARGE_MAX = 36;

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

type Style = Record<string, string | number>;
interface El {
  type: string;
  props: Record<string, unknown> & { style: Style; children?: unknown };
}

const el = (
  type: string,
  style: Style,
  children?: unknown,
  props: Record<string, unknown> = {},
): El => ({
  type,
  props: { ...props, style: { display: 'flex', ...style }, children },
});

const fontFile = (name: string) => readFileSync(new URL(`../fonts/${name}`, import.meta.url));
let fonts: { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }[] | undefined;
const loadFonts = () =>
  (fonts ??= [
    {
      name: 'Spectral',
      data: fontFile('spectral-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Spectral',
      data: fontFile('spectral-latin-600-normal.woff'),
      weight: 600,
      style: 'normal',
    },
    {
      name: 'Cinzel',
      data: fontFile('cinzel-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
  ]);

/** The card as an element tree (exported so the layout can be tested without rendering). */
export function cardTree(card: CardTreeData): El {
  const skin = SKINS[card.game] ?? SKINS[GAME_ELDEN_RING];
  const picture = card.icon
    ? el('img', { width: 256, height: 256, objectFit: 'contain' }, undefined, {
        src: card.icon,
        width: 256,
        height: 256,
      })
    : el('div', { fontFamily: 'Cinzel', fontWeight: 700, fontSize: 120, color: skin.accent }, 'SB');
  return el(
    'div',
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      padding: 36,
      boxSizing: 'border-box',
      flexDirection: 'column',
      backgroundColor: COLOR_BG,
      fontFamily: 'Spectral',
      color: COLOR_TEXT,
    },
    el(
      'div',
      {
        flex: 1,
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: `2px solid ${skin.frame}`,
        padding: '44px 52px 36px',
        backgroundImage: `linear-gradient(135deg, ${skin.tint} 0%, ${COLOR_BG} 55%)`,
      },
      [
        el('div', { flex: 1, gap: 52, alignItems: 'center' }, [
          el(
            'div',
            {
              width: 320,
              height: 320,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLOR_SURFACE,
              border: `2px solid ${COLOR_TILE_BORDER}`,
            },
            picture,
          ),
          el('div', { flex: 1, flexDirection: 'column', gap: 14 }, [
            el(
              'div',
              {
                fontSize: card.name.length <= NAME_LARGE_MAX ? 74 : 58,
                fontWeight: 600,
                lineHeight: 1.08,
                wordBreak: 'break-word',
              },
              truncate(card.name, NAME_MAX),
            ),
            el('div', { gap: 22, fontSize: 38, color: skin.accentStrong }, [
              el('div', {}, `Level ${card.level}`),
              el('div', { color: COLOR_TEXT_MUTED }, `by ${card.author}`),
            ]),
            card.weapons.length
              ? el(
                  'div',
                  { fontSize: 32, color: COLOR_TEXT_MUTED, lineClamp: 2 },
                  card.weapons.slice(0, 3).join(' · '),
                )
              : el('div', {}, ''),
          ]),
        ]),
        el('div', { justifyContent: 'space-between', alignItems: 'center' }, [
          el(
            'div',
            {
              fontFamily: 'Cinzel',
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 4,
              color: skin.accent,
            },
            'SOULS BUILDS',
          ),
          el('div', { fontSize: 28, color: COLOR_TEXT_MUTED }, 'soulsbuilds.com'),
        ]),
      ],
    ),
  );
}

/** Satori and resvg can't read WebP, so the icon goes in as a PNG data URI. */
async function iconDataUri(webp: Uint8Array): Promise<string> {
  const png = await sharp(webp)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

/** The card as PNG bytes. */
export async function renderCard(input: CardData): Promise<Uint8Array> {
  const card = { ...input, icon: input.icon ? await iconDataUri(input.icon) : null };
  // Satori's own element type is React's; this plain tree has the same shape.
  const svg = await satori(cardTree(card) as unknown as Parameters<typeof satori>[0], {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng();
}
