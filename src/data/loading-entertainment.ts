import companyProfiles from "@/data/company-profiles.json";

/**
 * Loading screen entertainment data.
 * Used during image generation to keep users engaged with
 * funny, prompt-specific messages and fun facts.
 */

/** Fun facts per builder — shown in "While you wait" section */
export const BUILDER_FUN_FACTS: Record<string, string[]> = {
  duolingo: [
    "Duolingo's owl has sent more passive-aggressive notifications than your ex.",
    "The Duolingo owl was originally going to be a parrot, but parrots don't guilt-trip well enough.",
    "Duolingo users collectively lose 2.3 million streaks every Monday morning.",
  ],
  ikea: [
    "IKEA product names are actual Swedish words. KALLAX means 'cold water.' Somehow.",
    "The average IKEA trip takes 2.5 hours. Nobody has ever gone in for 'just one thing.'",
    "IKEA sells approximately 150 million meatballs per year. That's a lot of KÖTTBULLAR.",
  ],
  robinhood: [
    "Robinhood once gave users confetti for buying penny stocks. Peak UX.",
    "The Robinhood app has more green arrows than a Robin Hood movie.",
    "Robinhood's 'free trades' cost the average user $0.00 in fees and $847 in FOMO trades.",
  ],
  linkedin: [
    "LinkedIn has 23 different ways to say 'I got fired' without saying 'I got fired.'",
    "The average LinkedIn post uses the word 'excited' 3.7 times.",
    "Nobody has ever read a LinkedIn notification and thought 'I'm glad I saw that.'",
  ],
  spotify: [
    "Spotify Wrapped is the only time people voluntarily share their guilty pleasures.",
    "There are over 4 billion playlists on Spotify. At least 12 of them are good.",
    "Spotify's algorithm knows your mood better than your therapist.",
  ],
  apple: [
    "Apple has removed more ports than features it's added in the last decade.",
    "The 'Designed in California' text is doing a lot of heavy lifting.",
    "Every Apple keynote uses the word 'magical' at least once. It's contractual.",
  ],

  "google-maps": [
    "Google Maps ETA optimism has caused more missed flights than actual delays.",
  ],
  google: [
    "Google has shut down more products than most companies have launched.",
    "Google's Material Design has more versions than Android itself.",
    "The Google Graveyard has 293 products. And counting.",
  ],
  microsoft: [
    "Microsoft Teams has more features than users who know about them.",
    "Clippy was ahead of his time. He was the first AI assistant nobody asked for.",
    "Excel is technically the world's most popular programming language.",
  ],
  linear: [
    "Linear's keyboard shortcuts have keyboard shortcuts.",
    "Linear loads faster than you can say 'Jira is loading.'",
    "The Linear team probably has a Linear issue for fixing Linear issues.",
  ],
  twitter: [
    "Twitter's character limit was 140 because SMS was 160 and they needed room for usernames.",
    "The fail whale appeared so often it got its own fan art community.",
    "Nobody has ever successfully explained Twitter's algorithm. Including Twitter.",
  ],
  airbnb: [
    "Airbnb's cleaning fees are the plot twist nobody asked for.",
    "The first Airbnb listing was an air mattress. The 'Air' in Airbnb is literal.",
    "Airbnb hosts have 47 different ways to say 'no parties' in their house rules.",
  ],
  facebook: [
    "Facebook was originally called 'TheFacebook.' The 'The' was worth $100 billion apparently.",
    "The Facebook poke feature still exists. Nobody knows why.",
    "Facebook Marketplace is just Craigslist with profile pictures.",
  ],
};

/** Dynamic loading messages — cycled every 3-4 seconds during generation */
export const LOADING_MESSAGES_BY_BUILDER: Record<string, string[]> = {
  duolingo: [
    "Guilt-tripping the AI into finishing...",
    "Adding passive-aggressive notifications...",
    "Calculating your design streak...",
    "The owl is watching. Keep waiting.",
    "Inserting hearts and XP bars...",
  ],
  ikea: [
    "Assembling the interface (instructions unclear)...",
    "Naming every button in Swedish...",
    "Adding 47 assembly steps...",
    "Locating the missing Allen key...",
    "Flat-packing the pixels...",
  ],
  robinhood: [
    "Adding confetti to every interaction...",
    "Making losses look like opportunities...",
    "Gamifying the entire experience...",
    "Inserting 'to the moon' somewhere...",
    "Calculating unrealized gains...",
  ],
  linkedin: [
    "Adding 'Excited to announce' to every element...",
    "Inserting humble-brag microcopy...",
    "Endorsing random skills...",
    "Generating thought leadership...",
    "Connecting with 500+ pixels...",
  ],
  spotify: [
    "Creating a playlist for this moment...",
    "Wrapping your generation in year-end stats...",
    "Adding dark mode and lime accents...",
    "Shuffling the layout (premium only)...",
    "This generation is brought to you by ads...",
  ],
  apple: [
    "Removing unnecessary features...",
    "Adding 'magical' to the copy...",
    "Charging extra for the dongle...",
    "Designing in California...",
    "Making it thinner than last time...",
  ],

  "google-maps": [
    "Google Maps ETA optimism has caused more missed flights than actual delays.",
  ],
  google: [
    "Launching a new product (might kill it later)...",
    "Adding Material You to everything...",
    "A/B testing 41 shades of blue...",
    "Indexing the entire interface...",
    "This feature may be discontinued...",
  ],
  microsoft: [
    "Opening in a new Teams window...",
    "Updating... please don't turn off your device...",
    "Adding a ribbon toolbar...",
    "Clippy wants to help with this...",
    "Syncing with OneDrive (3 of 847 files)...",
  ],
  linear: [
    "Optimizing for keyboard shortcuts...",
    "Loading at unreasonable speed...",
    "Creating sub-issues for sub-issues...",
    "Assigning to the current cycle...",
    "This would never happen in Jira...",
  ],
  twitter: [
    "Posting a hot take...",
    "Adding ratio potential...",
    "Character limit: exceeded...",
    "Going viral (algorithmically)...",
    "Quote-tweeting the design...",
  ],
  airbnb: [
    "Adding a $200 cleaning fee...",
    "Photographing from the best angle...",
    "Writing 14 house rules...",
    "Superhost energy loading...",
    "Check-in instructions: 47 steps...",
  ],
  facebook: [
    "Poking the AI...",
    "Adding to Marketplace...",
    "Your memories from 7 years ago...",
    "Suggesting you tag someone...",
    "Meta-morphing the interface...",
  ],
};

/** Fallback messages when builder isn't in our database */
export const GENERIC_LOADING_MESSAGES = [
  "Exploring parallel timelines...",
  "Generating an alternate universe...",
  "The AI is overthinking this...",
  "Pixel-perfecting the satire...",
  "Almost there, hold tight...",
  "Crafting something ridiculous...",
  "This is going to be good...",
  "Rendering an impossible product...",
];

/** Fallback fun facts when builder-specific facts are unavailable */
export const GENERIC_FUN_FACTS = [
  "The first computer bug was an actual moth found in a Harvard Mark II logbook in 1947.",
  "Ninety percent of startups start as a 'quick idea' that accidentally became someone's full-time job.",
  "Every app eventually adds dark mode, keyboard shortcuts, and one feature users never asked for.",
  "Most viral product ideas sound ridiculous right up until they have 10 million users.",
];

type CatalogProduct = { id: string; name: string };
type CatalogCompany = { id: string; name: string; products?: CatalogProduct[] };

function buildCatalogBackfillFunFacts(): Record<string, string[]> {
  const backfill: Record<string, string[]> = {};
  for (const company of companyProfiles as CatalogCompany[]) {
    if (!BUILDER_FUN_FACTS[company.id]) {
      backfill[company.id] = [
        `${company.name} users can smell an inconsistent border radius from three screens away.`,
        `${company.name} has at least one micro-interaction someone will defend as "core to the experience."`,
        `If this UI feels ${company.name}-ish in under two seconds, the branding team wins.`,
      ];
    }

    for (const product of company.products ?? []) {
      if (!BUILDER_FUN_FACTS[product.id]) {
        backfill[product.id] = [
          `${product.name} fans will absolutely notice if this doesn't feel like ${product.name}.`,
          `${product.name} is where tiny UX choices become full-blown internet discourse.`,
          `Every ${product.name} screen has one detail that looks simple and took twenty design iterations.`,
        ];
      }
    }
  }
  return backfill;
}

const CATALOG_BACKFILL_FUN_FACTS = buildCatalogBackfillFunFacts();

function humanizeProfileId(profileId: string): string {
  return profileId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDynamicFunFacts(builderName: string, builderId?: string): string[] {
  const displayName = builderName.trim() || (builderId ? humanizeProfileId(builderId) : "This product");
  return [
    `${displayName} has a visual language users can recognize before they read a single word.`,
    `${displayName} probably ships one tiny "quality of life" tweak every week that nobody writes release notes for.`,
    `${displayName} proves that copy tone and spacing can feel like product features.`,
  ];
}

function mergeFactLists(...lists: Array<string[] | undefined>): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const fact of list ?? []) {
      if (seen.has(fact)) continue;
      seen.add(fact);
      merged.push(fact);
    }
  }
  return merged;
}

function getFunFacts(builder: string, builderId?: string): string[] {
  const dynamicFacts = buildDynamicFunFacts(builder, builderId);
  if (builderId) {
    const directFacts = BUILDER_FUN_FACTS[builderId];
    const directBackfill = CATALOG_BACKFILL_FUN_FACTS[builderId];
    const mergedDirect = mergeFactLists(directFacts, directBackfill, dynamicFacts, GENERIC_FUN_FACTS);
    if (mergedDirect.length > 0) return mergedDirect;
  }
  const key = resolveEntertainmentKey(builder, builderId);
  return mergeFactLists(
    BUILDER_FUN_FACTS[key],
    CATALOG_BACKFILL_FUN_FACTS[key],
    dynamicFacts,
    GENERIC_FUN_FACTS,
  );
}

/**
 * Get loading messages for a specific builder.
 * Falls back to generic messages if builder isn't recognized.
 */

/**
 * Resolve lookup key for fun facts / loading copy.
 * Products fall back to parent company slug prefix (e.g. google-maps → google).
 */
export function resolveEntertainmentKey(builderName: string, builderId?: string): string {
  if (builderId) {
    if (BUILDER_FUN_FACTS[builderId] || LOADING_MESSAGES_BY_BUILDER[builderId]) {
      return builderId;
    }
    const dash = builderId.indexOf("-");
    if (dash > 0) {
      const parent = builderId.slice(0, dash);
      if (BUILDER_FUN_FACTS[parent] || LOADING_MESSAGES_BY_BUILDER[parent]) {
        return parent;
      }
    }
  }
  return builderName.toLowerCase().replace(/\s+/g, "-");
}

export function getLoadingMessages(builder: string, builderId?: string): string[] {
  const key = resolveEntertainmentKey(builder, builderId);
  return LOADING_MESSAGES_BY_BUILDER[key] ?? GENERIC_LOADING_MESSAGES;
}

/**
 * Get a random fun fact for a specific builder.
 * Returns null if no facts are available.
 */
export function getRandomFunFact(builder: string, builderId?: string): string | null {
  const facts = getFunFacts(builder, builderId);
  if (!facts || facts.length === 0) return null;
  return facts[Math.floor(Math.random() * facts.length)];
}

/**
 * Get all fun facts for a specific builder.
 * Returns empty array if none available.
 */
export function getAllFunFacts(builder: string, builderId?: string): string[] {
  return getFunFacts(builder, builderId);
}
