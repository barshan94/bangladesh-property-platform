import type { Metadata } from "next";
import { PageIntro, PageShell } from "@/components/page-shell";
import { PropertyCatalogue } from "@/components/property-catalogue";
import { publishedListings } from "@/data/listings";

export const metadata: Metadata = {
  title: "Properties",
  description: "Search published property listings in Bangladesh. Listings are subject to moderation and are not legal title certificates.",
};

export default function PropertiesPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="PROPERTY DISCOVERY"
        title="Explore property opportunities in Bangladesh."
        description="Search the public catalogue by location, property type and budget. Only approved public listings are displayed."
      />
      <div className="container section-pad">
        <PropertyCatalogue listings={publishedListings} />
      </div>
    </PageShell>
  );
}
