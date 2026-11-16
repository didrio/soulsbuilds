// Shadows. Dark UI shows depth mostly by surface steps and frames; shadows are for overlays and for the
// sunken look of fields and frames.
import { COLOR_BLACK, COLOR_SHADOW } from './colors';

/** Dialogs and popovers. */
export const SHADOW_OVERLAY = `0 24px 64px ${COLOR_SHADOW}`;
/** Inside a framed panel: a black inner line and a soft inner shade. */
export const SHADOW_FRAME = `inset 0 0 0 1px ${COLOR_BLACK}, inset 0 0 40px rgba(0, 0, 0, 0.35)`;
/** Sunken fields. */
export const SHADOW_FIELD = 'inset 0 2px 6px rgba(0, 0, 0, 0.5)';
