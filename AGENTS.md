# Modern Frame engineering rules

- Preserve the ownership chain: user → organization → event. Never make events exclusively user-owned.
- Every tenant table must have explicit tenant ownership and tested RLS. UI checks are never authorization.
- All schema changes use ordered, reviewable migrations. Document policies and avoid dashboard-only schema.
- Keep the Supabase service-role key server-only. Never commit secrets; update `.env.example` with names only.
- Private media is the default. Validate MIME, size, authorization, and storage paths server-side; use signed URLs.
- Keep guest routes mobile-first, camera-first, fast, safe-area aware, and usable at 375/390/430px. Host routes must remain responsive through 1440px.
- Meet accessibility fundamentals in every change: semantic HTML, labels, keyboard use, visible focus, contrast, 44px touch targets, and reduced motion.
- Use the tokens and primitives in the existing design system. Check internal components before borrowing patterns from 21st.dev, and adapt any reference to this product.
- Use `.agents/skills/ui-ux-pro-max/` for interface work. It comes from `nextlevelbuilder/ui-ux-pro-max-skill`; its guidance remains subordinate to project requirements, security, accessibility, usability, performance, and this project's design system.
- Use Motion only for meaningful state feedback; never let animation block capture or ignore `prefers-reduced-motion`.
- Keep server/client boundaries explicit, validate untrusted inputs with Zod where useful, avoid `any`, and keep business logic out of route files.
- Add proportionate unit/component tests and critical-flow integration or e2e coverage. Run lint, typecheck, tests, and production build before handoff.
- Do not perform architectural rewrites or add infrastructure without explicit approval and a concrete need.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
