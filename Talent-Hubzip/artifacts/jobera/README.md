# Jobera Web (`@workspace/jobera`)

React 19 + Vite frontend — HR, namizəd və admin panelləri.

## Sərhəd

- Yalnız HTTP vasitəsilə API-yə qoşulur (`/api/*` → Vite proxy → `localhost:8080`)
- `@workspace/db` import etməz

## Əmrlər

```bash
pnpm --filter @workspace/jobera run dev
pnpm --filter @workspace/jobera run build
pnpm --filter @workspace/jobera run typecheck
```

## Env

- `PORT` — dev server (default 5000, layihədə 19796)
- `BASE_PATH` — `/` lokal üçün
