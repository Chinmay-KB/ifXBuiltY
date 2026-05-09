# Design Document: Homepage "Infinite Wall"

## Overview

Replace the current hero + trending grid homepage with a full-viewport "infinite wall" of generation images. The wall consists of 3–4 horizontal conveyor rows that auto-scroll in alternating directions, creating a dense, kinetic first impression. A floating glassmorphic overlay with the tagline and CTA sits on top.

The existing `/api/feed` endpoint serves all needed data. No new API routes are required. The wall is a purely presentational change to the homepage.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| CSS `@keyframes` for conveyor scroll | GPU-accelerated `translateX` animation; no JS timers needed for smooth motion |
| Server-fetch 40 items, loop client-side | Avoids client waterfall; 40 images is enough for 3–4 rows of ~10 each |
| Duplicate cards in DOM for seamless loop | Standard infinite-scroll-marquee technique: render the list twice, animate one full width, reset |
| No interaction on wall cards (no votes/actions) | Maximizes visual density; detail page handles engagement |
| Fallback to showcase SVGs | Ensures the wall always has content even with zero published generations |
| `will-change: transform` on rows | Hints browser to promote to compositor layer for smooth animation |

## Architecture

```
HomePage (Server Component)
├── fetchFeedServer({ sort: "trending", limit: 40 })
├── WallSection (Client Component)
│   ├── ConveyorRow (direction: "left", speed: 25px/s)
│   │   └── WallCard[] (duplicated for seamless loop)
│   ├── ConveyorRow (direction: "right", speed: 35px/s)
│   │   └── WallCard[]
│   ├── ConveyorRow (direction: "left", speed: 30px/s)
│   │   └── WallCard[]
│   └── FloatingOverlay
│       ├── Tagline (h1)
│       └── CTA Button → /generate
├── HowItWorksSection
└── BrowseAllLink → /feed
```

### Data Flow

1. **Server**: `page.tsx` fetches up to 40 trending feed items via `fetchFeedServer()`.
2. **Props**: Items are passed to `<WallSection items={items} />` as serialized props.
3. **Client**: `WallSection` distributes items across 3–4 rows, duplicates each row's cards for seamless looping, and applies CSS keyframe animations.
4. **Fallback**: If `items.length === 0`, the component uses the 10 showcase SVG paths from `SHOWCASE_EXAMPLES`.

## Components

### WallSection

```typescript
// src/components/wall-section.tsx
"use client";

type WallSectionProps = {
  items: WallItem[];
};

type WallItem = {
  id: number;
  slug: string;
  imageUrl: string | null;
  builder: string;
  target: string;
};

/**
 * Full-viewport wall of generation images in horizontal conveyor rows.
 * - Distributes items across rows (round-robin)
 * - Each row auto-scrolls via CSS animation
 * - Pauses on hover per-row
 * - Respects prefers-reduced-motion
 */
```

### ConveyorRow

```typescript
// Inline within wall-section.tsx or extracted

type ConveyorRowProps = {
  items: WallItem[];
  direction: "left" | "right";
  /** Pixels per second */
  speed: number;
  /** Row height in px */
  height: number;
};

/**
 * Single horizontal strip that loops infinitely.
 * 
 * Implementation:
 * - Renders items twice (original + duplicate) in a flex row
 * - Animates `translateX` from 0 to -totalWidth (for left) or -totalWidth to 0 (for right)
 * - Animation duration = totalWidth / speed
 * - Pauses on hover via CSS `animation-play-state: paused`
 * - Uses `will-change: transform` for GPU acceleration
 */
```

### WallCard

```typescript
type WallCardProps = {
  item: WallItem;
  height: number;
};

/**
 * Minimal image-only card for the wall.
 * - Fixed height, width derived from aspect ratio (or fixed width with object-fit cover)
 * - Links to /g/{slug}
 * - 8px border-radius, 12px gap between cards
 * - Gradient placeholder on image error
 */
```

### FloatingOverlay

```typescript
type FloatingOverlayProps = {
  // No props needed — content is static
};

/**
 * Glassmorphic overlay with tagline + CTA.
 * - Centered over the wall (absolute positioning)
 * - Fades out on scroll (IntersectionObserver or scroll listener)
 * - Semi-transparent backdrop-blur background
 */
```

## CSS Animation Strategy

```css
/* Conveyor animation — left direction */
@keyframes conveyor-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
  /* -50% because the content is duplicated (2x), so sliding half = one full loop */
}

/* Conveyor animation — right direction */
@keyframes conveyor-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

.conveyor-row {
  display: flex;
  width: max-content;
  will-change: transform;
}

.conveyor-row[data-direction="left"] {
  animation: conveyor-left var(--duration) linear infinite;
}

.conveyor-row[data-direction="right"] {
  animation: conveyor-right var(--duration) linear infinite;
}

.conveyor-row:hover {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .conveyor-row {
    animation: none !important;
  }
}
```

The `--duration` CSS variable is calculated per-row: `totalScrollWidth / speed` seconds.

## Row Distribution

With ~40 items distributed across 3–4 rows:

| Row | Direction | Speed | Height | Items |
|-----|-----------|-------|--------|-------|
| 1 | left | 25px/s | 180px | ~10 items |
| 2 | right | 35px/s | 200px | ~10 items |
| 3 | left | 30px/s | 180px | ~10 items |
| 4 (optional) | right | 20px/s | 160px | ~10 items (if 30+ items available) |

Row 4 only renders if there are 30+ items. With fewer items, 3 rows are used to maintain density.

Card widths: Fixed at `height * 1.4` (landscape-ish aspect ratio) with `object-fit: cover`. This ensures uniform row height while allowing the wall to feel dense.

## Floating Overlay Design

```
┌─────────────────────────────────────────────────────┐
│  [Wall rows scrolling behind]                        │
│                                                      │
│         ┌──────────────────────────────┐            │
│         │  backdrop-blur + bg-black/60  │            │
│         │                              │            │
│         │   What if your favorite      │            │
│         │   brand built something      │            │
│         │   totally different?          │            │
│         │                              │            │
│         │   [ Start generating → ]     │            │
│         │                              │            │
│         └──────────────────────────────┘            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

- Background: `bg-black/60 backdrop-blur-md` (or `bg-white/80 backdrop-blur-md` for light mode)
- Border: `ring-1 ring-white/10` for subtle edge
- Padding: `px-8 py-10` on desktop, `px-5 py-8` on mobile
- Max-width: `max-w-lg` to keep text readable
- Fade-out: opacity transition triggered by scroll position > 100px

## Scroll Behavior

1. **Initial state**: Wall fills 100vh, overlay visible, content below is off-screen.
2. **User scrolls**: Overlay fades out (opacity 0 at scroll > 100px). Wall continues to be visible as user scrolls.
3. **Below wall**: Solid-background "How it works" section and "Browse all" link appear. The wall section has `min-h-screen` so it occupies the full first viewport.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Feed fetch returns 0 items | Use showcase SVGs as fallback wall content |
| Feed fetch fails (network error) | Use showcase SVGs as fallback, log error server-side |
| Individual image fails to load | Show gradient placeholder (CSS background) |
| Very few items (< 6) | Duplicate items more aggressively to fill rows |

## Responsive Behavior

| Viewport | Rows | Row Height | Card Width |
|----------|------|------------|------------|
| Desktop (≥1024px) | 3–4 | 180–200px | 250–280px |
| Tablet (768–1023px) | 3 | 150px | 210px |
| Mobile (<768px) | 3 | 120px | 168px |

On mobile, the overlay text scales down (28px headline) and the wall rows are shorter but still fill the viewport.

## Performance Considerations

- **No JS animation loop**: Pure CSS `@keyframes` with `translateX` — runs on compositor thread
- **`will-change: transform`**: Promotes each row to its own layer
- **Lazy loading**: Only first-viewport cards are `loading="eager"`; duplicated/off-screen cards are `loading="lazy"`
- **No infinite scroll on wall**: Fixed set of items, no additional fetches
- **Image optimization**: Use Next.js `<Image>` component where possible for automatic srcset/format optimization, or raw `<img>` with explicit width/height to avoid CLS

