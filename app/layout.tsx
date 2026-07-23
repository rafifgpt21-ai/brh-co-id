import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { getPublicBaseUrl } from "@/lib/share-url";
import "./globals.css";

const appUrl = getPublicBaseUrl();
const siteTitle = "The Official Website of BRH";
const logoUrl = new URL("/logo.png", appUrl).toString();

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${appUrl}/#website`,
      url: appUrl,
      name: siteTitle,
      alternateName: "BRH Insight",
      inLanguage: ["id-ID", "en-US"],
      publisher: {
        "@id": `${appUrl}/#organization`,
      },
      author: {
        "@id": `${appUrl}/#person`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "BRH Insight",
      alternateName: "BRH",
      url: appUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
        contentUrl: logoUrl,
        width: 1000,
        height: 1000,
      },
    },
    {
      "@type": "Person",
      "@id": `${appUrl}/#person`,
      name: "Budi Rahman Hakim",
      alternateName: "BRH",
      url: appUrl,
    },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: "Menyemai Pemikiran, Menggerakkan Perubahan",
  applicationName: siteTitle,
  authors: [{ name: "Budi Rahman Hakim" }],
  creator: siteTitle,
  publisher: siteTitle,
  alternates: {
    canonical: appUrl,
  },
  openGraph: {
    title: siteTitle,
    description: "Menyemai Pemikiran, Menggerakkan Perubahan",
    url: appUrl,
    siteName: siteTitle,
    type: "website",
    images: [{ url: "/opengraph-image", alt: siteTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: "Menyemai Pemikiran, Menggerakkan Perubahan",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Material Symbols is still used across the existing icon system. */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body 
        className="bg-background font-body text-on-surface selection:bg-secondary-fixed min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
