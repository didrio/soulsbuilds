/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Port 5180 (strict) so this never collides with the owner's other projects (loz uses 5273).
export default defineConfig({
  // React Compiler (auto-memoization) runs as a Babel preset; plugin-react v6 has no `babel` option.
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  // `@/` = src/ (same alias in tsconfig.json "paths").
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
  preview: { host: '127.0.0.1', port: 5181, strictPort: true },
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}', 'scripts/**/*.test.{js,mjs,ts}'],
    css: false,
  },
});
