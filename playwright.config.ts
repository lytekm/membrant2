import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5175',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://localhost:3101/api/health',
      env: {
        PORT: '3101',
        DATABASE_PATH: ':memory:',
        ALLOWED_ORIGINS: 'http://localhost:5175,http://localhost:8083',
      },
      timeout: 120_000,
    },
    {
      command: 'npm run dev --workspace @membrant/web -- --port 5175',
      url: 'http://localhost:5175',
      env: { VITE_API_URL: 'http://localhost:3101' },
      timeout: 120_000,
    },
    {
      command: 'npm run web --workspace @membrant/mobile -- --port 8083 --host localhost',
      url: 'http://localhost:8083',
      env: { CI: '1', EXPO_PUBLIC_API_URL: 'http://localhost:3101' },
      timeout: 180_000,
    },
  ],
});
