# ifXBuiltY

![xBuildsy banner](https://github.com/Chinmay-KB/ifXBuiltY/blob/main/public/card-smol.png?raw=true)

A playful image generator for the design thought experiment: **what if X built Y?**

Pick a builder (company, government, fandom, celebrity…) and a target product (app, site, category). The app produces a shareable fake screenshot that blends X’s visual language with Y’s product shape—fast enough to post, remix, and vote on.

Built with **Next.js** and **Supabase**.

## Run locally

1. Install dependencies: `yarn install`
2. Copy [`.env.example`](./.env.example) to `.env.local` and fill in at least:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Start the dev server: `yarn dev` → [http://localhost:3000](http://localhost:3000)

Optional: local Supabase (`yarn db:start`) and keys for image generation / payments—see comments in `.env.example`.

## Ship mashups (ops CLI)

Do not generate mashups by clicking the website. `yarn generate:mashup` is the publish path: it reuses Style DNA merge, `buildGenerationPrompt`, `executeImageGeneration` (Vercel AI Gateway), sharp variants, the public `generation-images` bucket, and a **published** `generations` row. It does not debit Dodo credits.

```bash
yarn generate:mashup --help
```

`--dry-run` (or `DRY_RUN=1`) prints the fully built prompt and skips the paid Gateway call, upload, and DB insert.

Example pairings (live picker slugs; extras are prompt notes, not new catalog nouns):

```bash
yarn generate:mashup --builder ikea --target figma --invented-name SKISSA \
  --extra-details 'Empty Figma canvas. Microcopy: "Some assembly required." The move tool is an Allen key.'

yarn generate:mashup --builder apple-ios --target tinder --screen-type mobile --invented-name Halo \
  --extra-details 'Tinder deck plus a Personality slider.'

yarn generate:mashup --builder duolingo --target apple-ios --screen-type mobile --invented-name Perch \
  --extra-details 'Lock screen. Streak dying.'

yarn generate:mashup --builder google --target google-gmail --invented-name Burst \
  --extra-details 'Gmail compose with 8× Send.'
```

Always pass `--dry-run` first. Do not run paid generation from CI.

## License

MIT — see [LICENSE](./LICENSE).
