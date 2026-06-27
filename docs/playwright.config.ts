import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE = '/starlight-quiz';

// Use the pre-installed Chromium when present (e.g. this dev environment); fall
// back to Playwright's managed download elsewhere (e.g. CI after `playwright install`).
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}/`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: `http://localhost:${PORT}${BASE}/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
