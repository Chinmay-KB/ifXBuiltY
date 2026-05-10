/**
 * Dropdown options for the generator form.
 * Builder options come from company-profiles.json.
 * Target options are curated product/service categories.
 */

import companyProfiles from "./company-profiles.json";

export type BuilderOption = {
  id: string;
  name: string;
};

export type TargetOption = {
  id: string;
  name: string;
  category: string;
};

/** All available builders derived from company profiles */
export const BUILDER_OPTIONS: BuilderOption[] = companyProfiles.map((p) => ({
  id: p.id,
  name: p.name,
}));

/** Curated target products/services — two categories:
 * 1. Existing products (reimagine this specific product in the builder's style)
 * 2. Product types (the builder creates a new product in this category)
 */
export const TARGET_OPTIONS: TargetOption[] = [
  // ─── Existing Products & Websites ───
  { id: "linkedin", name: "LinkedIn", category: "Existing Product" },
  { id: "tinder", name: "Tinder", category: "Existing Product" },
  { id: "whatsapp", name: "WhatsApp", category: "Existing Product" },
  { id: "instagram", name: "Instagram", category: "Existing Product" },
  { id: "gmail", name: "Gmail", category: "Existing Product" },
  { id: "jira", name: "Jira", category: "Existing Product" },
  { id: "slack", name: "Slack", category: "Existing Product" },
  { id: "notion", name: "Notion", category: "Existing Product" },
  { id: "spotify", name: "Spotify", category: "Existing Product" },
  { id: "uber", name: "Uber", category: "Existing Product" },
  { id: "amazon", name: "Amazon", category: "Existing Product" },
  { id: "youtube", name: "YouTube", category: "Existing Product" },
  { id: "twitter", name: "Twitter/X", category: "Existing Product" },
  { id: "mygov", name: "mygov.in", category: "Existing Product" },
  { id: "irctc", name: "IRCTC", category: "Existing Product" },
  { id: "zomato", name: "Zomato", category: "Existing Product" },

  // ─── Product Types ───
  { id: "dating-app", name: "Dating App", category: "Product Type" },
  { id: "tax-filing", name: "Tax Filing Portal", category: "Product Type" },
  { id: "dmv", name: "DMV Website", category: "Product Type" },
  { id: "hospital", name: "Hospital Website", category: "Product Type" },
  { id: "pharmacy", name: "Pharmacy App", category: "Product Type" },
  { id: "dental-clinic", name: "Dental Clinic Booking", category: "Product Type" },
  { id: "airport", name: "Airport App", category: "Product Type" },
  { id: "hotel-booking", name: "Hotel Booking", category: "Product Type" },
  { id: "food-delivery", name: "Food Delivery App", category: "Product Type" },
  { id: "school-lms", name: "School LMS", category: "Product Type" },
  { id: "kindergarten", name: "Kindergarten App", category: "Product Type" },
  { id: "meditation-app", name: "Meditation App", category: "Product Type" },
  { id: "funeral-home", name: "Funeral Home Booking", category: "Product Type" },
  { id: "yard-sale", name: "Yard Sale Platform", category: "Product Type" },
  { id: "banking-app", name: "Banking App", category: "Product Type" },
  { id: "ration-card", name: "Ration Card Portal", category: "Product Type" },
  { id: "marriage-portal", name: "Marriage Portal", category: "Product Type" },
  { id: "parking-meter", name: "Parking Meter App", category: "Product Type" },
  { id: "laundromat", name: "Laundromat App", category: "Product Type" },
];
