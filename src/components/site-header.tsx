import Link from "next/link";

const links = [
  ["Properties", "/properties"],
  ["Buy", "/buy-property"],
  ["Sell", "/sell-property"],
  ["Services", "/services"],
  ["Insights", "/knowledge"],
  ["FAQs", "/faqs"],
];

export function SiteHeader() {
  return (
    <>
      <div className="topline">
        <div className="container topline-inner">
          <span>Bangladesh property support, wherever you are</span>
          <Link href="/contact">Talk to our team <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link className="brand" href="/" aria-label="Bangladesh Property Platform home">
            <span className="brand-mark">B</span>
            <span className="brand-copy">
              <strong>PROPERTY<span> BD</span></strong>
              <small>LOCAL KNOWLEDGE. CLEARER PROPERTY DECISIONS.</small>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            {links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}
          </nav>
          <Link className="button button-dark header-cta" href="/contact">Contact an expert</Link>
        </div>
      </header>
    </>
  );
}
