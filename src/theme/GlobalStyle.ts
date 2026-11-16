import { createGlobalStyle } from 'styled-components';
import {
  COLOR_ACCENT_STRONG,
  COLOR_BG,
  COLOR_BG_TOP,
  COLOR_FRAME,
  COLOR_TEXT,
  COLOR_VIGNETTE,
} from './colors';
import { FONT_UI, TEXT_MD } from './fonts';

// Film grain over the whole page (an SVG noise tile, ~6% white). Pure CSS, no image request.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0'/></filter>" +
  "<rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

/**
 * Page-wide base styles: background (warm top light, vignette, grain), text, the default focus ring,
 * a light link reset, and reduced motion.
 */
const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    background-color: ${COLOR_BG};
    color-scheme: dark;
  }

  body {
    margin: 0;
    min-height: 100vh;
    color: ${COLOR_TEXT};
    font-family: ${FONT_UI};
    font-size: ${TEXT_MD};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Warm top light and vignette, fixed to the viewport. A fixed layer of its own, not
     \`background-attachment: fixed\` on body: that repaints the whole page on every scroll frame and
     dropped ~40% of frames while scrolling (T21). Behind the content (z-index -1; body has no
     background of its own, html paints COLOR_BG). */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(ellipse 120% 70% at 50% 0%, ${COLOR_BG_TOP} 0%, transparent 60%),
      radial-gradient(ellipse at 50% 50%, transparent 55%, ${COLOR_VIGNETTE} 100%);
  }

  /* Grain over everything (panels are opaque, so it can't sit behind them). Its own compositor
     layer: rasterized once, then only composited while scrolling. */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 1000;
    pointer-events: none;
    opacity: 0.5;
    background-image: ${GRAIN};
    will-change: transform;
  }

  a {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }

  button, input, select, textarea {
    font: inherit;
    color: inherit;
  }

  :focus-visible {
    outline: 2px solid ${COLOR_ACCENT_STRONG};
    outline-offset: 2px;
  }

  ::selection {
    background: ${COLOR_FRAME};
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyle;
