"use client";

import { useMemo, useState } from "react";
import type { PropertyListing, PropertyType } from "@/types/property";

const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  land: "Land",
  commercial: "Commercial",
  industrial: "Industrial",
  other: "Other",
};

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export function PropertyCatalogue({ listings, loadError = false }: { listings: PropertyListing[]; loadError?: boolean }) {
  const [keyword, setKeyword] = useState("");
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingKind, setListingKind] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");

  const districts = useMemo(
    () => [...new Set(listings.map((listing) => listing.district))].sort(),
    [listings],
  );

  const filteredListings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    const maxPrice = maximumPrice === "" ? undefined : Number(maximumPrice);

    return listings.filter((listing) => {
      const searchable = [
        listing.title,
        listing.description,
        listing.district,
        listing.upazila ?? "",
        listing.locality ?? "",
        listing.publicLocationLabel,
      ].join(" ").toLocaleLowerCase();

      return (
        (!normalizedKeyword || searchable.includes(normalizedKeyword)) &&
        (!district || listing.district === district) &&
        (!propertyType || listing.propertyType === propertyType) &&
        (!listingKind || listing.listingKind === listingKind) &&
        (maxPrice === undefined || (Number.isFinite(maxPrice) && listing.priceAmount <= maxPrice))
      );
    });
  }, [district, keyword, listingKind, listings, maximumPrice, propertyType]);

  const hasFilters = Boolean(keyword || district || propertyType || listingKind || maximumPrice);

  function clearFilters() {
    setKeyword("");
    setDistrict("");
    setPropertyType("");
    setListingKind("");
    setMaximumPrice("");
  }

  return (
    <section className="catalogue-section" aria-labelledby="catalogue-heading">
      <div className="catalogue-heading-row">
        <div>
          <span className="eyebrow">PUBLIC PROPERTY CATALOGUE</span>
          <h2 id="catalogue-heading">Find a property</h2>
          <p>Search published listings. Only properties approved for public display appear here.</p>
        </div>
        <span className="catalogue-count" aria-live="polite">
          {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
        </span>
      </div>

      <div className="catalogue-filters" role="search" aria-label="Filter property listings">
        <div className="catalogue-field catalogue-keyword">
          <label htmlFor="property-keyword">Keyword or location</label>
          <input
            id="property-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="e.g. Gulshan, land, apartment"
            autoComplete="off"
          />
        </div>
        <div className="catalogue-field">
          <label htmlFor="property-district">District</label>
          <select id="property-district" value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="">All districts</option>
            {districts.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
        <div className="catalogue-field">
          <label htmlFor="property-type">Property type</label>
          <select id="property-type" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
            <option value="">All types</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="catalogue-field">
          <label htmlFor="listing-kind">Purpose</label>
          <select id="listing-kind" value={listingKind} onChange={(event) => setListingKind(event.target.value)}>
            <option value="">Buy or rent</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>\n            <option value="lease">For lease</option>
          </select>
        </div>
        <div className="catalogue-field">
          <label htmlFor="maximum-price">Maximum price (BDT)</label>
          <input
            id="maximum-price"
            type="number"
            min="0"
            inputMode="numeric"
            value={maximumPrice}
            onChange={(event) => setMaximumPrice(event.target.value)}
            placeholder="No limit"
          />
        </div>
        {hasFilters && <button className="catalogue-clear" type="button" onClick={clearFilters}>Clear filters</button>}
      </div>

      {loadError ? (\n        <div className="catalogue-empty" role="alert"><span className="eyebrow">CATALOGUE UNAVAILABLE</span><h3>We could not load published properties.</h3><p>Please try again later. No listing data has been changed.</p></div>\n      ) : filteredListings.length > 0 ? (
        <div className="listing-grid">
          {filteredListings.map((listing) => (
            <article className="listing-card" key={listing.reference}>
              <a className="listing-card-link" href={`/properties/${encodeURIComponent(listing.reference)}`}>
                {listing.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="listing-image" src={listing.images[0].src} alt={listing.images[0].alt} />
                ) : (
                  <div className="listing-image-placeholder" aria-label="No property image supplied">Property image unavailable</div>
                )}
                <div className="listing-card-content">
                  <span className="listing-type">{propertyTypeLabels[listing.propertyType]} · {listing.listingKind === "sale" ? "For sale" : listing.listingKind === "rent" ? "For rent" : "For lease"}</span>
                  <h3>{listing.title}</h3>
                  <p className="listing-location">{listing.publicLocationLabel}</p>
                  <strong className="listing-price">{listing.priceAmount === null ? "Price not provided" : money.format(listing.priceAmount)}{listing.priceNegotiable ? " · Negotiable" : ""}</strong>
                  {listing.areaValue && listing.areaUnit && (
                    <span className="listing-area">{listing.areaValue.toLocaleString("en-BD")} {listing.areaUnit}{listing.areaBasis ? ` · ${listing.areaBasis.replaceAll("_", " ")} area` : ""}</span>
                  )}
                </div>
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="catalogue-empty" role="status">
          <div className="empty-icon" aria-hidden="true">⌂</div>
          <div>
            <span className="eyebrow">{listings.length === 0 ? "CATALOGUE IN PREPARATION" : "NO MATCHES FOUND"}</span>
            <h3>{listings.length === 0 ? "No properties are published yet." : "No listings match these filters."}</h3>
            <p>
              {listings.length === 0
                ? "We will publish real listings only after seller authority and publication checks are completed. No sample properties are being presented as real inventory."
                : "Try changing your search or clearing the filters. A missing result does not mean a property is unavailable in the market."}
            </p>
          </div>
          {hasFilters && <button className="button button-dark" type="button" onClick={clearFilters}>Clear filters</button>}
          <a className="button button-outline-dark" href="/contact">Discuss your property requirement</a>
        </div>
      )}
      <p className="catalogue-disclaimer">
        Listing publication means the content passed platform moderation. It is not a legal title certificate or a guarantee of ownership, condition or freedom from disputes.
      </p>
    </section>
  );
}
