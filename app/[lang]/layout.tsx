import { FloatingActions } from "@/components/chat/FloatingActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NavigationFeedbackProvider, OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type PublicLayoutParams = Promise<{ lang: string }>;

async function resolvePublicLocale(params: PublicLayoutParams) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang || defaultLocale;
  const dict = await getDictionary(lang);

  return { lang, dict };
}

async function LocalizedHeader({ params }: { params: PublicLayoutParams }) {
  const { lang, dict } = await resolvePublicLocale(params);
  return <Header lang={lang} dict={dict} />;
}

async function LocalizedFooter({ params }: { params: PublicLayoutParams }) {
  const { lang, dict } = await resolvePublicLocale(params);
  return <Footer lang={lang} dict={dict} />;
}

async function LocalizedFloatingActions({ params }: { params: PublicLayoutParams }) {
  const { lang, dict } = await resolvePublicLocale(params);
  return <FloatingActions lang={lang} dict={dict} />;
}

function HeaderFallback() {
  const lang = defaultLocale;
  const links = [
    { href: `/${lang}`, label: "Home" },
    { href: `/${lang}/explore`, label: "Explore" },
    { href: `/${lang}/biografi`, label: "Biography" },
    { href: `/${lang}/publikasi`, label: "Publications" },
    { href: `/${lang}/riset`, label: "Research" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background/86 backdrop-blur-xl transition-colors duration-200">
      <div className="flex h-20 w-full items-center justify-between px-6 md:px-8 lg:px-12 xl:px-24">
        <div className="text-xl font-bold tracking-tighter text-tertiary font-headline">
          <OptimisticLink href={`/${lang}`}>BRH Intellectual</OptimisticLink>
        </div>
        <div className="hidden items-center gap-10 font-headline font-medium tracking-tight lg:flex">
          {links.map((link) => (
            <OptimisticLink
              key={link.href}
              href={link.href}
              className="text-on-background/70 transition-colors duration-300 hover:text-primary"
            >
              {link.label}
            </OptimisticLink>
          ))}
        </div>
        <OptimisticLink
          href="/admin/login"
          className="rounded-xl px-4 py-2 font-headline text-sm font-medium text-primary transition-all hover:bg-secondary/5 sm:px-6 sm:text-base"
        >
          Login
        </OptimisticLink>
      </div>
    </nav>
  );
}

function FooterFallback() {
  return (
    <footer className="mt-24 w-full bg-tertiary py-16">
      <div className="flex w-full flex-col items-center justify-between gap-8 px-6 md:flex-row md:px-12 lg:px-24">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <div className="font-headline text-2xl font-black tracking-tighter text-background">
            BRH Intellectual
          </div>
          <div className="h-4 w-64 max-w-full rounded-full bg-background/10" />
        </div>
        <div className="flex flex-wrap justify-center gap-8 font-label text-xs font-semibold uppercase tracking-widest md:gap-12">
          <OptimisticLink href={`/${defaultLocale}/biografi`} className="text-background/70 transition-colors hover:text-primary">
            Biography
          </OptimisticLink>
          <OptimisticLink href={`/${defaultLocale}/riset`} className="text-background/70 transition-colors hover:text-primary">
            Research
          </OptimisticLink>
          <a href="mailto:budi.rahman@uinjkt.ac.id" className="text-background/70 transition-colors hover:text-primary">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

function FloatingActionsFallback() {
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[60] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5">
      <button
        type="button"
        aria-label="Open chat"
        disabled
        className="grid h-14 w-14 place-items-center rounded-full bg-primary text-on-primary opacity-85 shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
      >
        <span className="material-symbols-outlined text-[26px]">chat</span>
      </button>
    </div>
  );
}

export default function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: PublicLayoutParams;
}) {
  return (
    <NavigationFeedbackProvider>
      <LenisProvider>
        <Suspense fallback={<HeaderFallback />}>
          <LocalizedHeader params={params} />
        </Suspense>
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Suspense fallback={<FooterFallback />}>
          <LocalizedFooter params={params} />
        </Suspense>
        <Suspense fallback={<FloatingActionsFallback />}>
          <LocalizedFloatingActions params={params} />
        </Suspense>
      </LenisProvider>
    </NavigationFeedbackProvider>
  );
}
