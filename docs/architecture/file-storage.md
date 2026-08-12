# File Storage

The portal uses a custom file storage system backed by the `storage_objects`
table in Neon (BYTEA columns). This replaced Supabase Storage.

## Table schema

```sql
storage_objects
  bucket      text        -- logical bucket (e.g. 'application-documents')
  path        text        -- unique path within bucket
  content     bytea       -- file bytes
  content_type text       -- MIME type
  size        bigint      -- bytes
  created_at  timestamptz
```

Primary key: `(bucket, path)`

## API endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/storage/upload` | session | Generic authenticated upload. Stores bytes in `storage_objects`. |
| GET | `/api/files?bucket=&path=` | session | Serves a stored file with `Content-Disposition: inline`. |
| POST | `/api/upload` | session | Application document upload (legacy wrapper). |
| POST | `/api/upload/talent` | session | Talent CV upload; sets `talent_pool.cv_path`. |

## Serving files

`/api/files` checks the session before serving any file. Files are never exposed
via public URLs. The response includes:

- `Content-Type` from `content_type`
- `Content-Disposition: inline` (browser displays inline when possible)
- `Content-Length` from `size`

## Upload flow

1. Client sends `FormData` with `file` + metadata
2. Route validates size (max 5 MB) and MIME type
3. Bytes are stored in `storage_objects`
4. Metadata row is created in `application_documents` or `talent_pool`

## Client shims

`lib/storage-compat.ts` provides Supabase Storage API compatibility so existing
client code (`supabase.storage.from(...)`) continues to work:

- `getPublicUrl(bucket, path)` — returns internal `/api/files?...` URL
- `upload(bucket, path, bytes, contentType)` — delegates to `/api/storage/upload`

## Buckets

| Bucket | Purpose |
| --- | --- |
| `application-documents` | CVs, licence scans, passport scans |
| `staff-documents` | HR documents |
