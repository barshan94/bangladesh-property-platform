import test from "node:test";
import assert from "node:assert/strict";
import { filterPropertyListings } from "../src/lib/property-filters.mjs";

const listings = [
  {
    reference: "BPP-ABC123", title: "Gulshan apartment", description: "Family flat",
    district: "Dhaka", locality: "Gulshan", publicLocationLabel: "Gulshan, Dhaka",
    propertyType: "apartment", listingKind: "sale", priceAmount: 12500000,
    areaValue: 1800, areaUnit: "sqft", bedrooms: 3, bathrooms: 3,
    trustLabels: ["listing-reviewed", "seller-identity-checked"],
  },
  {
    reference: "BPP-DEF456", title: "Agricultural land", description: "Open plot",
    district: "Narayanganj", locality: "Rupganj", publicLocationLabel: "Rupganj, Narayanganj",
    propertyType: "land", listingKind: "sale", priceAmount: 4200000,
    areaValue: 12, areaUnit: "decimal", trustLabels: ["listing-reviewed"],
  },
  {
    reference: "BPP-GHI789", title: "Uttara rental home", description: "Three bedroom house",
    district: "Dhaka", locality: "Uttara", publicLocationLabel: "Uttara, Dhaka",
    propertyType: "house", listingKind: "rent", priceAmount: null,
    bedrooms: 3, bathrooms: 2, trustLabels: [],
  },
];

test("catalogue filters combine keyword, district, type and listing purpose", () => {
  const result = filterPropertyListings(listings, {
    keyword: "gulshan", district: "Dhaka", propertyType: "apartment", listingKind: "sale",
  });
  assert.deepEqual(result.map((listing) => listing.reference), ["BPP-ABC123"]);
});

test("price range excludes listings without a declared price", () => {
  const result = filterPropertyListings(listings, { minimumPrice: "5000000", maximumPrice: "13000000" });
  assert.deepEqual(result.map((listing) => listing.reference), ["BPP-ABC123"]);
});

test("area filters require a matching unit and never compare unlike units", () => {
  assert.deepEqual(filterPropertyListings(listings, { minimumArea: "10", areaUnit: "decimal" }).map((x) => x.reference), ["BPP-DEF456"]);
  assert.deepEqual(filterPropertyListings(listings, { minimumArea: "10" }), []);
});

test("bedroom and bathroom filters exclude listings with missing facts", () => {
  assert.deepEqual(filterPropertyListings(listings, { minimumBedrooms: "3", minimumBathrooms: "3" }).map((x) => x.reference), ["BPP-ABC123"]);
});

test("evidence status filter uses only the listing's recorded trust labels", () => {
  assert.deepEqual(filterPropertyListings(listings, { trustLabel: "seller-identity-checked" }).map((x) => x.reference), ["BPP-ABC123"]);
  assert.deepEqual(filterPropertyListings(listings, { trustLabel: "title-verified" }), []);
});

test("invalid negative numeric filters are ignored rather than excluding valid listings", () => {
  assert.equal(filterPropertyListings(listings, { minimumPrice: "-1" }).length, listings.length);
});
