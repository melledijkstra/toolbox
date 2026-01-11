# AGENTS.md

This file contains instructions and context for AI agents (and humans) working on the `@melledijkstra/main` repository.

## Project Overview

This is a monorepo containing a personal toolbox of various tools and utilities. It uses **pnpm workspaces** and **Turborepo** for management.

### Structure
- `packages/`: Contains the individual packages (e.g., `api`, `auth`, `config`, `storage`, `toolbox`).
- `packages/config`: Shared configuration package.

## Setup & Environment

*   **Package Manager:** Uses `pnpm`. Ensure you have the version specified in `package.json` (currently v10+).
*   **Node.js:** Ensure a compatible Node.js version is installed (see `.nvmrc` if available, otherwise assume latest LTS).

To install dependencies:
```bash
pnpm install
```

## Development Workflow

Use the following scripts defined in the root `package.json`:

*   **Development:** `pnpm dev` (Runs `turbo dev`)
*   **Build:** `pnpm build` (Runs `turbo build` using `tsdown`)
*   **Test:** `pnpm test` (Runs `vitest`)
*   **Lint:** `pnpm lint` (Runs `eslint .`)
*   **CI Check:** `pnpm local:ci` (Runs build, lint, and test sequentially)

## Coding Standards & Best Practices

### Architecture
*   **SOLID Principles:** Adhere to SOLID principles.
*   **Dependency Injection:** Prefer Dependency Injection to abstract external systems (e.g., storage, logging) rather than hardcoding them. This makes the code more testable and modular.

### TypeScript
*   **Strict Typing:** Avoid `any`. Use specific types.
*   **TS Config:** Sub-packages share configuration from `@melledijkstra/config`.
*   **Building:** Packages are built using `tsdown`.

### Testing
*   **Framework:** `vitest`.
*   **Test Location:** Co-located with source files (e.g., `*.test.ts`).
*   **Imports:** **Crucial:** Explicitly import test functions (`describe`, `it`, `expect`, `vi`) from `vitest` in every test file. Do not rely on globals, as they may not be configured correctly in all environments.
*   **Mocking:** Use specific types for mocks (e.g., `MockInstance` from `vitest`) instead of `any`.
*   **Constraints:** Avoid `@ts-ignore`. If a test violates TS constraints (like abstract class instantiation), omit the test or refactor.

### Linting
*   **Tools:** `eslint` (v9+), `typescript-eslint`, `@stylistic/eslint-plugin`.
*   **Rule:** Fix linting errors before submitting.

### Cryptography
*   **Implementation:** Use the global `crypto` object. Do not use `window.crypto` to ensure compatibility across Node.js and browser environments.

## Dependency Management

*   **Workspaces:** Use the `workspace:*` protocol for internal dependencies within the monorepo.
*   **DevDependencies:** Do not duplicate `devDependencies` (like `tsdown`, `typescript`, `vitest`) in sub-packages if they are already defined and managed at the project root.

## Specific Package Notes
*   **auth:** Uses the `arctic` library for OAuth 2.0.
