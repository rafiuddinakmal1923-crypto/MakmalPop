import { defineConfig } from '@playwright/test'

// Runs against the production build (vite preview), so the service worker and offline caching are real.
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    // Software WebGL so the 3D scene renders in headless Chromium.
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
