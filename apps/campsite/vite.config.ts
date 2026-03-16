import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'r3f': ['@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom', 'zustand', 'gsap'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
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
})
