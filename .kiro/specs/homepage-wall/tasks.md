# Implementation Plan: Homepage "Infinite Wall"

## Overview

Replace the current homepage (hero + trending grid) with a full-viewport infinite wall of generation images. The wall uses CSS keyframe animations for smooth horizontal conveyor rows, a floating glassmorphic overlay for the tagline/CTA, and falls back to showcase SVGs when no published generations exist.

## Tasks

- [x] 1. Create the WallCard component
  - [x] 1.1 Create `src/components/wall-card.tsx`
    - Image-only card with fixed height, width = height × 1.4
    - `object-fit: cover`, 8px border-radius
    - Links to `/g/{slug}` on click
    - Gradient placeholder on image error (via `onError` handler)
    - No metadata, votes, or action bars
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2. Create the ConveyorRow component
  - [x] 2.1 Create `src/components/conveyor-row.tsx`
    - Accepts items, direction (left/right), speed (px/s), and row height
    - Renders items twice (duplicated) in a flex container for seamless loop
    - CSS `@keyframes` animation with `translateX`
    - Animation duration calculated as `totalWidth / speed`
    - `will-change: transform` for GPU acceleration
    - Pauses on hover via `animation-play-state: paused`
    - Respects `prefers-reduced-motion` (no animation, static display)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.8_

- [x] 3. Create the FloatingOverlay component
  - [x] 3.1 Create `src/components/floating-overlay.tsx`
    - Glassmorphic panel: `backdrop-blur-md` + semi-transparent background
    - Contains tagline (Archivo Black, 28px mobile / 40px desktop) and CTA button
    - CTA links to `/generate`, min tap target 44×44px
    - Centered over the wall via absolute positioning
    - Fades out on scroll > 100px (scroll event listener or IntersectionObserver)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [x] 4. Create the WallSection component
  - [x] 4.1 Create `src/components/wall-section.tsx`
    - Client component that orchestrates ConveyorRows
    - Distributes items across 3–4 rows (round-robin)
    - Row configuration: alternating directions, varying speeds (20–40px/s), varying heights
    - Uses 4 rows if 30+ items available, otherwise 3 rows
    - Duplicates items within rows if fewer than 6 items per row to avoid gaps
    - Full viewport height (`min-h-screen`)
    - Contains the FloatingOverlay as a child
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7_

- [x] 5. Add the conveyor CSS keyframes to globals.css
  - [x] 5.1 Add `@keyframes conveyor-left` and `@keyframes conveyor-right` to `src/app/globals.css`
    - `conveyor-left`: translateX(0) → translateX(-50%)
    - `conveyor-right`: translateX(-50%) → translateX(0)
    - Add `prefers-reduced-motion` media query to disable animations
    - _Requirements: 1.3, 1.4, 1.8_

- [x] 6. Update the Homepage to use the Wall
  - [x] 6.1 Rewrite `src/app/page.tsx`
    - Server component fetches up to 40 trending items via `fetchFeedServer({ sort: "trending", limit: 40 })`
    - Falls back to showcase examples if feed returns 0 items
    - Renders `<WallSection>` with fetched items
    - Below the wall: "How it works" section (3 steps) + "Browse all" link to `/feed`
    - Below-wall content has solid background to visually separate from wall
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

- [x] 7. Add sticky Generate CTA to navigation on scroll
  - [x] 7.1 Update NavigationShell or add scroll-aware CTA
    - The existing NavigationShell already has a persistent "Generate" link visible at all times
    - When FloatingOverlay fades, the nav Generate link serves as the persistent CTA
    - No additional component needed
    - _Requirements: 2.5_

- [x] 8. Handle image loading states
  - [x] 8.1 Implement eager/lazy loading strategy
    - First row of cards: `loading="eager"`
    - Subsequent rows and duplicated cards: `loading="lazy"`
    - Set explicit width/height attributes to prevent CLS
    - _Requirements: 4.5_

- [x] 9. Test and verify
  - [ ] 9.1 Verify wall renders with current feed data
  - [ ] 9.2 Verify fallback with empty feed
  - [ ] 9.3 Verify reduced motion
  - [ ] 9.4 Verify responsive behavior

## Notes

- No new API routes needed — uses existing `/api/feed`
- No new database changes
- The existing `HomeFeedGrid` and `ShowcaseRotator` components can be removed from the homepage (keep them in the codebase for the feed page)
- CSS animations run on the compositor thread — no JS animation loops needed
- The wall is purely visual/presentational; all engagement (votes, remix, etc.) happens on detail pages and the feed page

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["6.1", "7.1", "8.1"] },
    { "id": 4, "tasks": ["9.1", "9.2", "9.3", "9.4"] }
  ]
}
```

