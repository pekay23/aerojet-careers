# Database Schema

PostgreSQL on **Neon**. The full, idempotent schema lives in
[`db/neon-schema.sql`](../../db/neon-schema.sql) (ported from the original
`supabase/migrations/001..007`). There is no Prisma/ORM — data access goes through
the query builder in [`lib/db.ts`](../../lib/db.ts).

## Auth & staff

- **auth_users** — replaces Supabase `auth.users`. Holds `email`, bcrypt `password_hash`,
  `user_metadata` (JSONB), `email_confirmed`, `last_login`.
- **admin_users** — portal identity linked to `auth_users` via `auth_user_id`. Carries
  `role` (`admin_role` enum), `full_name`, `is_active`. This is the table `verifyRole`
  reads for authorization.
- **staff_profiles** — HR profile for hired staff (`first_name`, `last_name`, `job_title`,
  `department`, `employee_id`, `employment_status`, `avatar_url`, etc.); linked to both
  `auth_user_id` and `admin_user_id`.

## Recruitment

- **jobs** — job postings (`title`, `slug`, `department`, `category`, `employment_type`,
  `status`, `requirements`, `tags`, `closes_at`, salary range).
- **applications** — candidate applications (personal info, `status`, `priority`,
  `assigned_to`, `recruiter_notes`, soft-delete via `deleted_at`, HR-transfer flags,
  lifecycle timestamps).
- **application_qualifications** — licences, type ratings, certifications (1:1 with application).
- **application_experience** — employment history + motivation (1:1 with application).
- **application_compensation** — current/expected pay, benefits, availability (1:1 with application).
- **application_documents** — uploaded file metadata (`file_path`, `storage_bucket`,
  `document_type` enum); bytes live in `storage_objects`.
- **pipeline_events** — status-change audit trail per application (`from_status`,
  `to_status`, `note`, `admin_user_id`).
- **talent_pool** — general-interest candidates not tied to a specific job.
- **hr_transfers** — records of pushing a hired candidate into an external HR platform
  (`hr_platform` enum, `payload`, `status`, `external_id`).

## System & config

- **system_settings** — key-value admin-editable configuration (company name, portal status, branding).
- **branding_config** — brand strings (org name, careers URL, logo paths); pre-seeded.
- **departments** / **department_budget_history** — org departments and budget change log.
- **employment_types**, **job_categories** — lookup/metadata tables.
- **document_folders** / **staff_documents** — internal HR document library.
- **email_logs** — every transactional email send (status, provider id, errors).
- **dashboard_snapshots** — cached analytics snapshots.
- **storage_objects** — file bytes (BYTEA) keyed by `(bucket, path)` with `content_type`
  and `size`. Replaces Supabase Storage buckets; served through `/api/files`.

## Enums

| Enum | Values |
| --- | --- |
| `application_status` | new, under_review, shortlisted, interview, offer, hired, rejected, transferred_to_hr, withdrawn |
| `job_status` | draft, open, paused, closed, filled |
| `job_category` | experienced_professional, graduate_program, skilled_training, general_application |
| `employment_type` | full_time, part_time, contract, trainee, internship |
| `admin_role` | super_admin, admin, hr_manager, recruiter, read_only, employee |
| `hr_platform` | bamboohr, workday, sap, zoho, csv, custom |
| `doc_type` | cv, licence_scan, passport_scan, other |

## Relationships & embeds

The query builder resolves supabase-style nested selects (e.g.
`applications.select('*, experience:application_experience(*)')`) into correlated
JSON subqueries. Known relationships are declared in `resolveRelationship()` in
`lib/db.ts`:

- `applications` → `application_qualifications` / `application_experience` / `application_compensation` (read as single objects)
- `application_documents` → `applications` (parent lookup)
- `admin_users` → `staff_profiles` (1:1)

New embeds either follow the generic `<base_singular>_id` convention or need a rule
added to `resolveRelationship()`.

## No Row Level Security

Unlike the Supabase original, there are no RLS policies. All access control is
enforced in the app layer — see the [security model](./security-model.md).
