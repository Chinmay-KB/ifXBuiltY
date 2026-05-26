# Product research workflow

Agent-led discovery for company/product profiles. Humans review and approve before profiles appear in the generator.

## Start a run

1. Open **Admin → Research** (`/admin/research`).
2. Pick a seed company from the list (or type a custom name).
3. Choose **max products** (start with 3–5 until draft quality is good).
4. Click **Discover products**.

Runs are stored in `product_research_runs`. Drafts land in `product_profile_drafts` with status `needs_review`.

## Approve or reject

- **Approve & publish** upserts the draft into `company_profiles` with `profile_type: product` and `research_status: approved`.
- Rejected drafts stay in the DB for tuning (rejection reason on the row).

## Expansion waves

Configured in `src/data/research-seeds.json`:

| Wave | Goal |
|------|------|
| wave-1 | 5 seed companies discovered |
| wave-2 | 25 review-ready products |
| wave-3 | 50 review-ready products |

After each wave, sample generations from the generator and remove weak profiles.

## Quality checklist (approve only if)

- [ ] Official sources cited; screen type set
- [ ] `style_dna` has colors, visual traits, UX traits
- [ ] `archetype` has type, sections, layout
- [ ] Meme DNA is funny but fair (no defamatory claims)
- [ ] A test generation is recognizable without reading the brand name

## Rerun failed research

Use **Discover products** again with the same seed. Candidates/drafts upsert on `(run_id, product_slug)` so retries do not duplicate rows.

## Screenshot rules

- Public marketing/docs pages only by default
- Individual capture failures must not fail the whole run
- Approved screenshots attach via `company_screenshots` on publish (future: screenshot agent)
