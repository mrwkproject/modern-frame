# Database schema

The initial migration creates `profiles`, `organizations`, `organization_members`, and `events`. UUID primary keys prevent sequential identifier exposure. Organization membership is the tenant boundary. Public event slugs are globally unique so every `/e/[eventSlug]` URL is unambiguous.

The event-system migration adds descriptions, typed event categories, IANA timezones, an optional private cover-image path, and the `draft → active → ended → archived` lifecycle. Database triggers make organization/creator ownership immutable and reject backward or skipped status transitions. Host times are persisted as `timestamptz` instants plus their display timezone.

Anonymous event access is limited to the `get_public_event_by_slug` security-definer projection. It returns only guest-safe event fields and excludes deleted or archived events; anonymous clients cannot select the underlying `events` table.

Soft deletion exists on organizations and events because recovery/audit needs are plausible. Membership rows and profiles use hard deletion through explicit foreign-key behavior. Timestamps are maintained by triggers.

## Planned, not yet created

The media/capture/gallery/template modules attach to `events.organization_id` (directly or through a constrained event foreign key). `media_assets` will store private object paths and metadata—not blobs—and model original/processed lineage plus photo, video, GIF, and audio states. `event_templates` will declare canvas dimensions; `template_elements` will hold typed, positioned elements and slot indices. Audit logs arrive with the first privileged admin operation.

Operational modules such as devices, print jobs, billing, moderation, analytics, rendering, and AI jobs remain intentionally absent until their workflows exist.
