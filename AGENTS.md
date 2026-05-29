# Agent guidelines (ifXBuiltY)

## Next.js: read installed docs first

Before changing the App Router, **`src/proxy.ts`**, **`next.config`**, route handlers, or Turbopack-related behavior, locate and read the relevant file under:

```text
node_modules/next/dist/docs/
```

That tree matches the **installed** Next.js version. Prefer it over model training data.

**High-signal entry points:**

- **Proxy** (v16+: use `src/proxy.ts`, not `middleware.ts`):  
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- **App Router** topics: under `node_modules/next/dist/docs/01-app/`
- **`NextResponse`**:  
  `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/next-response.md`

## Repository map

| Area | Path |
|------|------|
| Pages & layouts | `src/app/` |
| Batch generate (4-up, auth) | `src/app/batch/`, `src/components/batch-generator.tsx` |
| Company profiles (prompts) | `src/data/company-profiles.json`, `src/lib/prompt/merge-company-pair.ts` |
| API routes | `src/app/api/` |
| Proxy (request boundary; Supabase session refresh) | `src/proxy.ts` |
| Supabase helpers | `src/lib/supabase/` |
| Environment template | `.env.example` |
| Supabase CLI / migrations | `supabase/` |

## Tooling

- **Yarn 4** — use `yarn` / `yarn dev` / `yarn build`. Lockfile is `yarn.lock`; `.yarnrc.yml` sets `nodeLinker: node-modules` for Next + Turbopack.
- Do not reintroduce `package-lock.json` or mix npm installs on the same lockfile.

## Supabase

For auth, cookies, and SSR clients, follow current Supabase docs and reconcile with the local Next **Proxy** docs above:  
[Supabase: Next.js server-side auth](https://supabase.com/docs/guides/auth/server-side/nextjs)

## Cursor Cloud specific instructions

- Standard setup and run commands are in `README.md`, `package.json`, and `supabase/config.toml`; keep the VM startup update script limited to dependency refresh.
- The local Supabase stack requires Docker. If a Cloud shell was opened before the `ubuntu` user joined the `docker` group, run Supabase commands through `sg docker -c 'yarn db:start'` (or open a fresh shell) so the CLI can access `/var/run/docker.sock`.
- Full image generation needs real `AI_GATEWAY_API_KEY`, Dodo API/entitlement/product configuration, and an authenticated user with credits; without those, local dev can still lint, test, build, load the app, and exercise unauthenticated UI/feed flows.

<!-- Legacy banner from create-next-app; keep for tooling that keys off these markers. -->
<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
