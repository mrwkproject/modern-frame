# Architecture overview

Modern Frame is a Next.js App Router application with two deliberately distinct surfaces: a low-JavaScript, camera-first guest experience under `/e/[eventSlug]`, and a structured host workspace under `/dashboard`. Shared visual primitives remain small; domain logic belongs in `src/features/<domain>` as features are introduced.

Supabase provides PostgreSQL, authentication, and private object storage. Server and browser clients have separate entry points. Database migrations are the schema source of truth, and PostgreSQL RLS is the final tenant-authorization boundary.

## Domain boundaries

`User → Organization → Event → Guest/capture/media` is the ownership chain. Events never belong directly to a user. Future capture, gallery, template, and media modules must carry an explicit event and derivable organization boundary.

## Deployment

Keep request handlers Web-standard and isolate provider APIs. Avoid long-running servers and native Node dependencies so a Cloudflare-compatible adapter can be selected when deployment is configured. Media processing should start client-side; asynchronous video/AI jobs remain future modules.

## Future attachment points

- Authentication and organization onboarding: `src/features/auth`, `src/features/organizations`
- Events and settings: `src/features/events`
- Capture and camera adapters: `src/features/captures`
- Declarative template renderer: `src/features/templates`
- Media/storage and galleries: `src/features/media`, `src/features/gallery`
- Privileged operations: server actions or route handlers with explicit authorization and audit writes
