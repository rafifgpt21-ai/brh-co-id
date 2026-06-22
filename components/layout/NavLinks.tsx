'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinksProps {
  isAdmin?: boolean;
}

export const getNavLinks = (isAdmin?: boolean) => [
  { href: '/', label: 'Beranda' },
  { href: '/explore', label: 'Explore' },
  { href: '/biografi', label: 'Tentang' },
  { href: '/riset', label: 'Riset' },
  ...(isAdmin ? [{ href: '/admin', label: 'Kelola' }] : []),
];

export const NavLinks = ({ isAdmin }: NavLinksProps) => {
  const pathname = usePathname();
  const links = getNavLinks(isAdmin);

  return (
    <div className="hidden lg:flex items-center gap-10 font-headline font-medium tracking-tight">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
        
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
