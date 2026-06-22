import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "BRH Intellectual Web Platform",
  description: "Menyemai Pemikiran, Menggerakkan Perubahan",
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
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Plus+Jakarta+Sans:wght@200..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body 
        className="bg-background font-body text-on-surface selection:bg-secondary-fixed min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <LenisProvider>
          <Suspense fallback={<div className="h-20 w-full bg-[#fcf8fa]/80" />}>
            <Header />
          </Suspense>
          <main className="flex-1 pt-20">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0051d5]"></div></div>}>
              {children}
            </Suspense>
          </main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
