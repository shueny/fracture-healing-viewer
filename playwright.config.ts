import { defineConfig, devices } from '@playwright/test'

// End-to-end harness (ADR 0018). Runs against the production build served by
// `vite preview`, like the deployed site. `pnpm e2e` builds first.
const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  // WebGL runs on the CPU (SwiftShader) in CI, so frames are slow: one worker,
  // generous timeouts.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'harness-report/e2e.json' }],
    ['html', { open: 'never', outputFolder: 'harness-report/html' }],
  ],
  outputDir: 'harness-report/artifacts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          // Software WebGL so the 3D views render without a GPU.
          args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        },
      },
    },
  ],
  webServer: {
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
