import globals from 'globals'
import tseslint from 'typescript-eslint'
import json from '@eslint/json'
import css from '@eslint/css'
import { defineConfig, globalIgnores } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

/** @type {import("eslint").Linter.Config} */
export default defineConfig([
  globalIgnores(['**/dist/**', '**/.turbo/**'], 'Ignore Build & Cache Directories'),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    ...stylistic.configs.recommended,
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.json'],
    ignores: ['**/package.json'],
    plugins: { json },
    language: 'json/json',
  },
  { files: ['**/*.jsonc'], plugins: { json }, language: 'json/jsonc' },
  { files: ['**/*.css'], plugins: { css }, language: 'css/css' },
])
