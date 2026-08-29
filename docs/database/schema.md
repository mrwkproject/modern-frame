# Database schema

The initial migration creates only `profiles`, `organizations`, `organization_members`, and `events`. UUID primary keys prevent sequential identifier exposure. Organization membership is the tenant boundary; event uniqueness is scoped to an organization.

Soft deletion exists on organizations and events because recovery/audit needs are plausible. Membership rows and profiles use hard deletion through explicit foreign-key behavior. Timestamps are maintained by triggers.

## Planned, not yet created

Event settings and the media/capture/gallery/template modules attach to `events.organization_id` (directly or through a constrained event foreign key). `media_assets` will store private object paths and metadata—not blobs—and model original/processed lineage plus photo, video, GIF, and audio states. `event_templates` will declare canvas dimensions; `template_elements` will hold typed, positioned elements and slot indices. Audit logs arrive with the first privileged admin operation.

Operational modules such as devices, print jobs, billing, moderation, analytics, rendering, and AI jobs remain intentionally absent until their workflows exist.
