# Company and Product Expansion

This is the working scope for turning ifXBuiltY from "company x company" into "company or product x product."

Current local catalog status: `src/data/company-profiles.json` has 58 companies and 106 product entries. Treat that file as a seed list, not the final source of prompt truth. The generation path currently reads richer rows from Supabase `company_profiles`, so selected products need to become first-class researched profiles before they will generate well.

## Product Profile Model

A product should be eligible as both:

- Builder: "what if this product's visual/UX/meme DNA built something else?"
- Target: "what if someone else built this product/domain?"

Suggested fields for a researched product profile:

- `id`: stable slug, e.g. `google-maps`
- `company_id`: parent company, e.g. `google`
- `name`: public product name
- `category`: search, video, maps, payments, docs, IDE, OS, commerce, social, etc.
- `screen_type`: desktop web, mobile app, desktop app, OS shell, console, dashboard
- `popularity_tier`: 1 core, 2 strong, 3 niche-but-memeable
- `style_dna`: visual traits, UX traits, tone, colors, iconic elements
- `meme_dna`: recurring jokes, user frustrations, recognizable anti-patterns
- `archetype`: sections, layout, interaction model, content style
- `reference_urls`: official product pages and high-quality public references
- `screenshot_targets`: safe pages or flows to capture
- `screenshot_paths`: stored assets after capture/review
- `research_status`: seed, researched, reviewed, approved, rejected

## Priority 1: Broad Consumer Recognition

These should come first because people instantly understand the joke.

| Company | Products |
| --- | --- |
| Google | Search, YouTube, Maps, Gmail, Drive, Docs, Sheets, Slides, Calendar, Photos, Translate, Chrome, Android, Play Store, Wallet, Pay, Meet, Gemini |
| Apple | iOS, macOS, App Store, iMessage, FaceTime, Safari, Apple Music, Apple TV, Apple Pay, Wallet, Maps, Notes, Health, Fitness, iCloud, Find My |
| Microsoft | Windows, Office/Microsoft 365, Word, Excel, PowerPoint, Outlook, Teams, OneDrive, Edge, Bing, Copilot, VS Code, Visual Studio, GitHub, Azure, Xbox, Game Pass, LinkedIn |
| Meta | Facebook, Instagram, WhatsApp, Messenger, Threads, Meta Quest, Horizon, Meta AI, Meta Business Suite, Ads Manager |
| Amazon | Amazon Shopping, Prime, Prime Video, Amazon Music, Kindle, Audible, Alexa, Fire TV, Twitch, Ring, AWS Console |
| Netflix | Netflix, Netflix Games |
| Spotify | Spotify, Spotify Wrapped, Spotify for Artists |
| TikTok | TikTok, TikTok Shop, CapCut |
| Snapchat | Snapchat, Bitmoji, Snap Map |
| Reddit | Reddit, Reddit Ads |
| X/Twitter | X, Communities, Spaces, Grok |
| Uber | Uber Rides, Uber Eats, Driver App |
| Airbnb | Guest App, Host Dashboard, Experiences |
| DoorDash | Consumer App, Dasher App, Merchant Portal |

## Priority 2: Work, Creation, and Developer Products

These are especially good for desktop web and dashboard generations.

| Company | Products |
| --- | --- |
| Adobe | Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Acrobat, Adobe Express, Firefly, InDesign, Behance |
| Figma | Figma Design, FigJam, Dev Mode, Slides |
| Canva | Canva Editor, Magic Studio, Presentations, Docs |
| Notion | Notion, Notion Calendar, Notion Mail, Notion AI |
| Slack | Slack, Slack Huddles, Slack Canvas, Workflow Builder |
| Discord | Discord, Servers, Nitro, Stage Channels |
| Zoom | Meetings, Webinars, Whiteboard, Team Chat |
| Atlassian | Jira, Confluence, Trello, Bitbucket, Loom |
| GitHub | Repos, Pull Requests, Actions, Copilot, Issues, Projects, Codespaces |
| GitLab | Repos, CI/CD, Issues, Security Dashboard |
| Linear | Issues, Cycles, Roadmaps, Triage |
| Asana | Tasks, Projects, Goals, Timeline |
| Monday.com | Boards, Automations, Dashboards |
| Airtable | Bases, Interfaces, Automations |
| Miro | Whiteboards, Templates, Workshops |
| Webflow | Designer, CMS, Ecommerce |
| Framer | Sites, CMS, AI Site Generator |
| Vercel | Dashboard, Deployments, Analytics, AI Gateway, Workflow, Blob, Edge Config |
| Supabase | Dashboard, Auth, Database, Storage, Edge Functions |
| Cloudflare | Dashboard, Workers, Pages, R2, DNS, WAF |
| OpenAI | ChatGPT, API Platform, GPTs, Sora, Codex |
| Anthropic | Claude, Console, Workbench |

## Priority 3: Finance, Shopping, Food, Travel

These are good because their UI patterns are strongly recognizable.

| Company | Products |
| --- | --- |
| Stripe | Dashboard, Checkout, Billing, Connect, Radar |
| PayPal | PayPal, Venmo, Braintree |
| Block | Cash App, Square POS, Square Dashboard |
| Coinbase | Coinbase, Coinbase Wallet, Advanced Trade |
| Robinhood | Trading App, Retirement, Crypto |
| Revolut | Banking App, Cards, Crypto, Travel |
| Wise | Money Transfer, Business, Card |
| Shopify | Admin, Storefront, POS, Checkout, Shop App |
| eBay | Marketplace, Seller Hub |
| Etsy | Marketplace, Seller App |
| Walmart | Shopping App, Marketplace |
| Target | Shopping App, Drive Up |
| Starbucks | Rewards App, Ordering |
| McDonald's | App, Kiosk, Rewards |
| Zomato | Restaurant Discovery, Delivery |
| Swiggy | Food Delivery, Instamart |
| Booking.com | Booking Flow, Partner Hub |
| Expedia | Travel Search, Trips |

## Priority 4: Product-Specific Meme Gold

These may be smaller than the giants, but the jokes are crisp.

| Product | Why It Works |
| --- | --- |
| Duolingo | Streak pressure, mascot guilt, hearts, XP, oddly intense reminders |
| LinkedIn | Professional theater, humblebrags, endorsements, connection farming |
| Tinder | Swipe mechanics, premium upsells, match anxiety |
| Bumble | Dating mechanics, countdown pressure, safety/profile prompts |
| Waze | Crowd reports, playful navigation, rerouting chaos |
| Monzo | Pots, neon cards, friendly bank copy |
| Superhuman | Keyboard-command email mystique, speed obsession |
| Arc | Browser maximalism, spaces, command bar, opinionated UX |
| Raycast | Launcher culture, power-user command menus |
| Peloton | Streaks, leaderboards, instructor hype |
| Headspace | Calm copy, illustrated mindfulness, soft progress loops |
| Calm | Sleep stories, serene visuals, subscription nudges |

## Agent-Led Research Workflow

Vercel Workflow is a good fit because the system should run a durable research agent, not ask a person to type products in one by one. Each workflow run starts from a broad seed like `Google`, `Microsoft`, or `developer tools`, then discovers products, researches them, captures references, drafts prompt-ready profiles, and waits for review.

Proposed workflow:

1. `seedProductCandidates`
   - Input: company name, website, or broad category.
   - Output: normalized candidate products with official URLs and priority score.
   - Agent responsibility: discover the products instead of relying on a hand-written list.

2. `researchProductProfile`
   - Read official product pages and selected public references.
   - Extract category, screen type, core surfaces, notable UI motifs, and user-facing vocabulary.
   - Produce a structured draft with citations.

3. `researchMemeDna`
   - Search for recurring user complaints, memes, anti-patterns, and cultural shorthand.
   - Keep the output satirical but avoid unverifiable defamatory claims.
   - Separate "observed meme" from "model inference."

4. `collectReferenceScreenshots`
   - Capture official public pages where allowed.
   - Prefer product marketing pages, docs screenshots, app store images, public dashboard examples, and help center imagery.
   - Store raw screenshots in `company-screenshots` or a new `product-screenshots` bucket.

5. `scoreAndDeduplicate`
   - Reject duplicates, low-recognition products, discontinued products, and products without useful visual identity.
   - Assign `popularity_tier` and `meme_strength`.

6. `waitForHumanApproval`
   - Admin reviews profile, screenshots, and meme DNA before publishing.

7. `publishProductProfile`
   - Upsert a profile row and screenshot rows.
   - Mark status as approved.

Human responsibility:

- Start or schedule research runs.
- Review drafts, screenshots, citations, and meme factors.
- Approve, edit, reject, or rerun drafts.

Non-goal:

- Manually adding every product. Manual entry should exist only as an override or emergency escape hatch.

## Data Model Options

Option A: Products as first-class `company_profiles`

- Fastest path with current app code.
- Product IDs like `google-maps`, `vs-code`, `photoshop` behave exactly like companies.
- Parent company can live inside `style_dna` or a new nullable `parent_company_id`.
- Downside: admin copy still says "company" until redesigned.

Option B: Add `product_profiles`

- Cleaner long-term model.
- Allows parent company, product category, source URLs, research status, and screenshots per product.
- Requires generator UI and prompt merging to query a unified entity list.

Recommendation: use Option A for the next usable iteration, then migrate to Option B when the design work begins.

## Workflow Implementation Sketch

Install:

```bash
yarn add workflow
```

Example shape:

```ts
export async function discoverAndResearchProducts(seed: {
  companyName?: string;
  category?: string;
  maxProducts?: number;
}) {
  "use workflow";

  const candidates = await discoverProductCandidates(seed);
  "use step";

  const scoredCandidates = await scoreAndDeduplicateCandidates(candidates);
  "use step";

  const profileDrafts = await researchProductProfiles(scoredCandidates);
  "use step";

  const memeDrafts = await researchMemeDna(scoredCandidates);
  "use step";

  const screenshots = await collectReferenceScreenshots(scoredCandidates);
  "use step";

  const drafts = await mergeAndValidateDrafts({
    profileDrafts,
    memeDrafts,
    screenshots,
  });
  "use step";

  return await persistDraftsForReview(drafts);
}
```

The exact API surface should be checked against the installed `workflow` package once added. Today this repository does not have a Workflow dependency installed.

## Sources Checked

- Google official product index: https://about.google/products/
- Microsoft official product/app index: https://www.microsoft.com/en-us/microsoft-products-and-apps/
- Meta product/help references: https://www.facebook.com/help/1561485474074139 and https://about.fb.com/news/
- Adobe official product index: https://www.adobe.com/products/
- Vercel Workflow overview: https://vercel.com/workflows

## Tick-Off Task Plan

The workflow should be the researcher and importer. The human role should be review, approval, and occasional correction.

### Phase 1: Define the Agent Contract

- [ ] Define a `ProductResearchAgentInput` shape with seed company, optional category, max products, region, and run mode.
- [ ] Define a `ProductResearchAgentOutput` shape with discovered products, rejected products, source citations, screenshots, and draft profiles.
- [ ] Define strict JSON schemas for discovered product candidates.
- [ ] Define strict JSON schemas for researched product profiles.
- [ ] Define strict JSON schemas for meme DNA.
- [ ] Define strict JSON schemas for screenshot candidates.
- [ ] Add validation that rejects drafts missing sources, screen type, style DNA, archetype, or meme DNA.

### Phase 2: Create Draft Storage

- [ ] Add a table for research runs.
- [ ] Add a table for discovered product candidates.
- [ ] Add a table for researched product drafts.
- [ ] Add a table or JSONB field for citations per draft.
- [ ] Add a table or JSONB field for screenshot candidates per draft.
- [ ] Add status values: `queued`, `discovering`, `researching`, `screenshots`, `needs_review`, `approved`, `rejected`, `published`, `failed`.
- [ ] Add error fields for failed agent/workflow steps.
- [ ] Add uniqueness rules so repeated runs update existing candidates instead of creating duplicates.

### Phase 3: Build the Discovery Agent

- [ ] Create an agent step that starts from a company name or category, not a manually curated product list.
- [ ] Search official product indexes first.
- [ ] Search official app/product pages second.
- [ ] Search app stores, help centers, docs, and public product pages as supporting sources.
- [ ] Extract product names, official URLs, parent company, category, and likely screen type.
- [ ] Score each product for popularity, recognizability, and meme potential.
- [ ] Reject discontinued, duplicate, tiny, or visually generic products.
- [ ] Persist discovered candidates with citations.
- [ ] Return the top N candidates for the next workflow step.

### Phase 4: Build the Profile Research Agent

- [ ] For each candidate, read official sources.
- [ ] Extract visual identity: colors, typography cues, layout patterns, components, density, motion, imagery.
- [ ] Extract UX identity: onboarding, navigation, empty states, notifications, search, feeds, dashboards, settings.
- [ ] Extract product archetype: core screens, sections, user jobs, content style, interaction model.
- [ ] Extract common vocabulary and microcopy patterns.
- [ ] Generate `style_dna` in the existing prompt-compatible shape.
- [ ] Generate `archetype` in the existing prompt-compatible shape.
- [ ] Generate `default_vibe_tags`.
- [ ] Persist a draft profile with citations for every non-obvious claim.

### Phase 5: Build the Meme Research Agent

- [ ] Search public web references for recurring jokes, user frustrations, and cultural shorthand.
- [ ] Search communities, articles, reviews, and social posts only as supporting cultural signals.
- [ ] Keep official factual notes separate from satirical inference.
- [ ] Extract meme factors as concise, reusable prompt ingredients.
- [ ] Reject claims that are defamatory, too niche, or not source-backed.
- [ ] Score each meme factor for recognizability and usefulness in image generation.
- [ ] Store meme factors inside `style_dna.meme_exaggeration`, `behavioral_stereotypes`, and `satirical_patterns`.
- [ ] Persist source URLs and confidence scores.

### Phase 6: Build the Screenshot Agent

- [ ] Find official public pages that visually represent the product.
- [ ] Find public documentation/help pages with UI screenshots.
- [ ] Find app store or marketplace screenshots where relevant.
- [ ] Capture only public, non-authenticated pages by default.
- [ ] Store raw screenshots in the chosen bucket.
- [ ] Store screenshot metadata: source URL, captured at, viewport, product ID, and notes.
- [ ] Generate thumbnails for review.
- [ ] Mark blocked or low-quality captures as failed without failing the whole run.

### Phase 7: Orchestrate with Vercel Workflow

- [ ] Add the Workflow dependency with Yarn.
- [ ] Check the installed Workflow SDK docs/API after install.
- [ ] Create `discoverCompanyProductsWorkflow`.
- [ ] Add step: create research run.
- [ ] Add step: invoke discovery agent.
- [ ] Add step: dedupe and score candidates.
- [ ] Add step: fan out profile research jobs.
- [ ] Add step: fan out meme research jobs.
- [ ] Add step: fan out screenshot capture jobs.
- [ ] Add step: merge agent outputs into product drafts.
- [ ] Add step: validate draft schemas.
- [ ] Add step: persist drafts as `needs_review`.
- [ ] Add step: notify/admin-surface that drafts are ready.
- [ ] Make each step idempotent so retries do not duplicate rows or screenshots.

### Phase 8: Publish Automatically After Approval

- [ ] Add an approval action for a draft product.
- [ ] On approval, upsert the draft into `company_profiles` or the chosen product table.
- [ ] On approval, attach approved screenshots to the generated profile.
- [ ] On rejection, preserve the draft and reason for future agent tuning.
- [ ] Allow "approve all above score X" only after individual review works.
- [ ] Preserve manually edited profiles unless the reviewer opts into overwrite.

### Phase 9: Build Admin Review

- [ ] Add an admin view for research runs.
- [ ] Add an admin view for discovered candidates.
- [ ] Add an admin view for product drafts.
- [ ] Show agent confidence and rejection reasons.
- [ ] Show official citations.
- [ ] Show meme citations separately from official sources.
- [ ] Show screenshot candidates and thumbnails.
- [ ] Allow inline edits before approval.
- [ ] Allow rerunning a failed product draft.
- [ ] Allow rerunning an entire company/category discovery job.

### Phase 10: Seed the Agent, Not the Products

- [ ] Create a short seed list of companies/categories for the workflow to research.
- [ ] Include Google as a seed company.
- [ ] Include Microsoft as a seed company.
- [ ] Include Apple, Meta, Amazon, Adobe, Atlassian, GitHub, Stripe, Shopify, OpenAI, Vercel, and Supabase as seed companies.
- [ ] Include categories like social, payments, developer tools, productivity, media, commerce, travel, food, health, and education.
- [ ] Run discovery with a small `maxProducts` value first.
- [ ] Expand max products only after draft quality is acceptable.

### Phase 11: Generator UI

- [ ] Rename picker copy from "company" to "company/product" where appropriate.
- [ ] Group picker options by company.
- [ ] Show products indented under parent company.
- [ ] Add search across company and product names.
- [ ] Add optional filters: consumer, work, dev, finance, social, media.
- [ ] Make sure broad company profiles are still selectable.
- [ ] Update batch generation to sample product profiles too.
- [ ] Verify builder and target cannot be the exact same profile.

### Phase 12: Prompt Improvements

- [ ] Update prompt copy to understand product-level builders.
- [ ] Include parent company context without forcing parent branding.
- [ ] Include product-specific meme DNA in the builder section.
- [ ] Include product-specific archetype in the target section.
- [ ] Keep the "no official logos/lockups" rule.
- [ ] Add tests for company x product, product x company, and product x product.
- [ ] Generate sample outputs for each pairing type.

### Phase 13: Quality Bar

- [ ] Define what counts as a good profile.
- [ ] Define what counts as a good screenshot reference set.
- [ ] Define what counts as meme DNA that is funny but fair.
- [ ] Add a checklist for approving profiles.
- [ ] Score the first 25 profiles.
- [ ] Remove or rewrite weak profiles.
- [ ] Lock the first approved batch.

### Phase 14: Expand in Waves

- [ ] Wave 1: agent discovers candidates for 5 seed companies.
- [ ] Wave 2: agent drafts 25 review-ready products.
- [ ] Wave 3: agent drafts 50 review-ready products.
- [ ] Wave 4: agent drafts 100 review-ready products.
- [ ] Wave 5: agent drafts 150+ review-ready products.
- [ ] After each wave, generate a random sample set.
- [ ] After each wave, remove products that do not produce recognizable outputs.
- [ ] Feed rejected drafts back into agent scoring rules.

### Phase 15: Documentation and Maintenance

- [ ] Document how to start a company/category discovery run.
- [ ] Document how the agent chooses products.
- [ ] Document how to rerun failed research.
- [ ] Document how to approve/reject drafts.
- [ ] Document screenshot capture rules.
- [ ] Document source/citation expectations.
- [ ] Document how to tune scoring prompts after bad drafts.
- [ ] Add a recurring workflow to check stale or discontinued products.
