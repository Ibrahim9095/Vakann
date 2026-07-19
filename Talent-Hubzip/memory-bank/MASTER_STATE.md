# MASTER_STATE — Jobera.az

**Son yenilənmə:** 2026-07-08  
**Layihə:** Dual-panel iş platforması (HR + Namizəd + Admin)

## Stack

| Layer | Texnologiya | Path |
|-------|-------------|------|
| Frontend | React 19 + Vite | `artifacts/jobera` |
| Backend | Express 5 | `artifacts/api-server` |
| DB | PostgreSQL + Drizzle | `lib/db` |
| API client | Orval + React Query | `lib/api-client-react` |
| Spec | OpenAPI 3 | `lib/api-spec` |

## Biznes mexanikaları (kodda)

| Xüsusiyyət | Status | Qeyd |
|------------|--------|------|
| Per-HR blur + contact grants | Implemented | `artifacts/api-server/src/lib/blur.ts` |
| VIP (A-paket) + B-paket axını | Implemented | payments + checkout |
| Simulyasiya ödəniş | Implemented | `SimulatedPaymentProvider` |
| Abunəlik expiry job | Implemented | startup interval |
| Bildirişlər | Stub + in-app | Telegram/SMS env ilə |
| Multiposting | Stub | job create → social_posts |
| Fayl upload | Implemented | `POST /api/uploads` |
| HR reytinq UI | Implemented | RatingDialog |
| Şirkət səhifəsi | Implemented | `/companies/:id` |

| Matching alqoritmi | Implemented | `lib/matching/` — job/candidate recompute |
| B2B Premium HR | Implemented | HR packages, media view limits, subscriptions UI |
| Redis session + bcrypt | Implemented | `lib/session/`, `lib/password.ts` |
| Canlı müsahibə sayğacı (SSE) | Implemented | `platform_counters`, `/api/events` |
| Müsahibə dəvəti axını | Implemented | `contact_requests` + SMS/Telegram |
| Vakansiya filtrləri | Implemented | jobs schema + JobForm |
| Audio müraciət recorder | Implemented | `AudioRecorder` + applications voice |
| GoldenPay ödəniş | Implemented | `PAYMENT_PROVIDER=goldenpay` |
| Real multiposting | Partial | Telegram channel + IG/LI env ilə |

## Gözləyən (scope xarici / gələcək)

- Real ödəniş provayderi (GoldenPay, Stripe)
- SMS / Telegram / Instagram / LinkedIn credentials
- B2B Premium HR paketləri
- Namizəd-vakansiya matching alqoritmi
- Redis session, bcrypt (prod təhlükəsizlik)
- CI/CD pipeline

## Dev

```powershell
docker start jobera-postgres
docker start jobera-redis   # redis://localhost:6379
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5433/jobera'
$env:REDIS_URL='redis://localhost:6379'
$env:PORT='8080'; pnpm dev:api
$env:PORT='19796'; $env:BASE_PATH='/'; pnpm dev:web
pnpm seed:packages
pnpm seed:admin
# Admin: admin@jobera.az / Admin123! → /dashboard/admin
```

## Arxitektura arxivi

- [`.agents/memory/jobera-architecture.md`](../.agents/memory/jobera-architecture.md)
- [`.agents/memory/db-declarations.md`](../.agents/memory/db-declarations.md)

## AI sistem

- Agent qaydaları: [`AI_SYSTEM.md`](../AI_SYSTEM.md)
- Modul registry: [`modules/registry.md`](modules/registry.md)
