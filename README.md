# Modern Frame

Modern Frame is a web-based event capture and photobooth platform designed to evolve from a QR guest camera into a broader Event Capture & Photobooth OS.

## Current status

Complete:

- Platform foundation
- Authentication and organization onboarding
- Event creation, settings, lifecycle, and tenant ownership
- Public event pages with a safe public data projection
- Foundation hardening, CI, and database-level RLS tests
- Event QR access and anonymous, event-scoped guest sessions
- Secure guest camera with local JPEG capture and preview
- Data-driven single-photo frames with local composition and download

Next: three-shot photobooth and multi-slot composition, followed by gallery workflows. Upload and media storage are not implemented yet.

## Stack

- Next.js 16 and React 19
- TypeScript 5 in strict mode
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, and RLS
- Motion 13 for future meaningful interaction feedback
- Vitest 3 and pgTAP
- pnpm 11

## Local development

Requirements:

- Node.js 24 (CI baseline; a compatible supported Node release also works)
- pnpm 11.19.0 through Corepack or a local installation
- Docker-compatible container runtime for local Supabase

Install dependencies and prepare local environment variables:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app is available at `http://localhost:3000`. Populate `.env.local` with your local or development Supabase public coordinates. Never commit it.

## Environment variables

Use [`.env.example`](./.env.example) as the source of required names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (reserved for future privileged server-only workflows)

The anon key is intentionally public and constrained by RLS. A service-role key must never be prefixed with `NEXT_PUBLIC_`, imported by client code, or committed.

## Supabase local development

The Supabase CLI is installed as a development dependency. Start the local stack, recreate the database from ordered migrations, and run real pgTAP policy tests:

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
```

`db:reset` destroys and recreates only the local Supabase database. Do not run destructive database commands against a linked production project. Tests live under `supabase/tests/` and execute inside transactions.

## Application validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions repeats those checks on pushes to `main` and pull requests. A separate local-Supabase job applies migrations and runs the database/RLS suite without production credentials.

## Project structure

- `src/app` — Next.js App Router routes and layouts
- `src/components` — reusable UI components
- `src/features` — domain logic, validation, queries, and Server Actions
- `src/lib` — environment, Supabase clients, and shared utilities
- `supabase/migrations` — ordered, reviewable database changes
- `supabase/tests` — pgTAP database and RLS tests
- `tests` — Vitest unit tests
- `docs` — architecture, database, security, product, and design guidance
- `.agents/skills` — repository-scoped Codex skills and attribution

## Security

The tenant ownership chain is `user → organization membership → organization → event`. PostgreSQL RLS is authoritative; UI guards are defense in depth only. Organization creator identity and event ownership are immutable after creation. Public event pages call a narrow security-definer projection and cannot select private event rows or expose organization IDs, creator IDs, member data, or private media paths.

Event QR codes contain only `/e/[eventSlug]/join`. Joining an active event creates a 256-bit random guest secret, stores only its SHA-256 hash in PostgreSQL, and places the raw value in an event-path-scoped HttpOnly cookie. Sessions expire 24 hours after a configured event end or seven days after creation when no end exists. Guest sessions collect no email, phone, IP, user-agent, location, advertising ID, or device fingerprint. Rate limiting at the join route/event boundary is required before public production launch.

The guest camera runs only after server-side event/session validation. Permission begins from an explicit guest action, requests video with `audio: false`, and releases tracks on navigation or unmount. Captured JPEGs remain in browser memory and are not uploaded or stored by Modern Frame. Phone testing requires HTTPS; localhost is accepted for development.

Guests can render a captured photo through Clean Ivory, Midnight Celebration, or Warm Editorial. All templates use the same validated data model and generic Canvas renderer at an explicit 1080×1440 output size. A selected frame first renders as a lower-cost preview using identical coordinates, then exports locally as JPEG quality 0.92. Original and framed object URLs are revoked when replaced, retaken, or left.

Secrets belong in ignored environment files. Private media, signed URLs, guest-token controls, upload validation, and rate limiting remain requirements for later phases.

## UI/UX

The Modern Frame design system is the primary visual authority. Repository-scoped UI UX Pro Max guidance is installed at `.agents/skills/ui-ux-pro-max/` from the attributed upstream source. Agents must apply it after product requirements, security, accessibility, usability, performance, and existing tokens/components.

Check internal primitives before adapting a 21st.dev reference; copied patterns must be restyled, made accessible, and kept consistent with this product. Motion is installed but reserved for meaningful state feedback such as countdown, shutter, progress, and layout-state transitions. Every animation must respect reduced motion and must never delay capture or block interaction.

## Deployment

No production deployment is claimed yet. The current application is prepared for a future Next.js-compatible host plus a separately managed Supabase project. Deployment must apply reviewed migrations, configure environment variables in the hosting provider, preserve server/client secret boundaries, and pass CI before release.
