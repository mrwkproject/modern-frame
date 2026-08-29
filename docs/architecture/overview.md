# Architecture overview

Modern Frame is a Next.js App Router application with two deliberately distinct surfaces: a low-JavaScript, camera-first guest experience under `/e/[eventSlug]`, and a structured host workspace under `/dashboard`. Shared visual primitives remain small; domain logic belongs in `src/features/<domain>` as features are introduced.

Supabase provides PostgreSQL, authentication, and private object storage. Server and browser clients have separate entry points. Database migrations are the schema source of truth, and PostgreSQL RLS is the final tenant-authorization boundary.

CI validates formatting, lint, TypeScript, unit tests, and production builds. A separate local-Supabase job applies every migration and executes pgTAP policy tests. These database tests complement application tests instead of replacing them.

## Domain boundaries

`User → Organization → Event → Guest/capture/media` is the ownership chain. Events never belong directly to a user. Future capture, gallery, template, and media modules must carry an explicit event and derivable organization boundary.

Anonymous guest identity begins at `/e/[eventSlug]/join`. QR codes contain that public URL only. The route creates or restores an event-scoped guest session through narrow database functions, then redirects to the public event or capture placeholder. Guests are never Supabase Auth users or organization members.

The capture route remains a Server Component authorization boundary and renders a focused camera Client Component only after validating the active event and event-bound guest session. `getUserMedia`, Canvas extraction, frame composition, and object URLs remain browser-local. The camera leaf bundle does not import host, QR, or storage code.

`src/features/frames` defines a validated, data-driven template contract, built-in system catalog, pure layout helpers, and one generic renderer. Templates declare explicit canvas dimensions, photo slots, ordered text, shapes, and borders. The renderer scales the same coordinates for a lightweight preview and a full 1080×1440 JPEG, so adding database-backed templates or other output ratios later does not require a renderer rewrite. No template or media database tables are introduced in this phase.

The secure capture route now resolves an allowlisted presentation mode only after the active-event and HttpOnly guest-session checks. Its hub selects Single Photo or 3-Shot Photobooth without moving authorization client-side. Shared browser camera primitives cover stream acquisition, attachment, device counting, 3:4 extraction, and cleanup; each mode keeps its own explicit product state model.

Private media uses an explicit intent → signed one-object upload → server verification flow. The admin client is server-only; browser code receives only the generated upload capability. Only completed framed JPEGs can be saved, and failed event saves never block local download. Guest and host galleries receive short-lived signed read URLs rather than public object URLs.

Gallery authorization validates the requesting guest session against the event first, then independently selects every ready, visible event asset. Creator session attribution never limits same-event gallery visibility. Host moderation uses narrow database functions rather than generic table updates, and finalize is idempotent for the original event/session/media tuple.

Anonymous join creation uses a provider-neutral PostgreSQL fixed-window counter. On Cloudflare, the server HMACs the trusted `CF-Connecting-IP` value with an event/scope and a server secret; PostgreSQL stores only the opaque digest. Existing valid sessions bypass new-session quota consumption.

Frame photo slots carry a validated non-negative `slotIndex`. The renderer accepts an ordered capture array, rejects any missing required capture, and caches decoded sources within each render operation. Single frames resolve index 0; booth layouts resolve indices 0, 1, and 2 through the same engine. The booth holds one stream across its automatic sequence, stops after shot three, and composes only the selected layout at full resolution.

## Deployment

Cloudflare Workers is configured through vinext, Cloudflare's current recommended Next.js 16 path. The normal Next.js toolchain remains available in parallel. Private/session routes explicitly opt out of caching, while the Workers CDN adapter is available only for content that is safe to cache. Media processing remains client-side; asynchronous video/AI jobs remain future modules.

## Future attachment points

- Authentication and organization onboarding: `src/features/auth`, `src/features/organizations`
- Events and settings: `src/features/events`
- Capture and camera adapters: `src/features/captures`
- Declarative template renderer: `src/features/frames`
- Media/storage and galleries: `src/features/media`
- Privileged operations: server actions or route handlers with explicit authorization and audit writes

## Authentication boundary

`src/proxy.ts` refreshes Supabase session cookies for auth and host routes. It is not an authorization boundary. Server Components protect host routes, Server Actions re-verify the authenticated user, and PostgreSQL RLS remains authoritative for tenant data. Auth and organization behavior live in their respective `src/features` domains.

## Developer guidance

Repository-scoped agent guidance lives in `AGENTS.md`. UI UX Pro Max is installed under `.agents/skills/ui-ux-pro-max/` with upstream attribution. It is an advisory search tool and cannot override security, accessibility, performance, product requirements, or the Modern Frame design system.
