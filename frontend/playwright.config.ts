import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: 'capture.test.ts',
  use: { headless: true },
})
