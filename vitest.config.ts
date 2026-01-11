import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      'packages/*',
    ],
    coverage: {
      provider: 'v8',
      exclude: ['**/dist/**'],
    },
  },
})
