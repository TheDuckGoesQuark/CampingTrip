/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Match the production base URL so import.meta.env.BASE_URL is correct
  base: '/CampingTrip/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Inline Three.js ecosystem to avoid ESM/CJS issues in tests
    server: {
      deps: {
        inline: [
          'three',
          '@react-three/fiber',
          '@react-three/drei',
          '@react-three/test-renderer',
        ],
      },
    },
  },
});
