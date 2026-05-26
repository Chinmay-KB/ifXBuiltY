#!/usr/bin/env node
/**
 * Validates src/data/company-profiles.json
 * Reports: company count, product count, duplicate IDs, missing screenType, slug format issues
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const profilesPath = join(__dirname, "..", "src", "data", "company-profiles.json");

const raw = readFileSync(profilesPath, "utf-8");
const companies = JSON.parse(raw);

const allProductIds = new Set();
const allCompanyIds = new Set();
let issues = 0;

function warn(msg) {
  issues++;
  console.warn(`  ⚠ ${msg}`);
}

console.log(`\nValidating: ${profilesPath}\n`);

for (const company of companies) {
  // Company-level checks
  if (!company.id || typeof company.id !== "string") {
    warn(`Company missing id: ${JSON.stringify(company).slice(0, 80)}`);
    continue;
  }
  if (allCompanyIds.has(company.id)) {
    warn(`Duplicate company id: "${company.id}"`);
  }
  allCompanyIds.add(company.id);

  if (!company.name || typeof company.name !== "string") {
    warn(`Company "${company.id}" missing name`);
  }

  // Slug format: lowercase, hyphens allowed
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(company.id)) {
    warn(`Company id "${company.id}" does not match slug format (lowercase-hyphen)`);
  }

  // Product-level checks
  if (!Array.isArray(company.products) || company.products.length === 0) {
    warn(`Company "${company.id}" has no products array`);
    continue;
  }

  for (const product of company.products) {
    if (!product.id || typeof product.id !== "string") {
      warn(`Product in "${company.id}" missing id`);
      continue;
    }
    if (allProductIds.has(product.id)) {
      warn(`Duplicate product id: "${product.id}" (also in another company)`);
    }
    allProductIds.add(product.id);

    if (!product.name || typeof product.name !== "string") {
      warn(`Product "${product.id}" in "${company.id}" missing name`);
    }

    if (!product.screenType || typeof product.screenType !== "string") {
      warn(`Product "${product.id}" in "${company.id}" missing screenType`);
    }

    // Product slug should start with company id or be a known standalone
    const expectedPrefix = company.id;
    if (!product.id.startsWith(expectedPrefix + "-") && product.id !== company.id) {
      warn(`Product "${product.id}" in "${company.id}" does not start with "${company.id}-"`);
    }
  }
}

// Summary
console.log(`Companies: ${companies.length}`);
console.log(`Total products: ${allProductIds.size}`);
console.log(`Unique company IDs: ${allCompanyIds.size}`);
console.log(`Unique product IDs: ${allProductIds.size}`);
console.log(`\nIssues found: ${issues}`);

if (issues === 0) {
  console.log("\n✅ All checks passed");
} else {
  console.log(`\n❌ ${issues} issue(s) to fix`);
  process.exit(1);
}
