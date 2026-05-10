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
  "indian-govt": [
    "The Indian Government has 23 different login portals, none of which remember your password.",
    "Every government website has a scrolling marquee. It's in the constitution.",
    "The CAPTCHA on Indian government sites was designed to test human patience, not humanity.",
    "Filing taxes online requires 4 OTPs, 2 browsers, and 1 existential crisis.",
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
  "indian-govt": [
    "Consulting the design committee...",
    "Filing form 27B in triplicate...",
    "Adding mandatory Aadhaar verification...",
    "Translating to 22 official languages...",
    "Inserting scrolling marquee...",
    "Loading... please wait in queue #4,827...",
    "Adding CAPTCHA that even humans can't solve...",
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
  "Pixel-perfecting the parody...",
  "Almost there, hold tight...",
  "Crafting something ridiculous...",
  "This is going to be good...",
  "Rendering an impossible product...",
];

/**
 * Get loading messages for a specific builder.
 * Falls back to generic messages if builder isn't recognized.
 */
export function getLoadingMessages(builder: string): string[] {
  const key = builder.toLowerCase().replace(/\s+/g, "-");
  return LOADING_MESSAGES_BY_BUILDER[key] ?? GENERIC_LOADING_MESSAGES;
}

/**
 * Get a random fun fact for a specific builder.
 * Returns null if no facts are available.
 */
export function getRandomFunFact(builder: string): string | null {
  const key = builder.toLowerCase().replace(/\s+/g, "-");
  const facts = BUILDER_FUN_FACTS[key];
  if (!facts || facts.length === 0) return null;
  return facts[Math.floor(Math.random() * facts.length)];
}
