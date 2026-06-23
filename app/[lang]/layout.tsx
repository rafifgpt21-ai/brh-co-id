import { FloatingActions } from "@/components/chat/FloatingActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang || defaultLocale;
  const dict = await getDictionary(lang);

  return (
    <LenisProvider>
      <Suspense fallback={<div className="h-20 w-full bg-[#fcf8fa]/80" />}>
        <Header lang={lang} dict={dict} />
      </Suspense>
      <main className="flex-1 pt-20">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0051d5]"></div></div>}>
          {children}
        </Suspense>
      </main>
      <Footer lang={lang} dict={dict} />
      <Suspense fallback={null}>
        <FloatingActions lang={lang} dict={dict} />
      </Suspense>
    </LenisProvider>
  );
}
