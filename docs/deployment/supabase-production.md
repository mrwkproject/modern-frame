# Production Supabase checklist

## Environment and Auth

Set the Supabase Auth Site URL to the exact production `NEXT_PUBLIC_SITE_URL`. Add the exact production callback URL (`https://your-domain.example/auth/callback`) to the allowed redirect URLs. Keep localhost entries only for development; never use localhost as the production Site URL.

Use the project anon key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Store the service-role key only as a Cloudflare secret. Never expose it through `NEXT_PUBLIC_`, source control, logs, or browser bundles.

## Migrations

Local destructive/reset commands are only for the local Supabase stack:

```sh
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
```

Never run `supabase db reset` against production. Link the reviewed production project and deploy ordered migrations:

```sh
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase migration list
pnpm exec supabase db push --dry-run
pnpm exec supabase db push
```

Review the dry run and back up production before applying migrations. Do not paste database passwords or tokens into repository files.

## Private storage verification

After migration, query the dashboard SQL editor with an administrator account:

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'event-media';
```

Expected: `public = false`, `file_size_limit = 8388608`, and only `image/jpeg`. Review `storage.objects` policies and confirm there is no broad anonymous select/insert/update/delete policy for this bucket. Guest upload and read access must continue through one-object upload tokens and short-lived signed URLs.

Also verify RLS is enabled on tenant tables, `event_settings` exposes only its two product-setting update columns, `media_assets` has no generic authenticated update grant, and all pgTAP tests are green before deployment.
