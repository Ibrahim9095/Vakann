# Modul Registry — Jobera Monorepo

| Modul ID | Path | Məsuliyyət | Asılılıq / sərhəd |
|----------|------|------------|-------------------|
| `jobera-web` | `artifacts/jobera` | React UI, 3 panel, public səhifələr | HTTP → `/api/*` (Vite proxy) |
| `api-server` | `artifacts/api-server` | Express routes, blur, payments, notifications | `@workspace/db`, `@workspace/api-zod` |
| `db` | `lib/db` | Drizzle schema, pool | PostgreSQL only |
| `api-client` | `lib/api-client-react` | Orval React Query hooks | HTTP |
| `api-zod` | `lib/api-zod` | Zod schemas (generated) | OpenAPI |
| `api-spec` | `lib/api-spec` | OpenAPI + Orval codegen | — |
| `scripts` | `scripts` | `seed-packages` | `@workspace/db` |
| `mockup-sandbox` | `artifacts/mockup-sandbox` | UI komponent sandbox | opsional |

## Modul qaydaları

1. Frontend `@workspace/db` import etməsin
2. `lib/db` schema dəyişəndə: `pnpm run typecheck:libs` + `drizzle-kit push`
3. OpenAPI dəyişəndə: `pnpm --filter @workspace/api-spec run codegen`

## README

- [`artifacts/jobera/README.md`](../../artifacts/jobera/README.md)
- [`artifacts/api-server/README.md`](../../artifacts/api-server/README.md)
