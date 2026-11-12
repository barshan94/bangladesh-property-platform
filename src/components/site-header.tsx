const links = [
  ["Properties", "/properties"],
  ["Services", "/services"],
  ["How it works", "/#process"],
  ["Insights", "/knowledge"],
  ["About", "/about"],
];

export function SiteHeader() {
  return (
    <>
      <div className="topline">
        <div className="container topline-inner">
          <span>Bangladesh property support, wherever you are</span>
          <a href="/contact">Talk to our team <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <header className="site-header">
        <div className="container nav-wrap">
          <a className="brand" href="/" aria-label="Bangladesh Property Platform home">
            <span className="brand-mark">B</span>
            <span className="brand-copy">
              <strong>PROPERTY<span> BD</span></strong>
              <small>LOCAL KNOWLEDGE. CLEARER PROPERTY DECISIONS.</small>
            </span>
          </a>
          <nav aria-label="Main navigation">
            {links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
          </nav>
          <a className="button button-dark header-cta" href="/contact">Contact an expert</a>
        </div>
      </header>
    </>
  );
}
