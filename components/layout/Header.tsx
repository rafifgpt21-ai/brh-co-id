import { AccountControls, LoginControl } from "./AccountControls";
import type { HeaderControlVariant } from "./AccountControls";
import { NavLinks } from './NavLinks';
import { MobileMenu } from './MobileMenu';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { OptimisticLink } from '@/components/navigation/NavigationFeedback';
import { withLocale, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Suspense } from 'react';

function AccountFallback({ dict, variant = "topbar" }: { dict: Dictionary; variant?: HeaderControlVariant }) {
  return <LoginControl dict={dict} variant={variant} />;
}

function LanguageSwitcherFallback({ lang }: { lang: Locale }) {
  return (
    <div className="inline-flex rounded-full border border-outline-variant/30 bg-surface-container-lowest p-1 text-xs font-black uppercase text-primary">
      <span className="px-3 py-1">{lang}</span>
    </div>
  );
}

function StaticNavLinks({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const links = [
    { href: withLocale("/", lang), label: dict.nav.home },
    { href: withLocale("/tentang", lang), label: dict.nav.about },
    { href: withLocale("/publikasi", lang), label: dict.nav.publications },
    { href: withLocale("/riset", lang), label: dict.nav.research },
    { href: withLocale("/pengabdian", lang), label: dict.nav.engagement },
    { href: withLocale("/kontak", lang), label: dict.nav.contact },
  ];

  return (
    <div className="hidden lg:flex items-center gap-7 font-headline font-medium tracking-tight xl:gap-10">
      {links.map((link) => (
        <OptimisticLink
          key={link.href}
          href={link.href}
          className="transition-colors duration-300 font-headline font-medium tracking-tight text-on-background/70 hover:text-primary"
        >
          {link.label}
        </OptimisticLink>
      ))}
    </div>
  );
}

function MobileMenuFallback() {
  return (
    <button
      type="button"
      className="relative z-110 p-2 text-tertiary/55 rounded-xl lg:hidden"
      aria-label="Menu loading"
      disabled
    >
      <div className="flex h-5 w-6 flex-col items-center justify-between">
        <span className="h-0.5 w-full rounded-full bg-current" />
        <span className="h-0.5 w-full rounded-full bg-current" />
        <span className="h-0.5 w-full rounded-full bg-current" />
      </div>
    </button>
  );
}

export const Header = ({ lang, dict }: { lang: Locale; dict: Dictionary }) => {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background/86 backdrop-blur-xl transition-colors duration-200">
      <div className="w-full px-5 md:px-8 lg:px-12 xl:px-24 flex justify-between items-center h-14">
        <div className="w-0 lg:w-28" aria-hidden="true" />
        
        <Suspense fallback={<StaticNavLinks lang={lang} dict={dict} />}>
          <NavLinks isAdmin={false} lang={lang} dict={dict} />
        </Suspense>
        
        <div className="hidden lg:flex items-center gap-4">
          <Suspense fallback={<LanguageSwitcherFallback lang={lang} />}>
            <LanguageSwitcher currentLocale={lang} />
          </Suspense>
          <Suspense fallback={<AccountFallback dict={dict} />}>
            <AccountControls dict={dict} />
          </Suspense>
        </div>

        <Suspense fallback={<MobileMenuFallback />}>
          <MobileMenu
            isAdmin={false}
            lang={lang}
            dict={dict}
            drawerControls={
              <>
                <Suspense fallback={<LanguageSwitcherFallback lang={lang} />}>
                  <LanguageSwitcher currentLocale={lang} variant="drawer" />
                </Suspense>
                <Suspense fallback={<AccountFallback dict={dict} variant="drawer" />}>
                  <AccountControls dict={dict} variant="drawer" />
                </Suspense>
              </>
            }
          />
        </Suspense>
      </div>
    </nav>

  );
};
