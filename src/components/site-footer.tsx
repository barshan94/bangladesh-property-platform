import Link from "next/link";

export function SiteFooter() {
  return (
    <>
      <footer className="footer">
        <div className="container footer-main">
          <Link className="brand" href="/" aria-label="Bangladesh Property Platform home">
            <span className="brand-mark">B</span>
            <span className="brand-copy">
              <strong>PROPERTY<span> BD</span></strong>
              <small>LOCAL KNOWLEDGE. CLEARER PROPERTY DECISIONS.</small>
            </span>
          </Link>
          <p>Connecting property discovery with practical local assistance in Bangladesh.</p>
          <div className="footer-links">
            <Link href="/properties">Properties</Link><Link href="/services">Services</Link>
            <Link href="/faqs">FAQs</Link><Link href="/videos">Videos</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Bangladesh Property Platform. All rights reserved.</span>
          <span>General information only. Not a substitute for legal advice.</span>
        </div>
      </footer>
      <div className="mobile-actions">
        <Link href="/contact">Contact</Link><Link href="/services">Explore services</Link>
      </div>
    </>
  );
}
