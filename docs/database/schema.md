# Database schema

The initial migration creates `profiles`, `organizations`, `organization_members`, and `events`. UUID primary keys prevent sequential identifier exposure. Organization membership is the tenant boundary. Public event slugs are globally unique so every `/e/[eventSlug]` URL is unambiguous.

The event-system migration adds descriptions, typed event categories, IANA timezones, an optional private cover-image path, and the `draft → active → ended → archived` lifecycle. Database triggers make organization/creator ownership immutable and reject backward or skipped status transitions. Host times are persisted as `timestamptz` instants plus their display timezone.

Anonymous event access is limited to the `get_public_event_by_slug` security-definer projection. It returns only guest-safe event fields and excludes deleted or archived events; anonymous clients cannot select the underlying `events` table.

Organization `created_by` and event `organization_id`/`created_by` are immutable after insertion. Dedicated `BEFORE UPDATE` triggers enforce those invariants below the application layer while leaving authorized names, settings, and soft-deletion fields editable.

Database behavior and RLS are exercised through transactional pgTAP tests in `supabase/tests/`. Run them only against the local stack with `pnpm db:test`.

## Guest sessions

`guest_sessions` belongs to an event and stores a unique SHA-256 token hash, minimal active/revoked status, creation/last-seen timestamps, expiration, and optional revocation time. Raw tokens are never persisted. Anonymous and authenticated roles have no direct table privileges; `create_guest_session` and `validate_guest_session` are narrow security-definer functions.

Creation requires a non-deleted active event and a lowercase 64-character SHA-256 hash. Expiration is calculated in the database: event end plus 24 hours, or creation plus seven days if no end is configured. Validation also requires the event to remain active, preventing a still-present cookie from authorizing future capture after an event ends.

Soft deletion exists on organizations and events because recovery/audit needs are plausible. Membership rows and profiles use hard deletion through explicit foreign-key behavior. Timestamps are maintained by triggers.

## Event media

`event_settings` is one-to-one with an event and controls guest saves and gallery availability. Existing events are backfilled and a trigger creates defaults for every new event. `media_assets` belongs explicitly to an event and optionally retains its guest session; session deletion uses `ON DELETE SET NULL` so media ownership remains stable.

Generated paths are constrained to `events/{event_id}/{media_id}.jpg`. States are `pending`, `ready`, `failed`, and `archived`; only ready, visible, non-deleted rows appear to guests. Pending intents expire after 15 minutes and have a cleanup index. `create_media_upload_intent`, `resolve_media_finalize`, and `list_guest_gallery` expose narrow guest operations. Gallery pagination is stable on `(created_at, id)` and capped at 50 rows.

## Planned, not yet created

Database-backed custom templates, media lineage, video, GIF, audio, and audit logs remain future work.

Operational modules such as devices, print jobs, billing, moderation, analytics, rendering, and AI jobs remain intentionally absent until their workflows exist.
