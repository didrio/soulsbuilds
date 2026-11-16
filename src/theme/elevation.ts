// Shadows. Dark UI shows depth mostly by surface steps and hairlines; shadows are for overlays and for
// the sunken look of fields.
import { COLOR_SHADOW } from './colors';

/** Dialogs and popovers. */
export const SHADOW_OVERLAY = `0 24px 64px ${COLOR_SHADOW}`;
/** Sunken fields. */
export const SHADOW_FIELD = 'inset 0 2px 6px rgba(0, 0, 0, 0.5)';
