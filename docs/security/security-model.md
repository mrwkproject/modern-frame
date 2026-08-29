# Security model

PostgreSQL RLS is the authoritative access boundary. Helper functions check membership using `auth.uid()` without recursive membership policies. Authenticated users can see only their own profile and organizations/events for organizations they belong to. Administrative updates require owner/admin membership. Creating an organization automatically creates its owner membership.

The public Supabase anon key may be shipped to browsers because RLS constrains it. The service-role key is server-only and must never be referenced by a client module. Privileged code must re-check authorization server-side, validate inputs, and write an audit event once audit logging is introduced.

Media buckets must be private by default. Store randomized object paths, validate actual MIME signatures and size server-side, constrain allowed formats, and issue short-lived signed URLs. Guest access will use high-entropy, revocable tokens; event slugs alone are not authorization.

Before public capture launches, add per-IP/token rate limits, upload quotas, CSRF review for cookie-authenticated mutations, content-security headers, abuse reporting, and storage RLS. Render user text as text, never unsanitized HTML. Logs and user-facing errors must not expose secrets, tokens, storage paths, or raw database errors.

## Authentication and onboarding verification

The Next.js proxy refreshes Supabase cookies but does not grant access. Protected layouts and every Server Action verify the user with Supabase Auth. Organization creation accepts only a name; the action derives `created_by` from the verified session and generates the slug. The existing organization insert policy requires `created_by = auth.uid()`, and the database trigger creates the owner membership in the same PostgreSQL transaction.

| Case                                                | Enforcement                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| User A reads Organization A                         | `organizations_select_members` calls `private.is_org_member` with User A's JWT identity.                    |
| User A reads Organization B                         | No matching membership exists, so RLS returns no row.                                                       |
| User B modifies Organization A                      | Update requires owner/admin membership in Organization A.                                                   |
| Anonymous reads private organizations               | Policies apply only to `authenticated`; anonymous reads return no rows.                                     |
| User assigns ownership in an unrelated organization | Membership inserts require `private.is_org_owner` for the target organization.                              |
| User forges onboarding organization/role IDs        | The form accepts no IDs or role. The server derives the user ID, and the trigger fixes the role to `owner`. |

These guarantees should also be exercised against a local Supabase instance before production deployment; unit tests cover application redirect and membership decision helpers without pretending to replace database-level RLS tests.

## Event authorization and public projection

Host event reads require organization membership through RLS. Inserts and updates require an owner/admin role, and Server Actions derive both `organization_id` and `created_by` from the verified session rather than accepting them from forms. Queries always include the current organization ID as defense in depth. Database triggers prevent ownership changes and invalid lifecycle transitions.

Public pages use the anon client only to call `get_public_event_by_slug`. That function exposes the event name, slug, description, type, schedule, timezone, and status—never organization membership, creator identity, private cover paths, or internal IDs. Archived and soft-deleted events return no result. Draft pages expose invitation details but no capture/gallery actions; those direct placeholder routes also require an active event.

Organization creator identity is protected by `organizations_prevent_creator_change`. Membership policies were reviewed for escalation: only an organization owner can insert, update, or delete membership rows; members and admins cannot promote themselves or modify another tenant's membership. The creator trigger prevents an otherwise authorized administrator from rewriting the organization ownership identity.

The pgTAP suite uses real authenticated and anonymous database roles to verify profile privacy, tenant reads, membership escalation denial, owner/admin event creation, cross-tenant event denial, organization creator immutability, anonymous table denial, and the safe public RPC. It runs against local Supabase only and never needs production credentials.

## Anonymous guest sessions

QR codes carry only the absolute event join URL—never IDs, credentials, storage paths, or guest secrets. The join route generates 256 bits with Web Crypto, hashes the secret with SHA-256, and sends only the hash to a narrow creation RPC. The raw secret exists only transiently on the server and in an HttpOnly, SameSite=Lax cookie scoped to `/e/[eventSlug]`; it never appears in URLs, browser storage, application logs, or PostgreSQL.

Direct `guest_sessions` access is revoked from anonymous and authenticated roles. Creation and validation functions enforce active event status, non-deletion, hash format, expiration, revocation, and exact event binding. No email, phone, IP, user-agent, location, advertising ID, or persistent device fingerprint is collected. Production launch still requires rate limiting at the join route/server boundary; the narrow RPC makes that control straightforward to add without broad table access.

## Local camera privacy

The server validates the active event and guest-session cookie before camera code renders. The raw guest token is read only by server code and is never passed into the camera Client Component. Camera access is explicit, video-only, and local. Frames are extracted with Canvas into in-memory JPEG Blobs; only an explicit Save to event action can send the final framed composition. EXIF, GPS, face data, camera identifiers, raw captures, and microphone input are never sent. Stream tracks, countdown timers, flash timers, and object URLs are released on replacement or teardown.

Frame composition receives only the local capture, a validated built-in template, and the event display name. Event names are rendered with Canvas text APIs and never interpreted as HTML, SVG, CSS, or script. Originals and previews remain local; only the final composition is eligible for an explicit save. The renderer performs no EXIF extraction, GPS access, face processing, network request, or microphone access. Replacement, change-frame, retake, or teardown revokes obsolete object URLs.

Three-shot mode preserves the same server authorization boundary and receives no guest secret, token hash, event ID, or organization ID. Its allowlisted mode query is presentation state only. All three raw JPEG captures remain inside the browser; only the completed strip can be explicitly saved. No microphone, EXIF, GPS, face analysis, or device fingerprint is introduced. Replaced shots are revoked immediately, retake-all revokes the full set, and visibility/navigation cleanup cancels timers and stops media tracks.

## Private event media

`event-media` is a private, JPEG-only bucket with an 8 MiB limit. The service-role key is parsed lazily only by `src/lib/supabase/admin.ts`, which imports `server-only`. Guests have no direct table privileges. Their HttpOnly event cookie is hashed server-side and bound by database functions to the exact event, session, media row, and generated path.

Gallery access and creator attribution are separate. A valid Event A requester may see every ready, visible, non-deleted Event A asset regardless of which Event A guest created it. The requester token cannot authorize Event B and cannot finalize media created by a different session.

Finalize verifies the exact stored path, MIME, nonzero byte size, configured limit, and expected byte size before changing `pending` to `ready`; invalid objects are removed and marked failed. Host reads and moderation remain under organization RLS. Guest gallery results expose a narrow projection and are rendered through 12-minute signed URLs. Intent quotas are 10 per session per minute and 250 non-failed assets per session; Prompt 08 must add an edge-aware limiter before public traffic.

Pending intents expire after 15 minutes. A future scheduled job should mark expired rows failed and remove orphaned objects; the indexed expiration field makes that bounded cleanup possible without adding a scheduler in this phase.

Join creation is limited to 20 new-session attempts per 10 minutes per event and opaque IP-derived key. Cloudflare's managed `CF-Connecting-IP` header is trusted only at the selected Workers boundary; arbitrary `X-Forwarded-For` is ignored. Development bypasses this limiter rather than inventing identity. HMAC-SHA-256 uses `ABUSE_RATE_LIMIT_SECRET`, and raw IPs are never persisted.

Baseline headers set `nosniff`, strict-origin referrer behavior, and `camera=(self), microphone=(), geolocation=()`. No CSP is added in this phase because an unverified policy could break Next.js, Supabase, Blob previews, or signed images. Guest joins, signed uploads, finalize responses, and both gallery surfaces are explicitly dynamic/no-store.
