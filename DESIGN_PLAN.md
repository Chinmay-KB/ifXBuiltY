# ifXBuiltY Design Plan

## Summary

Design a **clean meme lab** for the Twitter meme/design crowd: fast, image-forward, playful, and built around the loop of **browse -> generate -> tweak -> share -> remix -> vote**.

Desktop starts with the generator. Mobile starts with trending examples to hook users, then moves quickly into creation.

## Screens And Layouts

- **Home / Generator**
  - Desktop: left side prompt composer, right side live/result workspace; trending masonry feed below.
  - Mobile: top trending examples carousel/feed preview, then composer.
  - Composer uses two large picker controls: **Builder** and **Target**.
  - Builder/Target are not arbitrary freeform noun inputs in v1. They look like focused text fields, but resolve only to supported nouns.
  - Focusing either field opens a lightweight noun picker dropdown/sheet.
  - Noun picker supports search/typeahead for known nouns and category browsing for discovery after focus.
  - Categories should help users quickly find brands, apps, companies, places, objects, jobs, institutions, and internet archetypes.
  - Secondary controls: tone, screen type, region, extra details.
  - Primary CTA: `Generate`.
  - If signed out, CTA becomes `Sign in to generate`.
  - The landing/generator page should feel abundant by rotating through example Builder + Target pairs and showing pre-generated images for those pairs.
  - Rotation can be animated in-place: pair chips, prompt title, and image preview update together so users immediately understand the product without needing to generate first.

- **Generation Workspace**
  - Same page as composer, not a separate result page.
  - Shows loading state, generated image, prompt summary, and editable extra details.
  - Generated image should take the full workspace width on desktop; avoid a separate status/action/caption rail.
  - After success, actions should appear as subtle image-adjacent or overlay controls, not large stacked cards.
  - Share/download/remix/publish controls should be compact icon or icon-label pills.
  - Upvote/downvote should use a small voting cluster near the generated image, with selected state kept quiet.
  - Suggested captions can appear in a compact expandable/copy surface below or near the image, not as a permanent side panel.

- **Public Feed**
  - Masonry card layout.
  - Sort tabs: `Trending`, `Newest`.
  - Each card shows image, compact prompt title, vote score, remix count, upvote/downvote, and `Remix`.
  - Cards open the public generation page.
  - Mobile uses a single-column masonry-like feed with large image cards.

- **Public Generation Page**
  - Shareable page for one generation.
  - Hero is the generated image.
  - Shows prompt details, vote controls, remix count, report action, and `Remix this`.
  - Related/trending generations appear below.
  - Open Graph image should use the generated image so links look good on Twitter/X.

- **Remix Flow**
  - `Remix this` opens the generator with builder, target, tone, screen type, region, and extra details prefilled.
  - Show a small "Remixing from..." strip with the parent prompt.
  - User can change picker-backed fields by reopening the noun picker, not by typing arbitrary nouns directly into the composer.
  - Remix relationship is saved when published.

- **Noun Picker**
  - Opens only after either Builder or Target receives focus.
  - The default composer should stay visually clean: two large field controls, no category panel shown up front.
  - Has a prominent search field for typing to find a supported noun.
  - Shows categorized noun groups when the query is empty or broad.
  - Category examples: `Brands`, `Apps`, `Institutions`, `Places`, `Jobs`, `Objects`, `Internet`, `Wildcard`.
  - Search results and category items should use compact selectable rows or chips with enough metadata to disambiguate names.
  - Empty search state should suggest close matches and popular nouns rather than allowing arbitrary unsupported entry.
  - Selecting a noun closes the picker and updates the composer.

- **Sign In / Sign Up**
  - Use a modal on desktop and a bottom sheet or centered sheet on mobile.
  - Open when a signed-out user tries to generate, publish, save/share a private result, or use any account-backed action.
  - Keep authentication lightweight: primary Google sign-in, optional email magic link if supported.
  - Sign in and sign up can be the same surface; copy should say the user is one click away from generating/publishing, not force them to choose account mode first.
  - Preserve the current prompt and result behind the modal so signing in feels like continuing, not starting over.
  - Include clear close/dismiss behavior.

## Core User Flows

- **Generate**
  - User selects Builder + Target from picker controls.
  - Optional: selects tone/screen type/region and adds details.
  - If signed out, the auth modal/sheet opens and preserves the prompt.
  - Loading state appears in the workspace.
  - Result appears beside/below the composer.

- **Tweak**
  - User edits extra details or changes picker-backed prompt fields through the noun picker.
  - `Regenerate` creates a new output while preserving the old result until the new one succeeds.

- **Share**
  - Primary result action downloads or shares the watermarked image.
  - Public page link is available after publishing.
  - Suggested captions are copyable.

- **Publish**
  - Signed-in user publishes a generated result to the feed.
  - Published item gets a public slug/page.
  - Public post exposes prompt fields for remixing.

- **Vote And Report**
  - Anonymous users can upvote/downvote once per generation per session.
  - Users can report a public generation from feed cards or post page.
  - Reported/hidden states should be designed, even if moderation is basic in v1.

## Design System Direction

- Visual tone: polished, quick, slightly mischievous, not chaotic.
- Voice: tongue-in-cheek, editorial, and specific. Keep the core mechanic obvious; make the examples and small supporting lines do the winking.
- Copy should feel dry, compact, and meme-native without becoming cryptic or try-hard.
- Avoid a generic AI SaaS look; the generated images are the star.
- Use compact controls, strong image previews, sharp copy, and a playful but restrained palette.
- Use motion on the landing/generator page to communicate abundance: rotating prompt pairs, changing selected chips, and pre-generated result previews.
- Cards should be image-forward, with actions kept tight and scannable.
- Use icons for vote, remix, download, share, report, and regenerate actions.
- Keep text minimal: labels should support speed, while small helper copy can carry the wink.
- Keep high-risk actions and form fields clear enough to use. Personality should sharpen comprehension, not bury it.

## Copy Direction

- Home headline examples: `What if X built Y?`, `Pick two nouns. Get the fake screenshot.`, `Make a product crossover no one asked for.`
- Composer helper examples: `Choose a builder, choose a target, then let it overthink the interface.`
- Feed headline examples: `The wall of questionable taste`, `Freshly incriminating`, `Hot messes`.
- Result state examples: `Freshly forged`, `Still unpublished, technically innocent`, `Suggested excuse`.
- Action language can be compact but should stay legible: `Generate`, `Remix`, `Share`, `Save`.
- Avoid explaining the mechanism in visible UI unless the user is blocked.

## Required States

- Empty generator with example chips.
- Noun picker closed/open states.
- Noun picker search, category browsing, empty/no exact match state.
- Sign in/sign up modal and mobile sheet.
- Auth loading/error state.
- Signed-out generate CTA.
- Loading/generating state.
- Generation failed state with retry.
- Generated but unpublished state.
- Published state with public link.
- Feed empty state.
- Vote selected/unselected states.
- Report submitted state.
- Remix prefilled state.
- Mobile composer/feed transitions.

## Assumptions

- Desktop home is generator-first.
- Mobile home is browsing-first to hook users with examples.
- Result stays in the same workspace for fast iteration.
- Feed uses masonry cards.
- First design artifact is a screen spec/wireframe plan, not a clickable prototype yet.
- Primary result actions are compact Share/Download and Remix controls near the generated image, with Publish secondary.
