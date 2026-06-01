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

## License

MIT — see [LICENSE](./LICENSE).
