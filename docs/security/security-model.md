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
