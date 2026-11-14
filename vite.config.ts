/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Port 5180 (strict) so this never collides with the owner's other projects (loz uses 5273).
export default defineConfig({
  plugins: [react()],
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
