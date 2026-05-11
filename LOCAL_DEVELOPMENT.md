# Local Development Guide

This guide explains how to use packages from this monorepo in external projects during development.

## 🎯 Recommended Approaches

### Option 1: Yalc (Recommended)

**Best for:** Most use cases, simulates publishing, no symlink issues

#### Setup

```bash
# Install yalc globally (once)
npm i -g yalc
```

#### Usage

**In this monorepo:**

```bash
# Publish all packages to yalc store
pnpm yalc:publish

# Or publish individually
cd packages/auth
yalc publish
```

**In your external project:**

```bash
# Add packages from yalc
yalc add @melledijkstra/auth @melledijkstra/storage
pnpm install
```

**When you make changes:**

```bash
# In this monorepo - auto-updates all linked projects
pnpm yalc:push

# Or for specific package
cd packages/auth
yalc push
```

**Cleanup:**

```bash
# In external project
yalc remove --all
pnpm install
```

---

### Option 2: pnpm link (Manual)

**Best for:** Quick one-off testing

#### Usage

**In this monorepo:**

```bash
# Link all packages globally
pnpm link:all

# Or link individually
cd packages/auth
pnpm link --global
```

**In your external project:**

```bash
pnpm link --global @melledijkstra/auth @melledijkstra/storage
```

**Cleanup:**

```bash
# In this monorepo
pnpm unlink:all

# In external project
pnpm unlink @melledijkstra/auth
```

---

### Option 3: File Protocol (Simplest)

**Best for:** Simple cases, stable paths

#### Usage

**In your external project's `package.json`:**

```json
{
  "dependencies": {
    "@melledijkstra/auth": "file:../toolbox/packages/auth",
    "@melledijkstra/storage": "file:../toolbox/packages/storage"
  }
}
```

Then run `pnpm install`. Changes require rebuilding the packages (`pnpm build` in this repo).

---

## 🔄 Workflow Recommendations

### Daily Development with Yalc

```bash
# 1. Make changes in this monorepo
# 2. Push updates to all linked projects
pnpm yalc:push

# Your external projects auto-update!
```

### Before Committing

```bash
# Run full CI check
pnpm local:ci
```

### Publishing to npm (when ready)

```bash
# Ensure everything is built and tested
pnpm build && pnpm test --run

# Publish individually with changesets or manually
cd packages/auth
pnpm publish
```

---

## ⚠️ Common Issues

### "Cannot find module" with pnpm link

- Ensure packages are built: `pnpm build`
- Check the link exists: `pnpm list -g --depth=0`

### Changes not reflecting

- **With yalc:** Run `yalc push` in the changed package
- **With file protocol:** Rebuild the package
- **With pnpm link:** Rebuild and may need to restart dev server

### TypeScript errors with linked packages

- Ensure `tsconfig.json` preserves symlinks:

  ```json
  {
    "compilerOptions": {
      "preserveSymlinks": true
    }
  }
  ```

---

## 💡 Tips

1. **Yalc** is the sweet spot - combines ease of use with reliability
2. Keep this repo built when developing: `pnpm build --watch` (if configured)
3. Use `pnpm yalc:push` script for bulk updates
4. Remember to unlink/remove before publishing to npm
5. For React/UI packages, you may need to dedupe dependencies in the consuming project
