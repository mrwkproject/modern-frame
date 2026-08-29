# Cloudflare Workers deployment

Modern Frame uses Cloudflare's current recommended vinext path for an existing Next.js 16 application. The official compatibility scan reports 92% compatibility: all application imports and libraries are supported; App Router strict-mode wrapping is the only partial note. The existing Next.js commands remain available alongside vinext.

Official references:

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://github.com/cloudflare/vinext
- https://developers.cloudflare.com/workers/wrangler/configuration/

## Configuration

`vite.config.ts` combines vinext with the Cloudflare Vite plugin and Workers Cache CDN adapter. Private signed images remain unoptimized and no-store. `wrangler.jsonc` points at the generated vinext fetch handler and static client assets. Do not add private values to Wrangler's checked-in `vars`.

Commands:

```sh
pnpm build:vinext
pnpm preview
pnpm deploy
```

`pnpm deploy` requires these public build variables in the local deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — a public HTTPS origin, never localhost

Configure server secrets without committing them:

```sh
pnpm exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm exec wrangler secret put ABUSE_RATE_LIMIT_SECRET
```

The abuse secret must contain at least 32 random characters. Configure the three public variables in the Cloudflare dashboard or deployment environment as non-secret Workers variables. Run `pnpm release:env` before deployment; it rejects missing public variables and non-HTTPS/localhost site URLs.

## Post-deploy verification

1. Open `/api/health`; expect only `{ "status": "ok" }`.
2. Confirm response headers include `X-Content-Type-Options`, `Referrer-Policy`, and a permissions policy allowing same-origin camera only.
3. Verify login callback, QR links, and gallery share links use the production HTTPS origin.
4. On a real HTTPS device, allow camera access and confirm microphone/geolocation are not requested.
5. Execute the MVP release checklist and keep the physical-device matrix truthful.

Cloudflare supplies and normalizes `CF-Connecting-IP` at the Workers boundary. Modern Frame deliberately ignores `X-Forwarded-For`; deploying behind a different proxy requires a reviewed trusted-IP adapter before enabling public joins.
