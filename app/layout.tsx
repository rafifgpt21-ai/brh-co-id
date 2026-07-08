import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { getPublicBaseUrl } from "@/lib/share-url";
import "./globals.css";

const appUrl = getPublicBaseUrl();
const siteTitle = "The Official Website of BRH";

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
    icon: "/icon.png",
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
