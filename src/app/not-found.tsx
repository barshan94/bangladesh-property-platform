import Link from "next/link";
export default function NotFound() {
  return <main className="not-found"><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>This page is not here.</h1><p>The link may be outdated or the page may have moved.</p><Link className="button button-dark" href="/">Return to homepage ↗</Link></main>;
}
