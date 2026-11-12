export function SiteFooter() {
  return (
    <>
      <footer className="footer">
        <div className="container footer-main">
          <a className="brand" href="/" aria-label="Bangladesh Property Platform home">
            <span className="brand-mark">B</span>
            <span className="brand-copy">
              <strong>PROPERTY<span> BD</span></strong>
              <small>LOCAL KNOWLEDGE. CLEARER PROPERTY DECISIONS.</small>
            </span>
          </a>
          <p>Connecting property discovery with practical local assistance in Bangladesh.</p>
          <div className="footer-links">
            <a href="/properties">Properties</a><a href="/services">Services</a>
            <a href="/faqs">FAQs</a><a href="/contact">Contact</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Bangladesh Property Platform. All rights reserved.</span>
          <span>General information only. Not a substitute for legal advice.</span>
        </div>
      </footer>
      <div className="mobile-actions">
        <a href="/contact">Contact</a><a href="/services">Explore services</a>
      </div>
    </>
  );
}
