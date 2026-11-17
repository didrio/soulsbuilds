import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { installMatchMedia, resetViewport } from './viewport';

installMatchMedia();

// findBy*/waitFor give up after 1 s by default. A full build page's first render takes ~0.3 s alone on a
// laptop, but several times that on CI's smaller runners with every test file running in parallel
// (BuildEditorPage's retry test failed there twice, 2026-11-17). 3 s still fails fast on a real bug.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
  resetViewport();
});
