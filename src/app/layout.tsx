import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import { Providers } from "@/components/Providers";
import { SiteChrome } from "@/components/SiteChrome";
import "lenis/dist/lenis.css";
import "./globals.css";

const description =
  "A fun little home for testing, exploring, and sharing the Purcar models. Meet PHC-1, try HexoChem Studio, and follow what’s next.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "purcar.me",
  url: "https://purcar.me",
  description,
  inLanguage: "en",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://purcar.me"),
  title: {
    default: "purcar.me — a playground for models",
    template: "%s — purcar.me",
  },
  description,
  applicationName: "purcar.me",
  authors: [{ name: "Purcar.me" }],
  generator: "Next.js",
  keywords: [
    "purcar.me",
    "Purcar models",
    "PHC-1",
    "Purcar HexoChem 1",
    "HexoChem Studio",
    "chemistry models",
    "model experiments",
  ],
  creator: "Purcar.me",
  publisher: "Purcar.me",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "https://purcar.me" },
  openGraph: {
    title: "purcar.me — a playground for models",
    description,
    url: "https://purcar.me",
    siteName: "purcar.me",
    locale: "en_US",
    type: "website",
    images: [{ url: "/media/hexochem-logo.webp", alt: "purcar.me · HexoChem" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "purcar.me — a playground for models",
    description,
    images: ["/media/hexochem-logo.webp"],
  },
  icons: {
    icon: [{ url: "/media/hexochem-logo.webp", type: "image/webp" }],
    apple: [{ url: "/media/hexochem-logo.webp" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){document.documentElement.setAttribute('data-theme','light');})();`,
          }}
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="author" content="Purcar.me" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body id="top" className="site-body">
        <Providers>
          <SmoothScroll />
          {children}
          <SiteChrome />
        </Providers>
      </body>
    </html>
  );
}
