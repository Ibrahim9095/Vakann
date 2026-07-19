# Jobera.az

A dual-panel job platform for the Azerbaijani market. HR users post jobs and search candidates; job seekers browse listings and apply.

## Stack
- **Frontend**: React + Vite — `artifacts/jobera` (preview path `/`)
- **Backend**: Express 5 API — `artifacts/api-server` (preview path `/api`)
- **Database**: PostgreSQL via Drizzle ORM — `lib/db`
- **API client**: Auto-generated React Query hooks — `lib/api-client-react` (Orval codegen from `lib/api-spec/openapi.yaml`)
- **Validation schemas**: Zod — `lib/api-zod`

## Running locally
All three workflows are managed by Replit:
- `artifacts/jobera: web` — Vite dev server for the frontend
- `artifacts/api-server: API Server` — Express API (builds then starts)
- `artifacts/mockup-sandbox: Component Preview Server` — UI component sandbox (start as needed)

## After schema changes
Rebuild the shared libraries from the repo root:
```sh
cd lib/db && npx tsc -p tsconfig.json
cd lib/api-zod && npx tsc -p tsconfig.json
cd lib/api-client-react && npx tsc -p tsconfig.json
```

## Environment secrets
- `SESSION_SECRET` — used for session signing (already configured)
- `DATABASE_URL` — PostgreSQL connection string (injected by Replit's PostgreSQL integration)

## Known limitations (to address)
- Auth sessions are stored in-memory — all users are logged out on API restart
- Passwords use SHA-256, not a proper KDF (bcrypt/Argon2)
- Profile edit flows may fail for users who already have a profile (see follow-up tasks)
