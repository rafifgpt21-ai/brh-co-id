'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface NavLinksProps {
  isAdmin?: boolean;
  lang: Locale;
  dict: Dictionary;
}

export const getNavLinks = (isAdmin: boolean | undefined, lang: Locale, labels: Dictionary["nav"]) => [
  { href: `/${lang}`, label: labels.home },
  { href: `/${lang}/explore`, label: labels.explore },
  { href: `/${lang}/biografi`, label: labels.biography },
  { href: `/${lang}/riset`, label: labels.research },
  ...(isAdmin ? [{ href: '/admin', label: labels.admin }] : []),
];

export const NavLinks = ({ isAdmin, lang, dict }: NavLinksProps) => {
  const pathname = usePathname();
  const links = getNavLinks(isAdmin, lang, dict.nav);

  return (
    <div className="hidden lg:flex items-center gap-10 font-headline font-medium tracking-tight">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== `/${lang}` && pathname?.startsWith(link.href));
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors duration-300 font-headline font-medium tracking-tight ${
              isActive 
                ? "text-primary" 
                : "text-on-background/70 hover:text-primary"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
};
