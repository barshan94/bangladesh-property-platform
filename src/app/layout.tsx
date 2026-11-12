import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bangladesh Property Platform | Property, Verified Process, Local Support",
    template: "%s | Bangladesh Property Platform",
  },
  description:
    "Explore Bangladesh property opportunities and request coordinated property, verification and remote-owner assistance.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Bangladesh Property Platform",
    description:
      "A Bangladesh-focused real estate marketplace and property assistance platform.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
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
