// jsdom has no `matchMedia`: a stub that answers `max-width` / `min-width` queries for a window width
// tests set (desktop by default), so components that pick a layout in JS (`useMediaQuery`) can be
// rendered both ways. Installed by setup.ts; reset after each test.
import { act } from '@testing-library/react';

const DESKTOP_WIDTH = 1280;
let width = DESKTOP_WIDTH;
const listeners = new Set<() => void>();

function matches(query: string) {
  const max = /max-width:\s*(\d+)px/.exec(query);
  const min = /min-width:\s*(\d+)px/.exec(query);
  return (!max || width <= Number(max[1])) && (!min || width >= Number(min[1]));
}

export function installMatchMedia() {
  // The data-pipeline tests run in Node, without a window.
  if (typeof window === 'undefined') return;
  window.matchMedia = (query: string) =>
    // Only what useMediaQuery uses; the cast covers the legacy members nothing here calls.
    ({
      media: query,
      get matches() {
        return matches(query);
      },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    }) as unknown as MediaQueryList;
}

/** Sets the window width the stub answers for, and tells subscribers. Phones: 390. */
export function setViewportWidth(next: number) {
  width = next;
  act(() => listeners.forEach((listener) => listener()));
}

export function resetViewport() {
  width = DESKTOP_WIDTH;
  listeners.clear();
}
