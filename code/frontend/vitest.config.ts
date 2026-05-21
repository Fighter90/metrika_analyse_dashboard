/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx = DOM bootstrap; setup = test harness.
      exclude: ['src/main.tsx', 'src/test/**', '**/*.test.{ts,tsx}'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
