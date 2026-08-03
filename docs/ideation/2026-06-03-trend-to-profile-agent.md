# Trend-to-Profile Agent Ideation

Date: 2026-06-03
Project: ifXBuiltY
Status: Ideation, not implementation plan

## Framing

The strongest version is not a generic research agent. It is a cultural catalog agent for ifXBuiltY: a system that watches weak signals around products, decides whether the catalog should change, and produces review-ready profile updates, new product drafts, screenshot candidates, and prompt patches.

The useful thesis:

> ifXBuiltY needs a living cultural catalog. The agent detects when products become memeable, decides whether the existing catalog should be updated or expanded, and routes the work through human-reviewable evidence packets.

## Grounding Context

- The app is a Next.js/Supabase parody screenshot generator for "what if X built Y?"
- Products are represented as first-class `company_profiles` rows with `profile_type`, `parent_company_id`, `category`, `popularity_tier`, `research_status`, `source_urls`, `meme_strength`, `style_dna`, `archetype`, and `default_vibe_tags`.
- Existing research scaffolding includes `product_research_runs`, `product_candidates`, `product_profile_drafts`, `product_draft_citations`, and `product_screenshot_candidates`.
- Existing workflow path: create research run, discover candidates from seed company/category, find official sources, fetch pages, summarize product profile, summarize meme DNA, save draft, then human approval publishes into `company_profiles`.
- Current gaps: trend signals are not first-class, discovered candidates are not fully used as a decision layer, screenshot capture is partial, social evidence is not auditable enough, existing-profile refresh is not distinct from new-profile creation.
- External trend tooling is fragmented. Google Trends programmatic access remains limited/alpha, and social listening products generally aggregate many weak sources rather than relying on one authoritative feed. That supports a multi-source signal stack.

## Topic Axes

1. Signal collection and source reliability
2. Catalog matching, duplicate handling, and stale-profile detection
3. Deep research and evidence gathering
4. Human review and auditability
5. Prompt/profile improvement and screenshot-generation payoff

## Ranked Survivors

### 1. Catalog Gardener, Not Trend Scout

The agent should first ask, "How should the catalog change?" rather than "What new products are trending?" Most signals should become one of four actions: ignore, improve an existing profile, create a prompt/screenshot patch, or spawn a deep research subagent for a missing product.

Basis: The repo already has approved profiles, drafts, and approval paths; blindly adding products would duplicate existing work and pollute review. The most valuable behavior is maintaining freshness.

Why it matters: This gives the hackathon project a product-shaped point of view. The agent is not a crawler; it is an editor for ifXBuiltY's cultural memory.

### 2. Signal Stack, Not Virality Score

Trend scoring should combine independent signals: Reddit complaint language, X/Twitter velocity, Hacker News or Product Hunt launch chatter, GitHub/package/developer buzz where relevant, news/search interest, screenshot availability, visual distinctiveness, meme density, catalog gap, and safety risk.

Basis: External trend tools and social listening products work by aggregating many sources; no single API reliably captures "memeable product becoming culturally legible."

Why it matters: ifXBuiltY does not need what is merely popular. It needs what is funny, recognizable, and visually parodyable.

### 3. Rejection-Oriented Triage

Before deep research, each candidate should get a "why not this?" pass: too obscure, already covered, weak UI identity, one-day outrage, weak screenshot surface, risky claims, too generic, or not funny in screenshot form.

Basis: The agent's failure mode is filling `product_profile_drafts` with plausible sludge. A high-quality editorial agent should reject often.

Why it matters: It protects the review queue and makes autonomy feel useful rather than noisy.

### 4. Catalog Collision and Alias Resolver

The agent should normalize product names, company names, former names, domains, founder names, categories, and community nicknames before creating anything. "Cursor", "Anysphere", "Cursor AI", and "AI code editor discourse" may be one catalog target, a profile update, or a category signal depending on evidence.

Basis: Trend data is messy, and the existing catalog already has company/product rows plus drafts. Matching is necessary before spawning research.

Why it matters: Duplicate catalog objects make prompt quality and admin review worse over time.

### 5. Profile Delta Agent

When a trend maps to an existing product, produce a compact delta packet rather than a full rewrite. The packet proposes updates to `style_dna`, `meme_dna`, screenshot candidates, prompt hooks, default vibe tags, and stale references, with evidence for each change.

Basis: Existing profiles can go stale quietly. Updating them is cheaper and more valuable than creating near-duplicates.

Why it matters: This creates compounding quality. Every trend cycle can sharpen the generator.

### 6. Meme Half-Life Scoring

Classify each signal as flash joke, recurring trope, product identity shift, durable design meme, or category-level meme. Short-lived jokes can become prompt variants or screenshot candidates; durable patterns can graduate into `meme_dna` or `style_dna`.

Basis: Social spikes are not equal. A one-day launch controversy and a durable "Duolingo guilt trip" style meme should not be stored the same way.

Why it matters: The catalog stays timely without fossilizing around stale jokes.

### 7. Social Signal Router

Treat sources as field-specific evidence rather than one big trend blob. Reddit is strong for complaint language and inside jokes, X/Twitter for velocity and founder/audience reactions, Product Hunt and launch pages for positioning, docs/app stores/marketing pages for official design claims, screenshots for visual truth.

Basis: Each source type answers a different question about the product.

Why it matters: This makes the tool outputs composable. A Reddit extraction tool can feed `meme_dna`, while screenshot tools feed `style_dna` and prompt visual constraints.

### 8. Screenshot Evidence as First-Class Research

Deep research should be oriented around public visual evidence: landing pages, pricing screens, app stores, docs screenshots, launch demos, changelog images, dashboard examples, onboarding, empty states, error states, settings, AI prompt surfaces.

Basis: ifXBuiltY produces screenshots. Visual evidence matters more than generic product summaries.

Why it matters: It prevents profile drafts from becoming "modern SaaS" soup and gives image generation concrete surfaces to mimic or parody.

### 9. Editor-Ready Dossier

The final output should look like a newsroom pitch packet: recommendation, evidence, proposed catalog action, proposed profile changes, proposed `style_dna`, proposed `meme_dna`, screenshot references, confidence, unresolved questions, and approval buttons.

Basis: Existing admin review already approves drafts; the agent should feed that review surface, not create a parallel workflow.

Why it matters: Humans stay in control, but the human job becomes judgment rather than tab-opening and cleanup.

### 10. Trend-to-Screenshot Queue

The agent should not stop at metadata. For strong trends, it should produce ranked screenshot-generation candidates: target scene, joke premise, visual surface, product pair suggestions, and source rationale.

Basis: The core product is shareable parody screenshots, not catalog management.

Why it matters: This connects trend research directly to visible output and makes the demo more compelling.

### 11. Contradiction Detector

Look for mismatches between how the existing profile describes a product and how people currently joke about it. A product may be visually accurate but culturally stale.

Basis: The repo stores profile fields, and social signal extraction can compare new meme language against old `style_dna` or `meme_dna`.

Why it matters: The agent can explain not just "this is trending" but "our current profile is missing the current joke."

### 12. Review Queue Friction Meter

Score every candidate or dossier by source quality, duplicate risk, screenshot coverage, meme confidence, design confidence, safety risk, and completeness. Low-confidence packets should remain held or rejected instead of entering the main review queue.

Basis: Autonomous research only helps if it saves review time.

Why it matters: It makes the agent accountable to reviewer effort, not raw output volume.

## Rejected or Deprioritized Directions

### Generic Social Listening Dashboard

Rejected because it would duplicate many existing tools and does not connect tightly enough to ifXBuiltY's catalog and generator.

### Fully Autonomous Publishing

Rejected for the hackathon scope. Publishing profiles without review risks stale jokes, weak evidence, and unsafe claims. Review-ready autonomy is stronger and more defensible.

### Research Agent as the Main Product

Rejected as too generic. Research is one subagent inside a larger trend-to-catalog decision loop.

### One Magic Trend API

Rejected because trend data is fragmented and source-specific. The stronger design uses a signal stack with confidence and source-specific routing.

### Broad Internet Crawler

Rejected for scope, legality, and review noise. The initial version should use bounded sources and structured evidence.

### Pure Screenshot Harvester

Rejected as too visual-only. Screenshots are critical, but the system also needs meme language, catalog matching, freshness, and review decisions.

## Strong Hackathon Shape

The five-day proof should be a vertical slice:

1. Ingest a bounded set of trend sources, likely mockable fixtures plus 1-2 live sources.
2. Normalize product candidates and evidence into structured signal records.
3. Match candidates against existing profiles and drafts.
4. Route each candidate to reject, refresh existing profile, create prompt/screenshot patch, or spawn deep research.
5. Spawn one real isolated deep-research subagent for a missing product.
6. Produce an editor-ready dossier and write it into existing draft/review structures.
7. Demonstrate one long-horizon run with 20+ tool calls and trace logs.

This keeps the submission deep without requiring a full production social listening company.

## Possible Names

- Trend Scout
- Catalog Gardener
- Meme Desk
- Signal Desk
- Cultural Catalog Agent
- Trend-to-Profile Agent
- ifXBuiltY Assignment Desk

Best working name: **Meme Desk** for the product surface, **Trend-to-Profile Agent** for the engineering artifact.

## Defensible Design Decision

Use a review-ready dossier pipeline instead of autonomous profile publishing.

Defense: ifXBuiltY's quality depends on taste, cultural context, visual evidence, and safety. The agent can automate discovery, evidence gathering, matching, and proposed diffs, but a human should approve catalog changes. This creates a production-shaped agent that reduces real work without pretending that cultural judgment is solved.
