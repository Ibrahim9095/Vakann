---
name: DB declarations rebuild
description: When and how to rebuild the @workspace/db TypeScript declarations
---

## Problem
After schema changes or fresh checkout, `lib/db/dist/schema/index.d.ts` can end up as `export {}` (empty), causing TypeScript errors like "Module '@workspace/db' has no exported member 'usersTable'" in the API server typecheck.

**Why:** The DB package uses `composite: true` with `emitDeclarationOnly`. If the declarations are stale or missing, tsc for dependent packages can't resolve the exports.

## Fix
```bash
cd lib/db && npx tsc -p tsconfig.json
```

This regenerates `dist/schema/index.d.ts` with all table exports.

**Note:** The API server runtime (esbuild) still works correctly even with stale declarations — this only affects `tsc --noEmit` typecheck.
