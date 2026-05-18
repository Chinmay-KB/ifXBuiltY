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

## Research Workflow

Vercel Workflow is a good fit because each product profile is a multi-step job with retryable external calls, long-running screenshot collection, and human review.

Proposed workflow:

1. `seedProductCandidates`
   - Input: company slug or broad category.
   - Output: normalized candidate products with official URLs and priority score.

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
export async function researchProduct(productId: string) {
  "use workflow";

  const sources = await findOfficialSources(productId);
  "use step";

  const profileDraft = await summarizeProductProfile(productId, sources);
  "use step";

  const memeDraft = await summarizeMemeDna(productId, sources);
  "use step";

  const screenshots = await captureReferenceScreenshots(productId, sources);
  "use step";

  return {
    productId,
    profileDraft,
    memeDraft,
    screenshots,
    status: "needs_review",
  };
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

### Phase 1: Decide the Data Shape

- [ ] Confirm whether products should initially be stored as first-class `company_profiles` rows.
- [ ] Decide whether parent company metadata should be added now or deferred.
- [ ] Pick the minimum fields needed for v1 product entries: `id`, `name`, `parent_company_id`, `screen_type`, `style_dna`, `archetype`, `default_vibe_tags`.
- [ ] Define slug rules for product IDs, e.g. `google-maps`, `microsoft-excel`, `adobe-photoshop`.
- [ ] Decide whether broad companies like `google` and specific products like `youtube` can both appear in the picker.

### Phase 2: Clean the Seed Catalog

- [ ] Validate the current `src/data/company-profiles.json` shape.
- [ ] Remove duplicate product concepts across parent companies where needed.
- [ ] Add missing Priority 1 products from this document.
- [ ] Add missing Priority 2 products from this document.
- [ ] Add missing Priority 3 products from this document.
- [ ] Add Priority 4 meme-heavy products.
- [ ] Add a simple script that counts companies, products, duplicate IDs, and missing `screenType`.
- [ ] Run the script and fix every duplicate or malformed entry.

### Phase 3: Choose the First Batch

- [ ] Select 25 products for the first production-quality batch.
- [ ] Include at least 5 Google products.
- [ ] Include at least 5 Microsoft products.
- [ ] Include at least 5 Apple/Meta/Amazon products.
- [ ] Include at least 5 work/dev products.
- [ ] Include at least 5 meme-heavy products.
- [ ] Mark everything else as backlog.

### Phase 4: Research Profile Template

- [ ] Create a reusable JSON template for a researched product profile.
- [ ] Add fields for official sources.
- [ ] Add fields for visual/style observations.
- [ ] Add fields for UX patterns.
- [ ] Add fields for meme factors and recurring jokes.
- [ ] Add fields for target archetype and screen layout.
- [ ] Add fields for screenshot candidates.
- [ ] Add a status field: `seed`, `researched`, `reviewed`, `approved`, `rejected`.

### Phase 5: Manual Research Pilot

- [ ] Research one Google product manually.
- [ ] Research one Microsoft product manually.
- [ ] Research one creative/dev product manually.
- [ ] Research one consumer/social product manually.
- [ ] Compare the four profiles for consistency.
- [ ] Tighten the template based on what felt missing.
- [ ] Convert the four pilot profiles into Supabase-ready rows.
- [ ] Generate test images from the four pilot profiles.
- [ ] Note which profile fields actually improved the output.

### Phase 6: Database Migration

- [ ] Decide whether to add product metadata columns to `company_profiles`.
- [ ] If needed, add `parent_company_id`.
- [ ] If needed, add `profile_type` with values like `company` and `product`.
- [ ] If needed, add `category`.
- [ ] If needed, add `research_status`.
- [ ] If needed, add `source_urls` as JSONB.
- [ ] If needed, add `meme_strength` or `popularity_tier`.
- [ ] Write the Supabase migration.
- [ ] Run the migration locally.
- [ ] Verify existing company rows still load.

### Phase 7: Import Script

- [ ] Create a script to read researched product profiles from disk.
- [ ] Validate required fields before import.
- [ ] Upsert rows into `company_profiles`.
- [ ] Preserve existing manually edited rows unless explicitly overwritten.
- [ ] Print a summary of created, updated, skipped, and failed rows.
- [ ] Add a dry-run mode.
- [ ] Test dry-run with the pilot profiles.
- [ ] Test real import locally.

### Phase 8: Screenshot Storage

- [ ] Decide whether product screenshots should reuse `company_screenshots`.
- [ ] If not, create a `product_screenshots` table.
- [ ] Decide whether screenshots should reuse the `company-screenshots` bucket.
- [ ] Define storage paths for products, e.g. `google-maps/home.png`.
- [ ] Add screenshot metadata fields: source URL, captured at, kind, notes.
- [ ] Add import support for local screenshot files.
- [ ] Verify screenshots are passed into generation for product builders.

### Phase 9: Workflow Prototype

- [ ] Add the Workflow dependency with Yarn.
- [ ] Check the installed Workflow SDK docs/API after install.
- [ ] Create a minimal workflow function that accepts one product ID.
- [ ] Add a step to collect official source URLs.
- [ ] Add a step to draft style DNA.
- [ ] Add a step to draft meme DNA.
- [ ] Add a step to draft archetype.
- [ ] Add a step to collect screenshot candidates.
- [ ] Return a structured `needs_review` profile draft.
- [ ] Run the workflow locally with one product.

### Phase 10: Research Automation

- [ ] Add web search/source collection for official pages.
- [ ] Add guarded public-reference search for meme factors.
- [ ] Store citations with each extracted claim.
- [ ] Separate factual product notes from inferred satire notes.
- [ ] Add retry/error handling for source fetch failures.
- [ ] Add a maximum source count per product.
- [ ] Add a confidence score per section.
- [ ] Persist workflow output to a draft table or JSON file.

### Phase 11: Screenshot Automation

- [ ] Decide which screenshot capture tool to use.
- [ ] Capture only public, non-authenticated pages by default.
- [ ] Capture official product pages first.
- [ ] Capture public help/docs/app-store images where useful.
- [ ] Generate thumbnails for admin review.
- [ ] Store raw screenshots.
- [ ] Store screenshot metadata and source URLs.
- [ ] Add failure handling for blocked pages.

### Phase 12: Admin Review

- [ ] Add an admin view for draft product profiles.
- [ ] Show product identity and parent company.
- [ ] Show style DNA fields.
- [ ] Show meme DNA fields.
- [ ] Show archetype fields.
- [ ] Show citations/source URLs.
- [ ] Show screenshot candidates.
- [ ] Add approve/reject controls.
- [ ] On approval, publish to `company_profiles`.

### Phase 13: Generator UI

- [ ] Rename picker copy from "company" to "company/product" where appropriate.
- [ ] Group picker options by company.
- [ ] Show products indented under parent company.
- [ ] Add search across company and product names.
- [ ] Add optional filters: consumer, work, dev, finance, social, media.
- [ ] Make sure broad company profiles are still selectable.
- [ ] Update batch generation to sample product profiles too.
- [ ] Verify builder and target cannot be the exact same profile.

### Phase 14: Prompt Improvements

- [ ] Update prompt copy to understand product-level builders.
- [ ] Include parent company context without forcing parent branding.
- [ ] Include product-specific meme DNA in the builder section.
- [ ] Include product-specific archetype in the target section.
- [ ] Keep the "no official logos/lockups" rule.
- [ ] Add tests for company x product, product x company, and product x product.
- [ ] Generate sample outputs for each pairing type.

### Phase 15: Quality Bar

- [ ] Define what counts as a good profile.
- [ ] Define what counts as a good screenshot reference set.
- [ ] Define what counts as meme DNA that is funny but fair.
- [ ] Add a checklist for approving profiles.
- [ ] Score the first 25 profiles.
- [ ] Remove or rewrite weak profiles.
- [ ] Lock the first approved batch.

### Phase 16: Expand in Waves

- [ ] Wave 1: 25 approved products.
- [ ] Wave 2: 50 approved products.
- [ ] Wave 3: 100 approved products.
- [ ] Wave 4: 150+ approved products.
- [ ] After each wave, generate a random sample set.
- [ ] After each wave, remove products that do not produce recognizable outputs.
- [ ] Keep a backlog of requested products from users.

### Phase 17: Documentation and Maintenance

- [ ] Document how to add a product manually.
- [ ] Document how to run the import script.
- [ ] Document how to run the research workflow.
- [ ] Document how to approve/reject drafts.
- [ ] Document screenshot capture rules.
- [ ] Document source/citation expectations.
- [ ] Add a recurring review process for stale or discontinued products.
