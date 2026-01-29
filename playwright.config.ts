import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Grok Voice Chat
 *
 * This configuration handles:
 * - WebGL/3D content testing with proper timeouts
 * - Screenshot and video capture on failure
 * - HTML report generation
 * - Local development server management
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // 3D tests may have resource conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for 3D/WebGL stability
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['list']
  ],

  outputDir: 'test-results/',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Capture artifacts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Extended timeouts for 3D content loading
    actionTimeout: 15000,
    navigationTimeout: 60000,

    // Viewport for 3D content
    viewport: { width: 1280, height: 900 },

    // Enable WebGL
    launchOptions: {
      args: [
        '--enable-webgl',
        '--enable-webgl2',
        '--use-gl=angle',
        '--ignore-gpu-blocklist',
        '--enable-features=VaapiVideoDecoder',
      ],
    },
  },

  // Expect settings for 3D content
  expect: {
    timeout: 30000, // Extended for 3D rendering
    toHaveScreenshot: {
      maxDiffPixels: 100, // Allow minor differences in 3D rendering
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Force WebGL support
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-webgl2',
            '--use-gl=angle',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
  ],

  // Local dev server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
