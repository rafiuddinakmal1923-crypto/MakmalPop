/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MakmalPop',
        short_name: 'MakmalPop',
        description: 'Makmal fizik pop-up 3D luar talian untuk KSSM Tingkatan 4 dan 5',
        lang: 'ms',
        theme_color: '#F26B1D',
        background_color: '#F7F2E7',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the app needs offline. Missing a file type here breaks airplane mode.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,glb,mp3,ogg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Split the big libraries into their own chunks: they cache separately and the app code stays small.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\/](three|three-stdlib|@react-three|@react-spring|@monogrid|troika-|maath|meshline|camera-controls|stats-gl|suspend-react|its-fine)/ },
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler|zustand|use-sync-external-store)[\/]/ },
          ],
        },
      },
    },
    // The three.js chunk (three + R3F + drei + React DOM) is about 1.2 MB minified, 320 kB gzipped. That is expected
    // for a 3D app and fits the 15 MB budget; the limit is set just above it so real growth still warns.
    chunkSizeWarningLimit: 1300,
  },
  // content/ and assets/ live outside app/, so the dev server must be allowed to read them.
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
