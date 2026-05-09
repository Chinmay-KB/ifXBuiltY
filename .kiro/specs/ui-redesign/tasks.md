# Implementation Plan: UI Redesign

## Overview

Transform ifXBuiltY from a generator-first layout into a community-first, feed-forward experience. The implementation proceeds incrementally: design tokens and shared utilities first, then the navigation shell, followed by feed/card components, generation flow, remix flow, and finally integration wiring. Backend APIs largely exist — only minor extensions to `/api/feed` are needed.

## Tasks

- [x] 1. Set up design tokens, shared utilities, and test infrastructure
  - [x] 1.1 Create design tokens and Tailwind config extensions
    - Add Archivo Black and Inter font imports to `src/app/layout.tsx` or `globals.css`
    - Extend `tailwind.config.ts` with custom tokens: border-radius (7px+), transition durations (200ms default), color tokens (canvas, panel, ink, line, accent)
    - Add `columns-1/2/3/5` responsive utilities if not already present
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x] 1.2 Create shared utility functions and types
    - Create `src/lib/ui/types.ts` with `FeedItem`, `FeedSort`, `GenerationInputs`, `GenerationResult`, `RemixSource`, `FeedPageState`, `GeneratePageState`, `CardVoteState` types
    - Create `src/lib/ui/format.ts` with `formatCardLabel()`, `formatCompactCount()`, `formatResultTitle()`, `isGenerateEnabled()`, `hasInputsChanged()` utility functions
    - _Requirements: 3.2, 3.3, 4.3, 6.3, 6.8_

  - [x] 1.3 Write property tests for formatCardLabel
    - **Property 6: Card label formatting with truncation**
    - **Validates: Requirements 3.2**

  - [x] 1.4 Write property tests for formatCompactCount
    - **Property 7: Compact number formatting**
    - **Validates: Requirements 3.3**

  - [x] 1.5 Write property tests for formatResultTitle
    - **Property 11: Result title formatting**
    - **Validates: Requirements 6.3**

  - [x] 1.6 Write property tests for isGenerateEnabled
    - **Property 9: Generate button input validation**
    - **Validates: Requirements 4.3, 4.4**

  - [x] 1.7 Write property tests for hasInputsChanged
    - **Property 14: Regenerate enabled on input change**
    - **Validates: Requirements 6.8**

- [x] 2. Extend the /api/feed route
  - [x] 2.1 Add offset, builder, target query params and hasMore response field
    - Modify `src/app/api/feed/route.ts` to accept `offset`, `builder` (comma-separated), `target` (comma-separated) query params
    - Add `hasMore` boolean to response based on whether more records exist beyond offset+limit
    - Add `top` sort option (net_score DESC without recency weighting)
    - Ensure only `visibility = "published"` AND `moderation_status = "visible"` records are returned
    - _Requirements: 1.1, 1.6, 2.1, 2.3, 2.4, 2.5_

  - [x] 2.2 Write property tests for feed visibility filtering
    - **Property 1: Feed visibility filtering**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Write property tests for trending sort order
    - **Property 2: Trending sort order**
    - **Validates: Requirements 1.6**

  - [x] 2.4 Write property tests for feed filtering intersection logic
    - **Property 4: Feed filtering with intersection logic**
    - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement NavigationShell component
  - [x] 4.1 Create NavigationShell with responsive layout
    - Create `src/components/navigation-shell.tsx` as a client component
    - Implement top nav for desktop (≥768px): Logo + Wordmark, NavLinks (Home, Feed, Generate), UserAvatar/SignInButton
    - Implement bottom tab bar for mobile (<768px) with icon-based tabs
    - Apply neutral chrome tokens, active section highlighting (distinct text color/weight)
    - Fixed positioning at top (desktop) or bottom (mobile)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.2_

  - [x] 4.2 Integrate NavigationShell into RootLayout
    - Update `src/app/layout.tsx` to include NavigationShell
    - Pass user session and active section props
    - Ensure layout works with existing page structure
    - _Requirements: 8.1_

- [x] 5. Implement feed hooks and card components
  - [x] 5.1 Implement useFeed hook with infinite scroll
    - Create `src/hooks/use-feed.ts`
    - Implement fetching from `/api/feed` with sort, builders, targets, offset params
    - Implement `loadMore()` that appends items without removing/reordering existing ones
    - Handle `hasMore` flag to prevent unnecessary requests
    - Support initial items from server-side fetch
    - _Requirements: 1.5, 2.9, 2.11_

  - [x] 5.2 Write property tests for infinite scroll pagination
    - **Property 5: Infinite scroll pagination**
    - **Validates: Requirements 1.5, 2.9, 2.11**

  - [x] 5.3 Implement useVote hook with optimistic updates
    - Create `src/hooks/use-vote.ts`
    - Implement optimistic score update on vote action
    - Revert on server error
    - Track `isPending` and `error` state
    - _Requirements: 1.7_

  - [x] 5.4 Write property tests for optimistic vote with revert
    - **Property 3: Optimistic vote with revert on error**
    - **Validates: Requirements 1.7**

  - [x] 5.5 Implement GenerationCard component
    - Create `src/components/generation-card.tsx` as a client component
    - Display image as dominant visual (≥70% height), label formatted via `formatCardLabel()`, compact vote score
    - Implement hover Action_Bar (fade-in 200ms, fade-out 150ms) on desktop
    - Mobile tap navigates to `/g/[slug]`
    - Show remix count label when `remixCount >= 1`
    - Show placeholder on image load failure
    - Apply design tokens: 7px+ border-radius, box-shadow ≤4px blur, 200ms hover transition
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.3_

  - [x] 5.6 Write property tests for remix count conditional display
    - **Property 8: Remix count conditional display**
    - **Validates: Requirements 3.8**

  - [x] 5.7 Implement VoteControls component
    - Create `src/components/vote-controls.tsx` as a client component
    - Upvote/downvote buttons with compact score display
    - Wire to `useVote` hook
    - Support `compact` prop for card vs detail page variants
    - _Requirements: 1.3, 1.7_

  - [x] 5.8 Implement CardActionBar component
    - Create `src/components/card-action-bar.tsx`
    - Remix, download, share actions
    - Hidden by default on desktop, revealed on card hover
    - 44×44px touch targets on mobile with 8px spacing
    - _Requirements: 3.4, 10.5_

- [x] 6. Implement FeedFilterBar and masonry grid
  - [x] 6.1 Implement FeedFilterBar component
    - Create `src/components/feed-filter-bar.tsx` as a client component
    - SortTabs (Trending | Newest | Top)
    - BuilderFilter and TargetFilter as multi-select dropdowns
    - Sync filter state to URL search params
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.2 Implement FeedMasonryGrid component
    - Create `src/components/feed-masonry-grid.tsx` as a client component
    - CSS columns layout: `columns-1` (<640px), `columns-2` (640-1023px), `columns-3` (1024-1279px), `columns-5` (≥1280px)
    - Cards use `break-inside-avoid`
    - Wire to `useFeed` hook
    - Include InfiniteScrollSentinel (IntersectionObserver at 300px threshold)
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 10.1, 10.3_

  - [x] 6.3 Implement HomeFeedGrid component
    - Create `src/components/home-feed-grid.tsx` as a client component
    - Similar to FeedMasonryGrid but with homepage-specific layout (≥12 cards above fold on desktop)
    - Default trending sort, infinite scroll
    - _Requirements: 1.2, 1.5, 1.6_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Generation Flow
  - [x] 8.1 Implement useGenerate hook
    - Create `src/hooks/use-generate.ts`
    - Manage full lifecycle: submit → loading → result/error
    - Implement `reset()` to clear result and return to input phase
    - Preserve form inputs on error
    - _Requirements: 4.6, 4.7, 5.6, 5.7, 6.7_

  - [x] 8.2 Write property tests for form input preservation on error
    - **Property 10: Form input preservation on generation error**
    - **Validates: Requirements 5.6, 5.7**

  - [x] 8.3 Write property tests for reset clears to defaults
    - **Property 13: Reset clears to defaults**
    - **Validates: Requirements 6.7**

  - [x] 8.4 Implement GeneratorForm component
    - Create `src/components/generator-form.tsx` as a client component
    - Builder and Target text inputs (primary), secondary controls (tone, screenType, region, extraDetails)
    - Generate button enabled only when builder and target are non-empty/non-whitespace
    - Sign-in prompt when not authenticated
    - Error display inline
    - Support `initialValues` and `remixSource` props
    - Vertical stacking on mobile (<768px)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 10.2_

  - [x] 8.5 Implement GenerationLoadingState component
    - Create `src/components/generation-loading-state.tsx` as a client component
    - Showcase slideshow rotating every 5s with cross-fade ≤700ms
    - Microcopy rotator cycling every 5s
    - Indeterminate progress indicator
    - Static placeholder fallback when no showcase examples available
    - Respect `prefers-reduced-motion` (disable auto-play, 0ms transitions)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.4, 9.6, 9.7_

  - [x] 8.6 Write property tests for reduced motion compliance
    - **Property 15: Reduced motion compliance**
    - **Validates: Requirements 9.7**

  - [x] 8.7 Implement GenerationResultView component
    - Create `src/components/generation-result-view.tsx` as a client component
    - Display image at full width, max 600px height, object-fit contain
    - Title in format "if [Builder] built [Target]"
    - Action pills: publish, share, download, remix
    - "Generate another" action (calls reset)
    - "Regenerate" action enabled when inputs differ from last generation
    - Publish flow with success link to public page
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 9. Implement Remix Flow
  - [x] 9.1 Implement RemixForm and remix page
    - Create `src/components/remix-form.tsx` extending GeneratorForm with attribution strip
    - Update `src/app/remix/[id]/page.tsx` to fetch source generation and pass as `remixSource`
    - Pre-fill all six fields from source generation
    - Display "Remixing from..." attribution strip with source label and thumbnail
    - Store `parent_generation_id` on submission
    - Handle unavailable source generation with error message
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Write property tests for remix pre-fill from source
    - **Property 12: Remix pre-fill from source**
    - **Validates: Requirements 6.6, 7.1**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Wire pages together and integrate
  - [x] 11.1 Build Homepage (/) with hero and feed grid
    - Update `src/app/page.tsx` as a Server Component
    - Add HeroSection with headline (Archivo Black ≥24px) and CTA (44×44px min tap target) linking to /generate
    - Server-fetch initial feed items and pass to HomeFeedGrid
    - Include continuously cycling motion element (showcase rotator with crossfade)
    - Empty state with CTA when no published generations
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.8, 9.1, 9.6_

  - [x] 11.2 Build Feed page (/feed) with filters and masonry grid
    - Update `src/app/feed/page.tsx` as a Server Component with client-heavy children
    - Server-fetch initial feed items, pass to FeedMasonryGrid
    - Include FeedFilterBar with URL param sync
    - Empty state when no results match filters
    - _Requirements: 2.1, 2.2, 2.6, 2.7_

  - [x] 11.3 Build Generate page (/generate) with full flow
    - Update `src/app/generate/page.tsx` as a client-heavy page
    - Wire GeneratorForm → GenerationLoadingState → GenerationResultView
    - Manage phase transitions (input → loading → result/error)
    - _Requirements: 4.1, 4.6, 4.8, 5.5_

  - [x] 11.4 Build Detail page (/g/[slug]) with full generation view
    - Update `src/app/g/[slug]/page.tsx`
    - HeroImage, GenerationMeta, VoteControls (non-compact), ActionButtons (remix, download, share)
    - RelatedGrid of similar generations
    - _Requirements: 3.7_

  - [x] 11.5 Ensure responsive behavior and reduced-motion across all pages
    - Verify no horizontal overflow on mobile (<768px) across all pages
    - Verify column counts at each breakpoint
    - Add `prefers-reduced-motion` CSS custom property to disable auto-play animations globally
    - Verify 44×44px touch targets on mobile
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 9.7_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using vitest + fast-check
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementations should be in TypeScript
- CSS columns masonry layout uses Tailwind utilities (`columns-1/2/3/5`) — no JS masonry library needed
- Backend APIs are largely unchanged; only `/api/feed` needs the offset/builder/target/hasMore extension
- All client components should use `"use client"` directive

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "1.7", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "5.3"] },
    { "id": 4, "tasks": ["5.2", "5.4", "5.5", "5.7", "5.8", "6.1"] },
    { "id": 5, "tasks": ["5.6", "6.2", "6.3", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5"] },
    { "id": 7, "tasks": ["8.6", "8.7", "9.1"] },
    { "id": 8, "tasks": ["9.2", "11.1", "11.2", "11.3"] },
    { "id": 9, "tasks": ["11.4", "11.5"] }
  ]
}
```
