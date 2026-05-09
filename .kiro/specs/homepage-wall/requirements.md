# Requirements: Homepage "Infinite Wall" Redesign

## Introduction

Replace the current homepage layout (hero + trending grid) with a full-bleed "infinite wall" of generation images. The wall creates an immediate visual impact — multiple rows of cards scrolling in alternating horizontal directions at different speeds, giving the impression of endless creative output. A floating overlay with the tagline and CTA sits on top, fading on scroll. The existing `/api/feed` endpoint already serves the data; this spec focuses on the new homepage component, the data-fetching strategy, and the visual presentation.

## Glossary

- **Wall**: The full-viewport homepage layout consisting of multiple horizontal conveyor rows of generation cards
- **Conveyor Row**: A single horizontal strip of cards that auto-scrolls continuously in one direction (left or right)
- **Floating Overlay**: A glassmorphic/semi-transparent panel containing the tagline and CTA, positioned over the wall
- **Seed Images**: The pre-generated images already in the database that populate the wall on launch

## Requirements

### Requirement 1: Wall Layout and Visual Impact

**User Story:** As a first-time visitor, I want to see a dense, moving wall of generated images immediately on landing, so that I instantly understand the product's creative output and feel compelled to explore.

#### Acceptance Criteria

1. WHEN a visitor loads the Homepage, THE Wall SHALL render at least 3 horizontal Conveyor Rows that together fill the initial viewport height (100vh) without requiring scroll to see the wall effect
2. EACH Conveyor Row SHALL contain enough cards to overflow the viewport width, creating a seamless horizontal loop (no visible gap when cards wrap around)
3. Adjacent Conveyor Rows SHALL scroll in alternating directions (e.g., Row 1 left-to-right, Row 2 right-to-left, Row 3 left-to-right)
4. EACH Conveyor Row SHALL auto-scroll at a constant speed between 20px/s and 40px/s, with adjacent rows using different speeds to create visual depth
5. WHEN a user hovers over any Conveyor Row, THAT specific row SHALL pause its auto-scroll animation while other rows continue
6. THE Wall SHALL use images from published generations fetched via the existing `/api/feed` endpoint with `sort=trending`
7. IF fewer than 12 published generations are available, THE Wall SHALL duplicate/loop the available images to fill all rows without visible gaps
8. WHEN the user's OS reports `prefers-reduced-motion: reduce`, THE Wall SHALL display all rows as static (no auto-scroll) and show the first viewport-width of cards in each row

### Requirement 2: Floating Overlay (Tagline + CTA)

**User Story:** As a visitor seeing the wall for the first time, I want to understand what this product does and how to start, without the wall feeling overwhelming.

#### Acceptance Criteria

1. THE Homepage SHALL display a Floating Overlay centered vertically and horizontally over the Wall, containing the product tagline and a primary CTA button
2. THE Floating Overlay SHALL have a semi-transparent background (glassmorphic or dark scrim) that ensures text remains readable against any combination of wall images behind it
3. THE Floating Overlay CTA SHALL link to the Generation Flow (`/generate`) with a minimum tap target of 44×44px
4. WHEN the user scrolls down past 100px from the top, THE Floating Overlay SHALL fade out with a transition of no more than 300ms
5. WHEN the Floating Overlay is hidden (scrolled past), a sticky "Generate" pill/button SHALL appear in the navigation bar as a persistent CTA
6. THE Floating Overlay tagline SHALL use the display typeface (Archivo Black) at a minimum of 28px on mobile and 40px on desktop

### Requirement 3: Card Presentation in Wall

**User Story:** As a visitor browsing the wall, I want each card to be visually clean and clickable, so I can dive into any generation that catches my eye.

#### Acceptance Criteria

1. EACH card in the Wall SHALL display only the generated image (no metadata, votes, or action bars) to maximize visual density
2. EACH card SHALL have a fixed height matching the Conveyor Row height and a width determined by the image's aspect ratio (landscape images wider, portrait images narrower)
3. EACH card SHALL have a border-radius of at least 8px and a gap of 12px between adjacent cards in the same row
4. WHEN a user clicks/taps a card in the Wall, THE card SHALL navigate to the generation detail page at `/g/{slug}`
5. EACH card image SHALL use `object-fit: cover` to fill the card dimensions without letterboxing
6. IF a card's image fails to load, THE card SHALL display a subtle gradient placeholder matching the site's color scheme rather than a broken image icon

### Requirement 4: Data Fetching Strategy

**User Story:** As a developer, I want the wall to load fast and not block the page render, so that visitors see content immediately.

#### Acceptance Criteria

1. THE Homepage server component SHALL fetch the initial set of wall images (up to 40 items) from the feed API at build/request time and pass them as props to the Wall client component
2. THE Wall SHALL render immediately with the server-provided images without waiting for any client-side fetch
3. IF the server fetch returns zero items, THE Homepage SHALL fall back to displaying the 10 showcase SVGs from `public/showcase/` as wall content
4. THE Wall SHALL NOT implement infinite scroll or load additional items — it loops the initial set of images continuously
5. Images in the Wall SHALL use `loading="eager"` for the first viewport-worth of cards and `loading="lazy"` for cards initially off-screen

### Requirement 5: Below-the-Wall Content

**User Story:** As a visitor who scrolls past the wall, I want to see more context about the product and a way to browse all content.

#### Acceptance Criteria

1. BELOW the Wall section, THE Homepage SHALL display a brief "How it works" section explaining the product in 3 steps or fewer
2. BELOW the "How it works" section, THE Homepage SHALL display a "Browse all" link/button that navigates to the Feed page (`/feed`)
3. THE below-wall content SHALL have a solid background (not transparent) so it visually separates from the wall above

