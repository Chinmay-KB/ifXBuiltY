# ifXBuiltY

A playful image generator for the internet's favorite design thought experiment:

> What if **X** built **Y**?

Example: "What if the Indian Government built LinkedIn?" becomes a fake product screenshot with official-looking language, visual tropes, interface patterns, and tiny jokes that feel instantly shareable.

## Product Idea

ifXBuiltY is a fast parody screenshot generator where people combine:

- A **builder**: the company, institution, celebrity, fandom, government, startup, or community whose design DNA is being borrowed.
- A **target product**: the website, app, or category being reimagined.
- A **tone**: believable, cursed, premium, chaotic, bureaucratic, luxury, scammy, wholesome, hyperlocal, etc.
- A **format**: landing page, login page, dashboard, mobile app screen, pricing page, onboarding, error page, notification, app store listing, or ad.

The output should feel like a real screenshot from an alternate timeline. The first version should be lightweight: generate, remix, vote, share.

## Planning Docs

- [Technical Plan](./TECHNICAL_PLAN.md)
- [Design Plan](./DESIGN_PLAN.md)
- [Agent guidelines](./AGENTS.md) (Next.js local docs rule, repo layout, Yarn/Supabase notes)

## Local development

1. Copy [`.env.example`](./.env.example) to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) from the [Supabase dashboard](https://supabase.com/dashboard).
2. Run `yarn dev` and open [http://localhost:3000](http://localhost:3000).

Dependencies are managed with **Yarn** (`yarn.lock`). Use `yarn` / `yarn dev` / `yarn build` instead of npm.

Supabase migrations and local stack live under `supabase/` (`yarn dlx supabase start` or `npx supabase start` when you are ready for local DB).

## Working Name

**ifXBuiltY** is clear, meme-native, and flexible. It sounds like a prompt format, which is good for virality.

Other name ideas:

- **WhatIf.design** - polished and broad, but less funny.
- **AltUI** - short, but maybe too generic.
- **CursedLaunch** - funnier, but narrower and more negative.
- **BrandSwap** - clear, but sounds like a SaaS tool.
- **ParallelProduct** - elegant, less meme-ish.
- **IfTheyBuiltIt** - conversational and funny.
- **Mockverse** - good for a community gallery.
- **FakeSiteLab** - clear, slightly mischievous.

Current recommendation: keep **ifXBuiltY** for now. It has the strongest prompt-shaped identity.

## Core Promise

Make a funny, plausible, high-quality fake screenshot in under 30 seconds that people want to post immediately.

The product should optimize for:

1. **Recognition** - people instantly understand both X and Y.
2. **Specificity** - the jokes feel tailored, not generic.
3. **Shareability** - every image has a clean title, watermark, and remix link.
4. **Remixability** - viewers can generate their own version in one click.

## User Flow

1. User lands directly on the generator.
2. They enter:
   - "If [builder] built [target]"
   - Optional vibe/tone
   - Optional region/culture
   - Optional screen type
3. The app generates the image.
4. User can add extra prompt details and regenerate.
5. User can remix someone else's generation.
6. User can:
   - Download/share the image.
   - Publish it to the public feed.
   - Remix the idea.
   - Upvote or downvote other generations.

## Generator Modes

### Fast Mode

One prompt, one image.

Best for casual use:

> Indian Government built LinkedIn

### Remix Mode

Start from someone else's public generation and mutate one part:

- Change builder.
- Change target.
- Change tone.
- Change country.
- Change screen type.

Example remixes:

- Indian Government built LinkedIn
- Indian Government built Tinder
- IRCTC built LinkedIn
- Zerodha built LinkedIn
- Duolingo built LinkedIn

### Template Mode

Optional prebuilt prompt templates for repeatable formats:

- "If X built Y"
- "X-coded Y"
- "Y, but designed by X"
- "The login page from another timeline"
- "Pitch deck screenshot from the cursed universe"
- "Government portal version"
- "Premium SaaS version"
- "Scam app version"
- "Luxury brand version"
- "2012 startup version"

## Lightweight Social Loop

The first community layer should be tiny. No profiles, comments, collections, leaderboards, or daily challenges required for launch.

Each published generation needs:

- Image
- Prompt
- Builder
- Target
- Optional extra details
- Vote score
- Remix count
- "Remix this" button

The core loop:

1. Someone generates a funny image.
2. They share it or publish it.
3. Viewers upvote/downvote it.
4. Viewers hit "remix this."
5. The remix starts with the same builder, target, tone, screen type, and extra details prefilled.

This is enough to create a sense of participation without building a full community product.

## Virality Loops

### Image Watermark

Every shared image should include a small, tasteful footer:

> ifXBuiltY.com - Remix this: Indian Government x LinkedIn

The watermark should be visible but not ruin the joke.

### Remix Link

Every public image gets a remix URL:

> ifxbuilty.com/r/indian-gov-linkedin

Opening it should preload the exact prompt and settings.

### Share Cards

Generate platform-ready assets:

- Square image for Instagram/LinkedIn
- 16:9 for Twitter/X
- 9:16 story format
- Carousel with multiple variants

### Quote Hooks

After generation, suggest captions:

- "This is too real."
- "Why does this look launch-ready?"
- "I would hate-use this."
- "The alternate timeline is hiring."
- "Someone please build this, but also please don't."

### Simple Score Signal

Public posts can show:

- Upvotes
- Downvotes
- Net score
- Remix count

This gives users a reason to browse and compete lightly without requiring comments, follows, or moderation-heavy features.

## What Makes The Images Funny

The generator should understand that the joke comes from collision:

- Visual language from X
- Product mechanics from Y
- Microcopy that blends both worlds
- UX patterns that reveal the builder's worldview
- Tiny local or cultural references
- Overly plausible details

For the example "Indian Government built LinkedIn," the fun comes from:

- Official national visual language
- Bureaucratic trust cues
- DigiLocker login
- Initiative cards
- Nation-building copy
- Public-sector language over a professional network
- Small details like "edited," "View all," "Skill India," and verification markers

## MVP Scope

### Must Have

- Text prompt: "If X built Y"
- Optional tone selector
- Optional screen type selector
- Optional extra details field
- Generate image
- Save/download result
- Publish to public feed
- Remix from any public generation
- Upvote/downvote public generations
- Shareable public page per generation

### Should Have

- Tags
- Trending sort based on votes and remixes
- Caption suggestions
- Watermarked share image

### Could Have

- Multi-image carousels
- Daily prompt
- Lightweight creator handles
- Brand/style packs

## First Version Screens

1. **Generator Home**
   - Big prompt composer
   - Example chips
   - Tone and screen type controls
   - Extra details field
   - Recent/trending generations below

2. **Generation Result**
   - Generated image
   - Prompt details
   - Extra details editor
   - Regenerate/remix buttons
   - Share/download buttons
   - Suggested captions

3. **Public Feed**
   - Trending and newest
   - Filters for builder, target, tone, region
   - Remix buttons on every card
   - Upvote/downvote controls

4. **Post Page**
   - One public generation
   - Prompt details
   - Vote score
   - Remix count
   - Related generations

## Prompt Inputs

Core inputs:

- Builder: "Indian Government"
- Target: "LinkedIn"
- Tone: "official, optimistic, slightly bureaucratic"
- Screen type: "desktop landing page"
- Region: "India"
- Detail level: "high"
- Extra details: "include DigiLocker login, national initiatives, public-sector skill cards"

Potential advanced controls:

- Realistic vs absurd
- Minimal vs detailed
- Modern vs retro
- Mobile vs desktop
- Corporate vs consumer
- Local references on/off
- Use fake names only

## Safety And Boundaries

The app should be parody-first, but avoid generating:

- Defamatory claims about real people or companies
- Fake official pages that could be used for phishing
- Login forms that resemble real credential harvesting pages too closely
- Hate, harassment, or targeted abuse
- Misleading watermarks or fake endorsements

Useful rule: make outputs clearly fictional through watermarking and fake brand names while preserving the recognizable joke.

## Early Seed Prompts

- If Indian Government built LinkedIn
- If IRCTC built Tinder
- If Apple built Income Tax e-filing
- If Zomato built a hospital website
- If Duolingo built GitHub
- If Notion built a marriage portal
- If Zerodha built Instagram
- If Cred built a ration card portal
- If Netflix built a school LMS
- If OpenAI built a dating app
- If IKEA built Jira
- If Supreme built Gmail
- If Tesla built a meditation app
- If McDonald's built AWS
- If Figma built a bank

## Open Questions

- Should publishing require login, or can users publish anonymously with generated handles?
- Should the generator output one image or multiple directions by default?
- Should the app support real company logos, or use parody-safe fake marks?
- How much moderation is needed before public feed posts go live?
- Should public posts expose the full prompt for remixing?
- Should the first version focus on Indian internet culture or be global from day one?
- Should voting be anonymous, session-based, or require login?

## Suggested Build Strategy

Start with the smallest thing that proves the loop:

1. Build the prompt composer and image result page.
2. Add an extra details field so users can steer the joke.
3. Add public posts with upvote/downvote.
4. Add remix links that preload the original settings.
5. Add watermarked share images.

The first product win is not "perfect AI image generation." It is getting someone to generate a joke, laugh, share it, and make someone else hit "remix."
