---
name: Jobera.az architecture
description: Key architecture and integration decisions for the Jobera job platform
---

## Stack
- Frontend: React + Vite at `artifacts/jobera` (preview path `/`)
- Backend: Express 5 at `artifacts/api-server` (preview path `/api-server`)
- DB: PostgreSQL via Drizzle ORM at `lib/db`
- API client: auto-generated hooks at `lib/api-client-react` (Orval codegen from OpenAPI spec)

## Hook usage patterns (non-obvious)
- Params go as first arg, options as second: `useListJobs(params, { query: { queryKey: getListJobsQueryKey(params) } })`
- `useGetMe`, `useGetJob(id, options)` accept options directly (no params first arg)
- Hooks returning paginated list (`listJobs`, `listCandidates`) return `{ data: T[], total, page, limit }` — use `data?.data`
- Hooks returning flat arrays (`listApplications`, `listContactRequests`, `listPackages`) return `T[]` directly — do NOT use `.data`

## Auth
- Session store: in-memory Map with SHA-256 password hash (not production-grade)
- Token stored in localStorage as `jobera_token`, sent as `Authorization: Bearer <token>`
- `setAuthTokenGetter` must be called once in app init (done in auth-context)
- `getGetMeQueryKey()` must be included in useGetMe options (queryKey required)
- `requireAuth` checks `isBanned` — banned users get 403 on all authenticated requests
- Login also checks `isBanned` before creating session

## Blur mechanic
- `isContactBlurred: true` on candidate means contact info is private
- Server does NOT flip this flag globally on contact-request acceptance anymore (per-HR access model)
- CSS blur applied on candidate name/contact in frontend for blurred profiles
- VIP tier candidates (`subscriptionTier: 'vip'`) are always unblurred

## Access control (fixed)
- `POST /jobs`, `POST /companies` — HR only
- `POST /applications` — candidate only (HR forbidden)
- `POST /contact-requests` — HR only
- `POST /ratings` — HR only
- `PATCH /applications/:id` — HR who owns the job's company only
- `PATCH /contact-requests/:id` — candidate who received the request only
- `DELETE /jobs/:id` — owner company's HR or admin only
- All `/admin/*` routes — admin role only

## Admin Panel (added)
- Frontend pages at `artifacts/jobera/src/pages/dashboard/admin/`
- Admin API routes at `artifacts/api-server/src/routes/admin.ts`
- Admin utility (plain fetch, no Orval) at `artifacts/jobera/src/lib/adminApi.ts`
- Admin can: suspend jobs/candidates with note, delete jobs/users, ban users, verify companies, change roles
- Suspension note visible to HR on their JobsList page (shows inline below row)
- Admin suspension fields: `isSuspendedByAdmin`, `adminNote` on jobs and candidates tables
- `isBanned` on users table — banned users blocked at login AND on every API request

## Dashboard routing / role gating
- `DashboardLayout` accepts `requiredRole?: string` prop
- Unauthenticated → redirect to `/auth/login`
- Wrong role → redirect to correct dashboard
- Admin → `/dashboard/admin`, HR → `/dashboard/hr`, Candidate → `/dashboard/candidate`

## Profile editor fix (ProfileEditor.tsx + CompanyProfile.tsx)
- Both now load existing data via `GET /candidates/me` and `GET /companies/me` on mount
- Use PATCH (useUpdateCandidate/useUpdateCompany) when existingId is set, POST otherwise
- Admin note shown as destructive Alert when profile is suspended by admin

## Public listing filters
- `/candidates` filters out `isSuspendedByAdmin = true`
- `/jobs` filters out `isSuspendedByAdmin = true`
- HR's own job list (Orval hook) shows all including suspended, with inline admin note
