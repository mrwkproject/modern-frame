# Security model

PostgreSQL RLS is the authoritative access boundary. Helper functions check membership using `auth.uid()` without recursive membership policies. Authenticated users can see only their own profile and organizations/events for organizations they belong to. Administrative updates require owner/admin membership. Creating an organization automatically creates its owner membership.

The public Supabase anon key may be shipped to browsers because RLS constrains it. The service-role key is server-only and must never be referenced by a client module. Privileged code must re-check authorization server-side, validate inputs, and write an audit event once audit logging is introduced.

Media buckets must be private by default. Store randomized object paths, validate actual MIME signatures and size server-side, constrain allowed formats, and issue short-lived signed URLs. Guest access will use high-entropy, revocable tokens; event slugs alone are not authorization.

Before public capture launches, add per-IP/token rate limits, upload quotas, CSRF review for cookie-authenticated mutations, content-security headers, abuse reporting, and storage RLS. Render user text as text, never unsanitized HTML. Logs and user-facing errors must not expose secrets, tokens, storage paths, or raw database errors.
