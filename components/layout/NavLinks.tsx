'use client';

import { usePathname } from 'next/navigation';
import { isPendingNavigationTarget, OptimisticLink, useNavigationFeedback } from '@/components/navigation/NavigationFeedback';
import { withLocale, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface NavLinksProps {
  isAdmin?: boolean;
  lang: Locale;
  dict: Dictionary;
}

export const getNavLinks = (isAdmin: boolean | undefined, lang: Locale, labels: Dictionary["nav"]) => [
  { href: withLocale("/", lang), label: labels.home },
  { href: withLocale("/tentang", lang), label: labels.about },
  { href: withLocale("/publikasi", lang), label: labels.publications },
  { href: withLocale("/riset", lang), label: labels.research },
  { href: withLocale("/pengabdian", lang), label: labels.engagement },
  { href: withLocale("/kontak", lang), label: labels.contact },
  ...(isAdmin ? [{ href: '/admin', label: labels.admin }] : []),
];

export function isNavLinkCurrent(pathname: string | null, href: string, lang: Locale) {
  if (!pathname) return false;
  const localeRoot = withLocale("/", lang);

  if (href === localeRoot) {
    return pathname === localeRoot;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export const NavLinks = ({ isAdmin, lang, dict }: NavLinksProps) => {
  const pathname = usePathname();
  const { pendingHref } = useNavigationFeedback();
  const links = getNavLinks(isAdmin, lang, dict.nav);

  return (
    <div className="hidden lg:flex items-center gap-7 font-headline font-medium tracking-tight xl:gap-10">
      {links.map((link) => {
        const isCurrentRoute = isNavLinkCurrent(pathname, link.href, lang);
        const isActive = isPendingNavigationTarget(pendingHref, link.href) || (!pendingHref && isCurrentRoute);
        
        return (
          <OptimisticLink
            key={link.href}
            href={link.href}
            active={isActive}
            className={`transition-colors duration-300 font-headline font-medium tracking-tight ${
              isActive 
                ? "text-primary" 
                : "text-on-background/70 hover:text-primary"
            }`}
          >
            {link.label}
          </OptimisticLink>
        );
      })}
    </div>
  );
};
