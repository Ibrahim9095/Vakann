# Jobera — Agent & Developer Guide

## Yaddaş sistemi

| Fayl | Məqsəd |
|------|--------|
| [`AI_SYSTEM.md`](AI_SYSTEM.md) | Agent qanunları |
| [`memory-bank/MASTER_STATE.md`](memory-bank/MASTER_STATE.md) | Layihə snapshot |
| [`memory-bank/PROGRESS.md`](memory-bank/PROGRESS.md) | Tamamlanan işlər |
| [`memory-bank/modules/registry.md`](memory-bank/modules/registry.md) | Paket xəritəsi |
| [`memory-bank/sessions/`](memory-bank/sessions/) | Sessiya logları |

Arxitektura arxivi: [`.agents/memory/`](.agents/memory/)

## Dev əmrləri

```bash
docker start jobera-postgres
docker start jobera-redis
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5433/jobera'
$env:REDIS_URL='redis://localhost:6379'
pnpm dev:api
pnpm dev:web
pnpm seed:packages
pnpm seed:admin
# Admin: admin@jobera.az / Admin123! → /dashboard/admin
pnpm test
```

## Real inteqrasiya env

```powershell
$env:PAYMENT_PROVIDER='goldenpay'   # və ya simulated (default)
$env:GOLDENPAY_MERCHANT_ID='...'
$env:GOLDENPAY_SECRET='...'
$env:GOLDENPAY_CALLBACK_URL='https://your-domain/api/payments/callback/goldenpay'
$env:SMS_GATEWAY_URL='https://sms-gateway.example/send'
$env:SMS_API_KEY='...'
$env:SMS_SENDER='Jobera'
$env:TELEGRAM_BOT_TOKEN='...'
$env:TELEGRAM_CHANNEL_ID='...'
```

## Modullar

- **Frontend:** `artifacts/jobera` — React, `/api` proxy
- **API:** `artifacts/api-server` — Express, blur, payments
- **DB:** `lib/db` — Drizzle schema

Cursor agent qaydası: [`.cursor/rules/ai-system.mdc`](.cursor/rules/ai-system.mdc)
