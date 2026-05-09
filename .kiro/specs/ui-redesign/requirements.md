# Requirements Document

## Introduction

A complete UI redesign of the ifXBuiltY website — a parody screenshot generator where users combine a "builder" (company/brand) with a "target" (product) to generate funny fake screenshots. The redesign prioritizes a community-first, feed-forward experience that showcases user-generated content front and center, with a dedicated generation/remix flow that keeps users engaged during AI image generation wait times. The design language should be fresh, playful, and meme-native — not bound to the current design system.

## Glossary

- **Homepage**: The primary landing page that showcases community-generated combinations and invites engagement
- **Feed_Screen**: A browsable, filterable view of all published generations
- **Generation_Flow**: The dedicated multi-step experience for creating new AI-generated parody screenshots
- **Remix_Flow**: A variant of the Generation_Flow that starts pre-filled from an existing generation
- **Card**: A visual unit in the feed representing one published generation (image, metadata, actions)
- **Builder**: The company, brand, institution, or entity whose design DNA is applied to the target
- **Target**: The product, app, or service being reimagined by the builder
- **Vote_Controls**: The upvote/downvote interaction elements on a Card
- **Engagement_Hook**: A UI mechanism that keeps users entertained during generation wait times (slideshow, fun facts, loading animations)
- **Filter_Bar**: A control surface for sorting and filtering feed content (trending, newest, categories)
- **Masonry_Layout**: A Pinterest-style grid where cards of varying heights tile without fixed row alignment
- **Action_Bar**: A compact set of interaction controls (remix, download, share, vote) attached to a Card
- **Loading_State**: The visual experience shown while AI generation is in progress
- **Navigation_Shell**: The persistent top-level navigation structure across all screens

## Requirements

### Requirement 1: Homepage Community Showcase

**User Story:** As a visitor, I want to see a rich gallery of user-generated combinations immediately on landing, so that I understand the product's value and feel compelled to engage.

#### Acceptance Criteria

1. WHEN a visitor loads the Homepage, THE Homepage SHALL display a grid of published generation Cards that have visibility "published" and moderation_status "visible", positioned so that the grid begins within the initial viewport on desktop (no scroll required to see the first row)
2. WHEN the Homepage loads on a desktop viewport of at least 1280px width, THE Homepage SHALL present at least 12 generation Cards in the initial viewport without requiring scroll
3. WHEN a visitor views the Homepage, THE Homepage SHALL display on each visible Card an upvote button, a downvote button, a remix action that navigates to the remix flow for that Card, and a download action that initiates a download of the Card image
4. THE Homepage SHALL include a call-to-action element with a minimum tap target of 44×44 px that navigates to the Generation_Flow when activated
5. WHEN a visitor scrolls past the last visible Card on the Homepage, THE Homepage SHALL load the next batch of up to 20 additional Cards and append them below the existing Cards without a full page reload
6. WHEN the Homepage loads, THE Homepage SHALL display Cards ordered by trending sort (net_score descending, then created_at descending) as the default ordering
7. WHEN a visitor activates an upvote or downvote control on a Card on the Homepage, THE Homepage SHALL immediately increment or decrement the displayed vote count before the server response is received, and revert the count if the server returns an error
8. IF the feed API returns an error or zero published Cards when loading the Homepage, THEN THE Homepage SHALL display an empty-state message indicating no content is available and a call-to-action linking to the Generation_Flow

### Requirement 2: Feed Screen with Filtering

**User Story:** As a browsing user, I want to filter and sort community generations by different criteria, so that I can discover content that matches my interests.

#### Acceptance Criteria

1. THE Feed_Screen SHALL display a Filter_Bar with the following sort options: Trending, Newest, and Top (all-time), where Trending ranks items by net_score weighted toward recency within the last 7 days, Newest orders by creation date descending, and Top orders by net_score descending regardless of date
2. WHEN a user selects a sort option, THE Feed_Screen SHALL update the displayed Cards to reflect the selected sort order via client-side navigation without a full page reload
3. THE Feed_Screen SHALL support filtering by Builder category, allowing the user to select one or more Builder values from the set of distinct builder values present in published generations
4. THE Feed_Screen SHALL support filtering by Target category, allowing the user to select one or more Target values from the set of distinct target values present in published generations
5. WHEN both Builder and Target filters are active simultaneously, THE Feed_Screen SHALL display only Cards matching at least one selected Builder AND at least one selected Target (intersection logic)
6. WHEN no results match the active filters, THE Feed_Screen SHALL display an empty state message with a prompt to broaden filters or navigate to the generation screen
7. THE Feed_Screen SHALL render Cards in a multi-column grid layout with 2 columns at viewports 640px and above, 3 columns at 1024px and above, and 5 columns at 1280px and above
8. WHEN viewed on a viewport below 640px width, THE Feed_Screen SHALL render Cards in a single-column layout where card images span the full container width
9. THE Feed_Screen SHALL support infinite scroll that loads the next batch of 20 Cards when the user scrolls within 300px of the bottom of the currently loaded content
10. WHEN additional Cards are being fetched during infinite scroll, THE Feed_Screen SHALL display a loading indicator below the existing Cards
11. IF no additional Cards remain to be loaded, THEN THE Feed_Screen SHALL not trigger further fetch requests and SHALL display no loading indicator

### Requirement 3: Card Design and Interactions

**User Story:** As a user browsing the feed, I want each generation card to be visually compelling and interactive, so that I can quickly engage with content I find interesting.

#### Acceptance Criteria

1. THE Card SHALL display the generated image as the dominant visual element, occupying at least 70% of the Card's total rendered height
2. THE Card SHALL display the Builder and Target names in the format "{Builder} built {Target}", truncated with an ellipsis if the combined label exceeds 60 characters
3. THE Card SHALL display the current net vote score (upvotes minus downvotes) formatted as a compact number (e.g., "1.2k" for 1200)
4. THE Card SHALL include an Action_Bar containing remix, download, and share actions, hidden by default on desktop viewports (screen width 1024px and above)
5. WHEN a user hovers over a Card on a desktop viewport, THE Card SHALL reveal the Action_Bar with a fade-in transition completing within 200ms
6. WHEN a user moves the pointer away from a Card on a desktop viewport, THE Card SHALL hide the Action_Bar with a fade-out transition completing within 150ms
7. WHEN a user taps a Card on a mobile viewport (screen width below 1024px), THE Card SHALL navigate to the full generation detail page at the path /g/{slug}
8. IF the generation has been remixed at least once, THEN THE Card SHALL display the remix count as a visible numeric label
9. IF the generated image fails to load or is unavailable, THEN THE Card SHALL display a placeholder background with the Builder and Target label as the primary visual element

### Requirement 4: Generation Flow — Dedicated Experience

**User Story:** As a creator, I want a focused, dedicated generation flow separate from the feed, so that I can concentrate on crafting my combination without distraction.

#### Acceptance Criteria

1. WHEN a user navigates to the Generation_Flow, THE Generation_Flow SHALL present Builder and Target text inputs as the primary input controls, each pre-populated with a default value
2. THE Generation_Flow SHALL provide optional secondary controls for tone, screen type, region, and extra details, each pre-populated with a default selection
3. WHEN a user has entered non-empty, non-whitespace text in both the Builder and Target fields, THE Generation_Flow SHALL enable the Generate action
4. IF either the Builder or Target field is empty or contains only whitespace, THEN THE Generation_Flow SHALL keep the Generate action disabled
5. WHILE the user has not signed in, THE Generation_Flow SHALL replace the Generate action with a "Sign in to generate" prompt that navigates to the login flow
6. WHEN a user initiates generation, THE Generation_Flow SHALL disable the Generate action, display a loading indicator label on the Generate button, and show a progress message in the preview area until the generation completes or fails
7. IF generation fails due to a network or server error, THEN THE Generation_Flow SHALL display an inline error message indicating the failure reason and re-enable the Generate action
8. THE Generation_Flow SHALL be accessible via a dedicated route (not embedded in the Homepage)

### Requirement 5: Generation Wait Time Engagement

**User Story:** As a user waiting for my generation to complete, I want to be entertained and informed, so that the wait feels short and I stay on the page.

#### Acceptance Criteria

1. WHILE generation is in progress, THE Loading_State SHALL display a slideshow of existing showcase generations that rotates every 5 seconds, cross-fading between items with a transition duration of no more than 700 milliseconds
2. IF no showcase generations are available, THEN THE Loading_State SHALL display a static branded placeholder image instead of the slideshow
3. WHILE generation is in progress, THE Loading_State SHALL display rotating microcopy messages that cycle every 5 seconds, where each message is a short humorous status phrase (e.g., "Overthinking the interface...", "Adding unnecessary gradients...", "Consulting the brand guidelines...")
4. WHILE generation is in progress, THE Loading_State SHALL display an indeterminate progress indicator visible to the user throughout the wait
5. WHEN generation completes successfully, THE Loading_State SHALL transition to the result view with an animation lasting no more than 500 milliseconds
6. IF generation fails, THEN THE Loading_State SHALL display an error message indicating the failure reason, provide a retry action, and preserve all user-entered form inputs (builder, target, tone, screen type, region, and extra details)
7. IF the user activates the retry action after a generation failure, THEN THE Loading_State SHALL re-submit the generation request using the preserved form inputs

### Requirement 6: Generation Result View

**User Story:** As a creator who just generated an image, I want to see my result prominently with easy access to sharing and iteration actions, so that I can quickly share or refine my creation.

#### Acceptance Criteria

1. WHEN generation completes, THE Generation_Flow SHALL display the generated image at full available workspace width with a maximum rendered height of 600px, preserving aspect ratio via object-fit contain
2. WHILE a generation result is displayed, THE Generation_Flow SHALL display action controls (share, download, publish, remix) as icon or icon-label pills within the same visual container as the generated image
3. WHILE a generation result is displayed, THE Generation_Flow SHALL display the Builder and Target combination as a title in the format "if [Builder] built [Target]" above the generated image
4. WHEN a user selects the publish action, THE Generation_Flow SHALL publish the generation to the public Feed_Screen and display a link to the published public page upon success
5. IF the publish action fails, THEN THE Generation_Flow SHALL display an error message indicating the failure reason and keep the generation result and unpublished state intact
6. WHEN a user selects the remix action on their own result, THE Generation_Flow SHALL navigate to the remix input state with builder, target, tone, screen type, region, and extra details pre-filled from the current generation
7. THE Generation_Flow SHALL provide a "Generate another" action that clears the generated result and resets all form fields to their default values, returning to the empty input state
8. WHEN a user modifies any input field (builder, target, tone, screen type, region, or extra details) after generation completes, THE Generation_Flow SHALL enable a "Regenerate" action that submits a new generation using the updated field values

### Requirement 7: Remix Flow

**User Story:** As a user inspired by someone else's generation, I want to remix it with my own twist, so that I can participate in the creative loop with minimal effort.

#### Acceptance Criteria

1. WHEN a user initiates a remix from a Card or generation detail page, THE Remix_Flow SHALL open the Generation_Flow with Builder, Target, tone, screen type, region, and extra details pre-filled from the source generation
2. WHILE the Remix_Flow is open, THE Remix_Flow SHALL display a "Remixing from..." attribution strip showing the source generation's composed label (in the format "if [builder] built [target]") and image thumbnail
3. WHEN a user submits a remixed generation for image creation, THE Remix_Flow SHALL save the remix relationship by storing the parent generation identifier on the newly created generation record
4. WHILE the Remix_Flow is open, THE Remix_Flow SHALL allow the user to modify any pre-filled field (Builder, Target, tone, screen type, region, extra details) before generating
5. IF the source generation is no longer published or visible when the user submits the remix, THEN THE Remix_Flow SHALL display an error message indicating the source is unavailable and SHALL NOT create the generation

### Requirement 8: Navigation and Information Architecture

**User Story:** As a user, I want clear and consistent navigation across all screens, so that I can move between browsing, generating, and my own content without confusion.

#### Acceptance Criteria

1. THE Navigation_Shell SHALL be persistent and fixed at the top of the viewport across all screens, and include links to the Homepage, Feed_Screen, and Generation_Flow
2. THE Navigation_Shell SHALL display the user's sign-in state: when signed in, the user's avatar and display name (truncated to 20 characters maximum); when signed out, a sign-in action that opens the authentication modal
3. WHILE the viewport width is less than 768px, THE Navigation_Shell SHALL render as a bottom navigation bar with icon-based tabs instead of the top navigation
4. THE Navigation_Shell SHALL visually distinguish the currently active section by applying a distinct text color or weight change to the active link, differentiating it from inactive links

### Requirement 9: Visual Design Language

**User Story:** As a user, I want the interface to feel playful, meme-native, and visually distinct from generic AI tools, so that the experience matches the product's irreverent personality.

#### Acceptance Criteria

1. THE Homepage SHALL use the display typeface (Archivo Black) at a minimum rendered size of 24px for headlines, distinguishing headline text from body text set in the sans-serif body typeface (Inter)
2. THE Navigation_Shell SHALL limit its own chrome to neutral tones (canvas, panel, ink, line tokens) so that generated images and accent-colored elements carry the highest color contrast on screen
3. THE Card SHALL apply a border-radius of at least 7px, a box-shadow elevation no larger than 4px blur, and a CSS hover transition completing within 200ms
4. THE Loading_State SHALL display contextual copy or illustration specific to the generation action (e.g., progress text describing the current operation) rather than an unlabeled indeterminate spinner
5. THE Generation_Flow SHALL use micro-interactions (transitions, state changes) that complete within 200ms for user-initiated actions
6. THE Homepage SHALL include at least one continuously cycling motion element (e.g., rotating showcase of generated images with crossfade transitions) that updates on a fixed interval
7. WHILE the user's operating system reports a preference for reduced motion, THE system SHALL disable or replace all auto-playing animations with static equivalents and set transition durations to 0ms

### Requirement 10: Responsive Design

**User Story:** As a user on any device, I want the interface to adapt gracefully to my screen size, so that I have a quality experience whether on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHILE the viewport width is ≥1024px (desktop), THE Homepage SHALL display a Masonry_Layout with 3 or more columns; WHILE the viewport width is 768px–1023px (tablet), THE Homepage SHALL display a two-column Masonry_Layout; WHILE the viewport width is <768px (mobile), THE Homepage SHALL display a single-column layout
2. WHILE the viewport width is <768px, THE Generation_Flow SHALL stack its input controls vertically in a single column
3. WHILE the viewport width is 768px–1023px, THE Feed_Screen SHALL display a two-column Masonry_Layout
4. THE Card SHALL scale its image and typography across breakpoints such that body text remains at least 14px and Card images span the full column width at every breakpoint
5. WHILE the viewport width is <768px, THE Action_Bar SHALL render all interactive elements with a minimum touch-target size of 44×44px and a minimum spacing of 8px between adjacent targets
6. WHILE the viewport width is <768px, THE Navigation_Shell, Homepage, Feed_Screen, and Generation_Flow SHALL render without horizontal overflow or horizontal scrolling
