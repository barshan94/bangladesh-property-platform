import Link from "next/link";
import { InquiryForm } from "@/app/contact/inquiry-form";
import { getPublishedListings } from "@/lib/public-listings";
import type { PropertyListing } from "@/types/property";

const services = [
  {
    number: "01",
    title: "Property title & record review",
    description:
      "Coordinate a scoped review of available ownership records and supporting documents with the appropriate local professionals.",
  },
  {
    number: "02",
    title: "Buying & selling assistance",
    description:
      "Get help understanding the process, organizing documents and coordinating the next steps for a property transaction.",
  },
  {
    number: "03",
    title: "Transfer & mutation support",
    description:
      "Request assistance navigating property transfer and mutation procedures, subject to case review.",
  },
  {
    number: "04",
    title: "Inheritance & partition",
    description:
      "Discuss inherited or jointly owned property matters and identify the right professional support.",
  },
  {
    number: "05",
    title: "Property disputes",
    description:
      "Explain a developer, landlord, tenant or other property dispute and request an initial evaluation.",
  },
  {
    number: "06",
    title: "Remote property assistance",
    description:
      "Explore local inspection, document coordination and owner-support options when available.",
  },
];

const steps = [
  ["01", "Tell us what you need", "Share the property location, your situation and the type of help you are looking for."],
  ["02", "We review the request", "The team checks the request, service availability and whether specialist legal review is needed."],
  ["03", "Agree on the scope", "You receive a clear explanation of the proposed next steps, responsibilities and applicable fees before proceeding."],
  ["04", "Stay informed", "Where a service is accepted, updates are shared through the agreed communication channel."],
];

const faqs = [
  {
    question: "Can I manage a property in Bangladesh while living abroad?",
    answer:
      "Depending on the location and service availability, you may request local inspection, document coordination or other owner-support assistance. The exact scope must be agreed before work begins.",
  },
  {
    question: "Does a published property listing mean its title is verified?",
    answer:
      "No. Listing moderation and legal title verification are separate processes. Any review must state what records were checked, by whom, when and with what limitations.",
  },
  {
    question: "Can a foreign national buy property in Bangladesh?",
    answer:
      "Eligibility depends on the person's legal status and the proposed transaction. Do not rely on a general website statement; obtain case-specific advice from qualified Bangladesh counsel before making commitments.",
  },
  {
    question: "Can I submit documents from overseas?",
    answer:
      "The planned service intake will support confidential document submission. Do not email sensitive identity or ownership documents until a secure submission channel and its privacy terms are available.",
  },
];

function Brand() {
  return (
    <a className="brand" href="#" aria-label="Bangladesh Property Platform home">
      <span className="brand-mark">B</span>
      <span className="brand-copy">
        <strong>PROPERTY<span> BD</span></strong>
        <small>LOCAL KNOWLEDGE. CLEARER PROPERTY DECISIONS.</small>
      </span>
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

const propertyTypeLabels: Record<PropertyListing["propertyType"], string> = {
  apartment: "Apartment", house: "House", land: "Land", commercial: "Commercial", industrial: "Industrial", other: "Other",
};

const listingMoney = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

export default async function Home() {
  const { listings, error } = await getPublishedListings();
  const featuredListings = listings.slice(0, 3);
  return (
    <main>
      <div className="topline">
        <div className="container topline-inner">
          <span>Bangladesh property support, wherever you are</span>
          <a href="#contact">Talk to our team <span aria-hidden="true">↗</span></a>
        </div>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#properties">Properties</a>
            <a href="#services">Services</a>
            <a href="#process">How it works</a>
            <a href="#insights">Insights</a>
            <a href="#about">About</a>
          </nav>
          <div className="header-actions"><a className="header-account-link" href="/login">Sign in</a><a className="button button-dark header-cta" href="#contact">Contact an expert</a></div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light">PROPERTY IN BANGLADESH. SUPPORT THAT COMES CLOSER.</span>
            <h1>Your property matters. <em>We help you move forward.</em></h1>
            <p>
              Explore property opportunities and find coordinated local support
              for ownership, documentation and property matters — whether you
              live in Bangladesh or overseas.
            </p>
            <div className="hero-actions">
              <a className="button button-gold" href="#properties">Explore properties <span aria-hidden="true">↗</span></a>
              <a className="button button-outline" href="#contact">Speak to an expert</a>
            </div>
            <div className="hero-note">
              <span className="note-dot" />
              Clear scope. Human review. No promises without evidence.
            </div>
          </div>
          <div className="hero-aside">
            <div className="hero-card">
              <span className="card-kicker">ONE PLACE TO START</span>
              <div className="hero-card-line" />
              <a href="#properties"><span>01</span><strong>Find a property</strong><b>↗</b></a>
              <a href="#services"><span>02</span><strong>Understand your options</strong><b>↗</b></a>
              <a href="#contact"><span>03</span><strong>Talk through your case</strong><b>↗</b></a>
              <div className="hero-card-foot">BANGLADESH PROPERTY PLATFORM</div>
            </div>
          </div>
        </div>
        <div className="hero-bottom container">
          <span>REAL ESTATE</span><span>PROPERTY SERVICES</span><span>REMOTE OWNER SUPPORT</span>
        </div>
      </section>

      <section className="intro section-pad" id="about">
        <div className="container intro-grid">
          <div>
            <span className="eyebrow">A MORE CONNECTED APPROACH</span>
            <h2>Property is local.<br /><em>Your life may not be.</em></h2>
          </div>
          <div className="intro-copy">
            <p>
              Distance can make property decisions harder. Records may be
              difficult to coordinate, a site visit may not be practical, and
              knowing who to contact can take time.
            </p>
            <p>
              Our goal is to connect property discovery with practical,
              clearly scoped assistance in Bangladesh — with transparent
              processes and qualified human review where it matters.
            </p>
            <a className="text-link" href="#process">See how the process works <span>→</span></a>
          </div>
        </div>
      </section>

      <section className="properties section-pad" id="properties">
        <div className="container">
          <div className="properties-heading">
            <SectionHeading
              eyebrow="PROPERTY DISCOVERY"
              title="Find your next opportunity."
              description="Explore properties that have completed the platform&apos;s publication review. Listing publication is separate from legal title verification."
            />
            <Link className="text-link" href="/properties">Browse all properties <span>→</span></Link>
          </div>
          {error ? (
            <div className="catalogue-empty" role="alert">
              <span className="eyebrow">CATALOGUE UNAVAILABLE</span>
              <h3>We could not load published properties.</h3>
              <p>Please try again later. No listing data has been changed.</p>
              <Link className="button button-dark" href="/properties">Open property catalogue</Link>
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="listing-grid">
              {featuredListings.map((listing) => (
                <article className="listing-card" key={listing.reference}>
                  <Link className="listing-card-link" href={`/properties/${encodeURIComponent(listing.reference)}`}>
                    {listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="listing-image" src={listing.images[0].src} alt={listing.images[0].alt} />
                    ) : (
                      <div className="listing-image-placeholder" aria-label="No property image supplied">Property image unavailable</div>
                    )}
                    <div className="listing-card-content">
                      <span className="listing-type">
                        {propertyTypeLabels[listing.propertyType]} · {listing.listingKind === "sale" ? "For sale" : listing.listingKind === "rent" ? "For rent" : "For lease"}
                      </span>
                      <h3>{listing.title}</h3>
                      <p className="listing-location">{listing.publicLocationLabel}</p>
                      <strong className="listing-price">
                        {listing.priceAmount === null ? "Price not provided" : listingMoney.format(listing.priceAmount)}
                      </strong>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalogue-empty" role="status">
              <div className="empty-icon" aria-hidden="true">⌂</div>
              <div>
                <span className="eyebrow">PROPERTY LISTINGS</span>
                <h3>No properties are published yet.</h3>
                <p>We publish real listings only after seller authority and publication checks are completed. No sample properties are presented as real inventory.</p>
              </div>
              <Link className="button button-dark" href="#contact">Register your interest</Link>
            </div>
          )}
          <p className="small-note">A moderated listing is not a legal title certificate. Verification, where offered, is a separate scoped process.</p>
        </div>
      </section>

      <section className="services section-pad" id="services">
        <div className="container">
          <SectionHeading
            eyebrow="PROPERTY SERVICES"
            title="The right next step starts with clarity."
            description="Tell us what you are dealing with. We will help identify whether the request fits an available service or needs a qualified specialist."
          />
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.number}>
                <span className="service-number">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a href="#contact" aria-label={`Ask about ${service.title}`}>Discuss this service <span>↗</span></a>
              </article>
            ))}
          </div>
          <div className="service-disclaimer">
            <strong>Service availability matters.</strong>
            <span>Specific legal work is subject to eligibility, geographic coverage, engagement terms and qualified professional review.</span>
          </div>
        </div>
      </section>

      <section className="process section-pad" id="process">
        <div className="container process-grid">
          <div className="process-intro">
            <span className="eyebrow eyebrow-light">A CLEARER PROCESS</span>
            <h2>Know what happens <em>next.</em></h2>
            <p>Before any work begins, the scope, responsibilities and expected next steps should be clear to you.</p>
            <a className="button button-gold" href="#contact">Start a conversation <span>↗</span></a>
          </div>
          <div className="steps">
            {steps.map(([number, title, description]) => (
              <div className="step" key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="insights section-pad" id="insights">
        <div className="container insight-grid">
          <div>
            <span className="eyebrow">KNOWLEDGE & GUIDANCE</span>
            <h2>Make informed decisions, not assumptions.</h2>
            <p>The Knowledge Hub brings together published property guides and educational videos alongside answers to common questions. New material appears only after editorial review and includes its jurisdiction and publication details.</p>
          </div>
          <div className="insight-list">
            <Link href="/faqs"><span>01</span><div><strong>Frequently asked questions</strong><small>Clear answers to common property questions</small></div><b>↗</b></Link>
            <a href="#contact"><span>02</span><div><strong>Expert conversations</strong><small>Discuss your situation with the team</small></div><b>↗</b></a>
            <Link href="/knowledge"><span>03</span><div><strong>Articles & video library</strong><small>Browse published guides and videos</small></div><b>↗</b></Link>
          </div>
        </div>
      </section>

      <section className="faq section-pad" id="faqs">
        <div className="container faq-grid">
          <SectionHeading
            eyebrow="COMMON QUESTIONS"
            title="A few things worth knowing."
            description="Property matters are often specific to the person, property and applicable law. These general answers are a starting point, not legal advice."
          />
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact section-pad" id="contact">
        <div className="container contact-grid">
          <div>
            <span className="eyebrow eyebrow-light">START WITH A CONVERSATION</span>
            <h2>Tell us what is happening with your property.</h2>
            <p>Share a few details and the team can explain the appropriate next step, subject to service availability.</p>
            <div className="contact-promise"><span>✓</span> No confidential documents are requested through this initial inquiry form.</div>
          </div>
          <InquiryForm />
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-main">
          <Brand />
          <p>Connecting property discovery with practical local assistance in Bangladesh.</p>
          <div className="footer-links"><a href="#properties">Properties</a><a href="#services">Services</a><a href="#faqs">FAQs</a><a href="#contact">Contact</a></div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Bangladesh Property Platform. All rights reserved.</span>
          <span>Information on this website is general and is not a substitute for legal advice.</span>
        </div>
      </footer>

      <div className="mobile-actions">
        <a href="#contact">Contact</a>
        <a href="#services">Explore services</a>
      </div>
    </main>
  );
}
