# API Reference

All endpoints are Next.js App Router route handlers under `app/api/`. Admin routes
are guarded by `proxy.ts` (session) plus in-handler `verifyRole([...])`.

## Response conventions

Admin/internal routes use the `ApiResponse` helper (`lib/api-utils.ts`):

```jsonc
// success
{ "success": true, "data": <payload> }
// error
{ "success": false, "error": "<message>" }
```

Auth and some upload routes return plainer shapes (documented inline below).

## Auth

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` | Verifies bcrypt hash, sets `aj_session` cookie. Returns `{ user }` or `{ error }`. |
| POST | `/api/auth/logout` | — | Clears the session cookie. |
| GET | `/api/auth/me` | — | Returns `{ user, admin }` for the current session (or nulls). |

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/applications` | Submit a job application (creates `applications` + child rows). |
| POST | `/api/register` | Talent-pool / general registration. |
| GET | `/api/metadata` | Public lookup data (departments, categories) for forms. |
| POST | `/api/upload` | Upload an application document (`application-documents` bucket). |
| POST | `/api/upload/talent` | Upload a talent-pool CV, sets `talent_pool.cv_path`. |
| POST | `/api/email/acknowledge` | Send an application acknowledgement email (Resend). |

## Admin — recruitment

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET/PATCH/DELETE | `/api/admin/applications` | admin, hr_manager, recruiter | List (paginated, searchable), update status, soft/hard delete. |
| GET | `/api/admin/application/[id]` | admin, hr_manager, recruiter | Single application detail. |
| GET | `/api/admin/applications/events` | admin, hr_manager, recruiter | Pipeline event history. |
| GET | `/api/admin/applications/stats` | admin, hr_manager, recruiter | Pipeline counts. |
| GET/POST/PATCH/DELETE | `/api/admin/jobs` | admin, hr_manager | Manage job postings. |
| GET/DELETE | `/api/admin/talent` | admin, hr_manager, recruiter | Talent pool list + removal. |
| POST | `/api/admin/talent/assign` | admin, hr_manager | Assign a talent-pool candidate to a job/recruiter. |
| POST | `/api/admin/hire` | admin, hr_manager | Convert a hired application into an `auth_user` + `admin_user` + `staff_profile`, email credentials. |

## Admin — people, org & HR

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET/DELETE | `/api/admin/people` | admin, hr_manager | Staff directory (with `staff_profiles` embed); soft/hard delete (hard = super_admin only). |
| POST | `/api/admin/people/create` | admin, hr_manager | Create a staff member directly. |
| PATCH | `/api/admin/staff/profile` | any authenticated | Update the current user's staff profile. |
| GET/POST/PATCH | `/api/admin/organization` | admin, hr_manager | Org chart / structure data. |
| GET/POST/PATCH/DELETE | `/api/admin/departments` | admin, hr_manager | Departments CRUD. |
| GET | `/api/admin/departments/budget/history` | admin, hr_manager | Department budget change log. |
| POST | `/api/hr/transfer` | admin, hr_manager | Push a candidate to an external HR platform (`hr_transfers`). |

## Admin — documents, settings, analytics

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET/POST/DELETE | `/api/admin/documents` | admin, hr_manager | Staff document library (`staff-documents` bucket). |
| GET/POST/DELETE | `/api/admin/folders` | admin, hr_manager | Document folders. |
| GET | `/api/admin/download` | admin, hr_manager, recruiter | Stream a stored file as an attachment. |
| GET/PATCH | `/api/admin/settings` | admin | System settings key-values. |
| GET | `/api/admin/metadata` | admin+ | Admin lookup data (departments, types). |
| GET | `/api/admin/stats` · `/api/admin/analytics/snapshot` | admin+ | Dashboard metrics + snapshots. |
| GET | `/api/admin/audit` | admin | Audit / activity log. |

## Storage / files

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/storage/upload` | session | Generic authenticated upload used by the browser storage shim. Stores bytes in `storage_objects`. |
| GET | `/api/files?bucket=&path=` | session | Serves a stored file (`Content-Disposition: inline`). Replaces Supabase public/signed URLs. |

## Notes

- Pagination on list routes uses `page` + `limit` query params (limit capped, e.g. 25–100).
- Search on applications/talent uses `search` and is passed through `sanitizeSearch()`.
- Write routes that need the created/updated row call `.select().single()` on the
  query builder to get it back.
