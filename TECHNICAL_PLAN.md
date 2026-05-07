# ifXBuiltY Technical Plan

## Summary

Build a fast-launch web app with **Next.js App Router + TypeScript + Tailwind**, deployed on **Vercel**, using **Supabase** for Google auth, Postgres, storage, and public feed data. **`POST /api/generate`** uses the **OpenAI** client + Image API with quota and Supabase storage (see `src/app/api/generate/route.ts`). Separately, a repo-root **`index.ts`** script exercises **Vercel AI Gateway** with the AI SDK **`generateImage`** and **`openai/gpt-image-2`** for local experimentation—the same gateway-backed pattern can be adopted server-side later if you consolidate on AI Gateway.

V1 loop: browse feed anonymously, sign in with Google to generate, add extra prompt details, publish, remix, upvote/downvote, report, and share a watermarked public page.

## Implementation status (living)

**Done**

- **Framework**: Next.js 16 App Router, TypeScript, Tailwind 4, Yarn 4 (`nodeLinker: node-modules`), Turbopack dev.
- **Supabase Auth (Google only)**: PKCE flow; `signInWithOAuth` from `/login`; Route Handler `GET /auth/callback` exchanges `code` for session cookies; `@supabase/ssr` browser + server clients; `src/proxy.ts` refreshes session via `getClaims()` (Next.js 16 proxy convention).
- **Dashboard config** (manual): Supabase **Site URL** + **Redirect URLs** include `{origin}/auth/callback` for local and production; Google Cloud OAuth **Web client** with authorized JS origins for those apps and redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
- **Database**: Versioned SQL under `supabase/migrations/` — tables `generations`, `votes`, `reports`, `generation_events` with RLS (public read for published+visible generations; owners CRUD own rows; votes/reports intended for server `service_role`); triggers maintain vote/remix/report counters; partial indexes for feed sorts. Apply remote via `yarn sb db push` (linked project; local Docker optional).
- **Storage**: Private bucket **`generation-images`** (PNG/JPEG/WebP/GIF, 50MB cap); `generations.image_path` matches `storage.objects.name`; SELECT policy allows anon/authenticated reads when linked row is published+visible or owned by user. Uploads from API routes use **`SUPABASE_SECRET_KEY`** / legacy **service_role** (server-only).
- **Env (see `.env.example`)**: `NEXT_PUBLIC_SUPABASE_URL`; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional `GENERATION_IMAGES_BUCKET=generation-images`; server-only secret key for privileged writes (not `NEXT_PUBLIC_*`).
- **`POST /api/generate`**: Implemented — builds prompt from builder fields, calls OpenAI Images, enforces daily quota, uploads to **`generation-images`**, inserts `generations` row (`src/app/api/generate/route.ts`).
- **AI Gateway (dev / scripting)**: `AI_GATEWAY_API_KEY` in **`.env.local`** (see `.env.example`) authenticates local runs against [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). On Vercel, prefer **`vercel env pull`** for **`VERCEL_OIDC_TOKEN`** when OIDC is enabled—no long-lived key in the deployment bundle when using OIDC-only auth.
- **Image generation spike (`index.ts`)**: Repo-root script using **`ai`** package **`generateImage`** with model **`openai/gpt-image-2`** (image models use the image API; language-only **`generateText`** is for models like **`google/gemini-3.1-flash-image-preview`** that return files via the language-model path). Run **`yarn ai:image`** or **`yarn ai:image "your prompt"`** (wraps **`tsx index.ts`**); writes **`generated-image.<ext>`** in the project root. Dependencies added for this path: **`ai`**, **`dotenv`**, **`tsx`** (`typescript` / **`@types/node`** were already present).
- **Tooling**: Global **Vercel CLI** (`npm i -g vercel`) and **Vercel plugin** for Cursor/Claude (`npx plugins add vercel/vercel-plugin`) support gateway docs/env workflows; optional for the script itself.

**Still scaffold / TODO**

- `/`, `/feed`, `/g/[slug]`, `/remix/[id]` are placeholders (no generator UI wired to DB).
- Most handlers under `src/app/api/` **except `POST /api/generate`** still return **501 Not implemented** until built (publish, vote, report, feed).
- Watermarking, anonymous session cookies for vote/report, moderation thresholds, and converging **`/api/generate`** with **AI Gateway** if desired are not finished.

## Key Implementation Changes

- App structure:
  - `/` generator home with builder, target, tone, screen type, region, and extra details.
  - `/login` Google sign-in entry (implemented).
  - `/g/[slug]` public generation page with image, prompt details, vote score, remix CTA, report button, and share metadata.
  - `/feed` public feed with newest/trending sort.
  - `/remix/[id]` preloads an existing generation into the generator form.

- Auth and access:
  - Supabase Auth with **Google OAuth only** (configured in dashboard + PKCE callback route).
  - Anonymous users can browse, remix into a prefilled form, vote, and report.
  - Users must sign in before calling generation or publishing generated output.
  - Generation quotas are enforced per authenticated Supabase user.

- Data model:
  - Implemented in Postgres (see migrations): `generations` (includes `image_path`, `visibility` draft/published, `moderation_status`, denormalized vote/remix/report counts, generated `net_score`, `remix_parent_id`); `votes` (`vote_value` ±1, unique per `anon_session_id`); `reports`; `generation_events` (`payload` jsonb).
  - Planned consumption: same shapes as below for API contracts.

- Image pipeline:
  - Server route builds a structured parody screenshot prompt from the user fields.
  - **Production:** OpenAI Image API in **`POST /api/generate`** (current code path).
  - **Gateway spike:** **`generateImage`** via **Vercel AI Gateway** with **`openai/gpt-image-2`**—the **`index.ts`** script is the reference for SDK + env wiring; production could switch to the same pattern so **`AI_GATEWAY_API_KEY`** / OIDC stays **server-only** and the browser never calls the gateway directly.
  - Store files in Supabase bucket **`generation-images`**; persist path on `generations.image_path`.
  - Add a lightweight app watermark during post-processing before storing the share/public image.
  - If generation fails, show a retryable error and do not create a public feed item.

- Moderation and abuse controls:
  - Run basic prompt safety checks before image generation.
  - Watermark every public image as fictional/parody.
  - Reports immediately hide a post after a small threshold, with an admin-only review path later.
  - Rate limit generation per user and voting/reporting per anonymous session/IP.

## Public Interfaces

Route files exist under `src/app/api/`; **`POST /api/generate`** is implemented; other handlers are **stubs (501)** until implemented.

- `POST /api/generate`
  - Auth required.
  - Input: builder, target, tone, screen type, region, extra details, optional remix parent id.
  - Output: generation id, image URL, slug, prompt metadata.

- `POST /api/generations/:id/publish`
  - Auth required.
  - Marks a completed generation public.

- `POST /api/generations/:id/vote`
  - Anonymous allowed.
  - Input: vote value `1` or `-1`.
  - Uses a signed anonymous session cookie to prevent repeated votes.

- `POST /api/generations/:id/report`
  - Anonymous allowed.
  - Input: reason.

- `GET /api/feed`
  - Anonymous allowed.
  - Supports `sort=newest|trending`.

## Test Plan

- Unit test prompt construction from builder, target, tone, screen type, region, and extra details.
- Unit test quota checks, anonymous vote deduping, vote count updates, and report threshold hiding.
- Integration test generation route with AI SDK / gateway behavior mocked and Supabase storage mocked.
- Integration test remix flow preloads all original prompt fields and preserves parent id.
- E2E smoke test: sign in mock, generate, publish, view public page, vote, remix, report.
- Manual QA on desktop and mobile for generator form, feed cards, public page, loading state, and failed generation state.

## Assumptions

- Deployment target is Vercel.
- Database, auth, and image storage are all Supabase (hosted project; **Supabase CLI** in repo for `yarn sb link` / `yarn sb db push`; Docker not required).
- Google OAuth is the only v1 sign-in method.
- Browsing, voting, and reporting are anonymous; generation requires login.
- V1 uses synchronous generation rather than a background queue.
- Trending is computed from net votes plus remix count, with recency weighting.
- **GPT Image** (**`gpt-image-2`**) via **Vercel AI Gateway** is the reference for the **`index.ts`** spike and a candidate default when routing all generation through the gateway; **`POST /api/generate`** currently uses the OpenAI SDK directly. Per-user generation caps and accounting remain **application-layer** (DB + checks before calling any provider), not automatic per end-user in the gateway alone.

## Migrations

- **Commit every file** under `supabase/migrations/` to git. They are the canonical schema history; apply to remote with `yarn sb db push` after linking.
- Do not edit migrations already applied on production; add a **new** migration for changes.
- `supabase/.temp/` is gitignored (CLI link metadata); each developer runs `yarn sb link` locally.
