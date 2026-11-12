import type { Metadata } from "next";
import { getSiteUrl, isSearchIndexingEnabled } from "@/lib/site";
import "./globals.css";

const indexingEnabled = isSearchIndexingEnabled();

export const metadata: Metadata = {
  title: {
    default: "Bangladesh Property Platform | Property, Verified Process, Local Support",
    template: "%s | Bangladesh Property Platform",
  },
  description:
    "Explore Bangladesh property opportunities and request coordinated property, verification and remote-owner assistance.",
  metadataBase: getSiteUrl() ?? undefined,
  openGraph: {
    title: "Bangladesh Property Platform",
    description:
      "A Bangladesh-focused real estate marketplace and property assistance platform.",
    type: "website",
  },
  robots: {
    index: indexingEnabled,
    follow: indexingEnabled,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
