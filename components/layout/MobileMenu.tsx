'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { getNavLinks, isNavLinkCurrent } from './NavLinks';
import { isPendingNavigationTarget, OptimisticLink, useNavigationFeedback } from '@/components/navigation/NavigationFeedback';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface MobileMenuProps {
  isAdmin?: boolean;
  lang: Locale;
  dict: Dictionary;
  drawerControls?: ReactNode;
}

export const MobileMenu = ({ isAdmin, lang, dict, drawerControls }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { pendingHref } = useNavigationFeedback();
  const links = getNavLinks(isAdmin, lang, dict.nav);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Close menu when pathname changes
  useEffect(() => {
    const timer = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuContent = (
    <div
      className={`fixed inset-0 z-9998 transition-all duration-500 ease-in-out ${isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
    >
      {/* Overlay Backdrop */}
      <div
        className={`absolute inset-0 bg-tertiary/40 backdrop-blur-[2px] transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Menu */}
      <div
        className={`absolute top-0 right-0 h-full w-[280px] bg-background shadow-2xl transform transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0 outline-none' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full p-8 pt-24 bg-background relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 p-2 text-tertiary/30 hover:text-tertiary transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>

          <div className="space-y-8 mt-4">
            {links.map((link, i) => {
              const isCurrentRoute = isNavLinkCurrent(pathname, link.href, lang);
              const isActive = isPendingNavigationTarget(pendingHref, link.href) || (!pendingHref && isCurrentRoute);

              return (
                <OptimisticLink
                  key={link.href}
                  href={link.href}
                  active={isActive}
                  onClick={() => setIsOpen(false)}
                  style={{
                    transitionDelay: isOpen ? `${150 + i * 80}ms` : '0ms',
                  }}
                  className={`block text-3xl font-headline font-bold tracking-tighter transition-all duration-500 ease-out ${isActive
                      ? "text-primary translate-x-2"
                      : "text-on-background/70 hover:text-primary hover:translate-x-1"
                    } ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                >
                  {link.label}
                </OptimisticLink>
              );
            })}
          </div>

          <div
            style={{ transitionDelay: isOpen ? '500ms' : '0ms' }}
            className={`mt-auto pt-10 border-t border-slate-100 space-y-4 transition-all duration-700 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {drawerControls && (
              <div className="flex w-full flex-col items-stretch gap-4 pb-5">
                {drawerControls}
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">
              Platform
              </p>
              <p className="text-sm font-headline font-semibold text-tertiary">
                BRH
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium leading-relaxed">
              {dict.metadata.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-110 p-2 text-tertiary hover:bg-black/5 rounded-xl transition-all duration-300 active:scale-95 touch-none"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between items-center relative">
          <span
            className={`w-full h-0.5 bg-current rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'rotate-45 translate-y-[9px]' : 'rotate-0 translate-y-0'
              }`}
          />
          <span
            className={`w-full h-0.5 bg-current rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'opacity-0 -translate-x-4 scale-x-0' : 'opacity-100 translate-x-0 scale-x-100'
              }`}
          />
          <span
            className={`w-full h-0.5 bg-current rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? '-rotate-45 -translate-y-[9px]' : 'rotate-0 translate-y-0'
              }`}
          />
        </div>
      </button>

      {mounted && typeof document !== 'undefined'
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
};
