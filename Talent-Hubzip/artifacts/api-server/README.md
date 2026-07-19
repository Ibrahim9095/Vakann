# API Server (`@workspace/api-server`)

Express 5 backend — blur, ödəniş, bildiriş, upload, admin.

## Sərhəd

- `@workspace/db` — yalnız bu paket və `scripts` DB-yə birbaşa qoşulur
- Biznes məntiqi route + `src/lib/` altında

## Əmrlər

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
pnpm --filter @workspace/api-server run typecheck
```

## Env

- `DATABASE_URL` — PostgreSQL (mütləq)
- `PORT` — default 5000, dev-də 8080

## Əsas modullar

| Path | Məsuliyyət |
|------|------------|
| `src/lib/blur.ts` | Per-HR blur, access grants |
| `src/lib/payments/` | Simulyasiya ödəniş |
| `src/lib/notifications/` | Bildiriş stub |
| `src/routes/` | REST endpoints |
