# ifXBuiltY Technical Plan

## Summary

Build a fast-launch web app with **Next.js App Router + TypeScript + Tailwind**, deployed on **Vercel**, using **Supabase** for Google auth, Postgres, storage, and public feed data. **`POST /api/generate`** uses the **Vercel AI SDK** **`generateImage`** against **Vercel AI Gateway** (default **`openai/gpt-image-2`**), enforces quota, and uploads to Supabase storage (`src/app/api/generate/route.ts`). A repo-root **`index.ts`** script uses the same pattern for local experimentation.

V1 loop: browse feed anonymously, sign in with Google to generate, add extra prompt details, publish, remix, upvote/downvote, report, and share a watermarked public page.

## Implementation status (living)

**Done**

- **Framework**: Next.js 16 App Router, TypeScript, Tailwind 4, Yarn 4 (`nodeLinker: node-modules`), Turbopack dev.
- **Supabase Auth (Google only)**: PKCE flow; `signInWithOAuth` from `/login`; Route Handler `GET /auth/callback` exchanges `code` for session cookies; `@supabase/ssr` browser + server clients; `src/proxy.ts` refreshes session via `getClaims()` (Next.js 16 proxy convention).
- **Dashboard config** (manual): Supabase **Site URL** + **Redirect URLs** include `{origin}/auth/callback` for local and production; Google Cloud OAuth **Web client** with authorized JS origins for those apps and redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
- **Database**: Versioned SQL under `supabase/migrations/` — tables `generations`, `votes`, `reports`, `generation_events` with RLS (public read for published+visible generations; owners CRUD own rows; votes/reports intended for server `service_role`); triggers maintain vote/remix/report counters; partial indexes for feed sorts. Apply remote via `yarn sb db push` (linked project; local Docker optional).
- **Storage**: Private bucket **`generation-images`** (PNG/JPEG/WebP/GIF, 50MB cap); `generations.image_path` matches `storage.objects.name`; SELECT policy allows anon/authenticated reads when linked row is published+visible or owned by user. Uploads from API routes use **`SUPABASE_SECRET_KEY`** / legacy **service_role** (server-only).
- **Env (see `.env.example`)**: `NEXT_PUBLIC_SUPABASE_URL`; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional `GENERATION_IMAGES_BUCKET=generation-images`; server-only secret key for privileged writes (not `NEXT_PUBLIC_*`).
- **`POST /api/generate`**: Implemented — builds prompt from builder fields, **`generateImage`** via AI Gateway, enforces daily quota, uploads to **`generation-images`**, inserts draft `generations` row (`src/app/api/generate/route.ts`).
- **`POST /api/generations/:id/publish`**: Owner-only; draft with **`image_path`** → **`published`** (`src/app/api/generations/[id]/publish/route.ts`).
- **`POST /api/generations/:id/vote`**: Anonymous OK; body **`value`** (or **`vote`**) **`1`** or **`-1`**; httpOnly **`ifx_anon_sid`** cookie (opaque UUID) for **`anon_session_id`**; **`service_role`** upsert into **`votes`** (`src/app/api/generations/[id]/vote/route.ts`).
- **`POST /api/generations/:id/report`**: Anonymous OK; **`reason`** required; same anon cookie; one report per session per generation (idempotent duplicate); **`REPORT_COUNT_HIDE_THRESHOLD`** in **`src/lib/constants.ts`** (default **5**) auto-sets **`moderation_status`** to **`hidden`** via service client (`src/app/api/generations/[id]/report/route.ts`).
- **`GET /api/feed`**: **`sort=newest|trending`**, **`limit`** (default **20**, max **50**); lists published+visible rows; signed image URLs via service client (`src/app/api/feed/route.ts`).
- **Shared API helpers**: **`src/lib/anon-session.ts`**, **`src/lib/parse-generation-id.ts`**.
- **AI Gateway (dev / scripting)**: `AI_GATEWAY_API_KEY` in **`.env.local`** (see `.env.example`) authenticates local runs against [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). On Vercel, prefer **`vercel env pull`** for **`VERCEL_OIDC_TOKEN`** when OIDC is enabled—no long-lived key in the deployment bundle when using OIDC-only auth.
- **Image generation spike (`index.ts`)**: Repo-root script using **`ai`** package **`generateImage`** with model **`openai/gpt-image-2`** (image models use the image API; language-only **`generateText`** is for models like **`google/gemini-3.1-flash-image-preview`** that return files via the language-model path). Run **`yarn ai:image`** or **`yarn ai:image "your prompt"`** (wraps **`tsx index.ts`**); writes **`generated-image.<ext>`** in the project root. Dependencies added for this path: **`ai`**, **`dotenv`**, **`tsx`** (`typescript` / **`@types/node`** were already present).
- **Tooling**: Global **Vercel CLI** (`npm i -g vercel`) and **Vercel plugin** for Cursor/Claude (`npx plugins add vercel/vercel-plugin`) support gateway docs/env workflows; optional for the script itself.

**Still scaffold / TODO**

- `/`, `/feed`, `/g/[slug]`, `/remix/[id]` are placeholders (no UI wired to these APIs yet).
- Watermarking, cryptographically signed anon cookies (currently opaque UUID in httpOnly cookie), per-IP rate limits for vote/report/generate, admin review for hidden content, and prompt safety checks before generation are not finished.

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
  - Implemented consumption: **`POST /api/generate`** return shape; feed item shape in **`GET /api/feed`**; publish/vote/report JSON as in **Public Interfaces** below.

- Image pipeline:
  - Server route builds a structured parody screenshot prompt from the user fields.
  - **Production:** **`generateImage`** via **Vercel AI Gateway** in **`POST /api/generate`** (same pattern as **`index.ts`** / **`yarn ai:image`**); **`AI_GATEWAY_API_KEY`** or **`VERCEL_OIDC_TOKEN`** stays **server-only**; the browser never calls the gateway directly.
  - Store files in Supabase bucket **`generation-images`**; persist path on `generations.image_path`.
  - Add a lightweight app watermark during post-processing before storing the share/public image.
  - If generation fails, show a retryable error and do not create a public feed item.

- Loading screen entertainment (generation takes 15–30s):
  - **Dynamic loading messages**: When `POST /api/generate` is called, the response also returns an array of 5–8 funny, prompt-specific loading messages generated alongside the image request (or pre-generated from company profile data). The client cycles through these every 3–4 seconds while polling/streaming for completion. Examples for "Indian Government x LinkedIn": "Consulting the design committee...", "Filing form 27B in triplicate...", "Adding mandatory Aadhaar verification step...", "Translating to 22 official languages...".
  - **"While you wait" fun facts**: Each builder in `src/data/company-profiles.json` includes a `funFacts` array of 3–5 short, humorous observations about the company/institution. One is randomly shown below the progress bar during generation. These are static per-builder and can be extended over time.
  - **Progress bar + time estimate**: A yellow progress bar with estimated time remaining gives users a sense of forward movement. The estimate is based on rolling average of recent generation times.
  - **Implementation**: Loading messages can be generated dynamically by a fast LLM call (e.g. `generateText` with a small model) fired in parallel with the image generation, or pre-computed per builder/target pair and cached. The client receives them in the initial generate response or via a streaming partial response before the image is ready.

- Moderation and abuse controls:
  - Run basic prompt safety checks before image generation.
  - Watermark every public image as fictional/parody.
  - Reports accumulate in **`report_count`**; at **`REPORT_COUNT_HIDE_THRESHOLD`** the API sets **`moderation_status`** to **`hidden`** (admin review path still later).
  - Rate limit generation per user and voting/reporting per anonymous session/IP.

## Public Interfaces

All listed **`src/app/api/`** routes below are **implemented** (no 501 stubs).

- `POST /api/generate`
  - Auth required.
  - Input: builder, target, tone, screen type, region, extra details, optional remix parent id.
  - Output: generation id, image URL, slug, prompt metadata.

- `POST /api/generations/:id/publish`
  - Auth required; owner only; draft with image required.
  - Marks the generation **`published`**.

- `POST /api/generations/:id/vote`
  - Anonymous allowed (logged-in users may also call; same anon cookie if present).
  - Input: JSON **`{ "value": 1 | -1 }`** (alias field **`vote`**).
  - HttpOnly **`ifx_anon_sid`** cookie stores **`anon_session_id`**; upsert enforces one vote per session per generation (change vote by posting again).

- `POST /api/generations/:id/report`
  - Anonymous allowed.
  - Input: **`{ "reason": string }`** (required; max length enforced server-side).
  - Second report from the same anon session returns success with **`duplicate: true`** (no extra row).
  - When **`report_count`** reaches **`REPORT_COUNT_HIDE_THRESHOLD`**, **`moderation_status`** becomes **`hidden`** (drops off public feed).

- `GET /api/feed`
  - Anonymous allowed.
  - Query: **`sort=newest|trending`**, **`limit`** (capped).
  - Response items include signed **`imageUrl`** when service credentials are configured.

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
- **GPT Image** (**`gpt-image-2`**) via **Vercel AI Gateway** is the default for **`POST /api/generate`** and the **`index.ts`** spike (override with **`AI_GATEWAY_IMAGE_MODEL`**). Per-user generation caps and accounting remain **application-layer** (DB + checks before calling any provider), not automatic per end-user in the gateway alone.

## Migrations

- **Commit every file** under `supabase/migrations/` to git. They are the canonical schema history; apply to remote with `yarn sb db push` after linking.
- Do not edit migrations already applied on production; add a **new** migration for changes.
- `supabase/.temp/` is gitignored (CLI link metadata); each developer runs `yarn sb link` locally.
