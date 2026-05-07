# ifXBuiltY Technical Plan

## Summary

Build a fast-launch web app with **Next.js App Router + TypeScript + Tailwind**, deployed on **Vercel**, using **Supabase** for Google auth, Postgres, storage, and public feed data. Image generation uses OpenAI's **Image API** with **GPT Image**, defaulting to the current high-quality model path documented by OpenAI for single-prompt image generation.

V1 loop: browse feed anonymously, sign in with Google to generate, add extra prompt details, publish, remix, upvote/downvote, report, and share a watermarked public page.

## Key Implementation Changes

- App structure:
  - `/` generator home with builder, target, tone, screen type, region, and extra details.
  - `/g/[slug]` public generation page with image, prompt details, vote score, remix CTA, report button, and share metadata.
  - `/feed` public feed with newest/trending sort.
  - `/remix/[id]` preloads an existing generation into the generator form.

- Auth and access:
  - Use Supabase Auth with **Google OAuth only**.
  - Anonymous users can browse, remix into a prefilled form, vote, and report.
  - Users must sign in before calling generation or publishing generated output.
  - Generation quotas are enforced per authenticated Supabase user.

- Data model:
  - `generations`: prompt fields, generated prompt, image path, creator user id, slug, visibility, vote counts, remix parent id, remix count, moderation status, timestamps.
  - `votes`: generation id, anonymous session id, vote value `1` or `-1`, timestamps; one vote per session per generation.
  - `reports`: generation id, anonymous session id, reason, timestamps.
  - `generation_events`: user id, event type, created timestamp for quota/rate limit auditing.

- Image pipeline:
  - Server route builds a structured parody screenshot prompt from the user fields.
  - Use OpenAI Image API synchronously with a loading state.
  - Default to high-quality GPT Image output; store the returned image in Supabase Storage.
  - Add a lightweight app watermark during post-processing before storing the share/public image.
  - If generation fails, show a retryable error and do not create a public feed item.

- Moderation and abuse controls:
  - Run basic prompt safety checks before image generation.
  - Watermark every public image as fictional/parody.
  - Reports immediately hide a post after a small threshold, with an admin-only review path later.
  - Rate limit generation per user and voting/reporting per anonymous session/IP.

## Public Interfaces

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
- Integration test generation route with OpenAI mocked and Supabase storage mocked.
- Integration test remix flow preloads all original prompt fields and preserves parent id.
- E2E smoke test: sign in mock, generate, publish, view public page, vote, remix, report.
- Manual QA on desktop and mobile for generator form, feed cards, public page, loading state, and failed generation state.

## Assumptions

- Deployment target is Vercel.
- Database, auth, and image storage are all Supabase.
- Google OAuth is the only v1 sign-in method.
- Browsing, voting, and reporting are anonymous; generation requires login.
- V1 uses synchronous generation rather than a background queue.
- Trending is computed from net votes plus remix count, with recency weighting.
- OpenAI Image API is preferred for v1 because OpenAI documents it as the right fit for single-prompt image generation; GPT Image is the default high-quality family.
