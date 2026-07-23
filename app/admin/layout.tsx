import { Header } from "@/components/layout/Header";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { defaultLocale, hasLocale, localeCookieName, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cookies, headers } from "next/headers";
import { Suspense } from "react";
import { PublishProgressProvider } from "@/components/admin/PublishProgressProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

async function getAdminLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (hasLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  const acceptedLanguage = headerStore.get("accept-language")?.toLowerCase() || "";
  if (acceptedLanguage.includes("id")) return "id";

  return defaultLocale;
}

async function AdminHeader() {
  const lang = await getAdminLocale();
  const dict = await getDictionary(lang);

  return <Header lang={lang} dict={dict} />;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublishProgressProvider>
      <LenisProvider>
        <Suspense fallback={<div className="h-20 w-full bg-[#fcf8fa]/80" />}>
          <AdminHeader />
        </Suspense>
        <main className="flex-1 pt-20">
          <div className="w-full px-1 sm:px-6 mx-auto pt-2 md:pt-4 pb-8 lg:pb-16">
            {children}
          </div>
        </main>
      </LenisProvider>
    </PublishProgressProvider>
  );
}
