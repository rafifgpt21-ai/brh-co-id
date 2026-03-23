'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavLinks } from './NavLinks';

interface MobileMenuProps {
  isAdmin?: boolean;
}

export const MobileMenu = ({ isAdmin }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const links = getNavLinks(isAdmin);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when pathname changes
  useEffect(() => {
    setIsOpen(false);
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
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Menu */}
      <div
        className={`absolute top-0 right-0 h-full w-[280px] bg-white shadow-2xl transform transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0 outline-none' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full p-8 pt-24 bg-white relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 p-2 text-slate-900/30 hover:text-slate-900 transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>

          <div className="space-y-8 mt-4">
            {links.map((link, i) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    transitionDelay: isOpen ? `${150 + i * 80}ms` : '0ms',
                  }}
                  className={`block text-3xl font-headline font-bold tracking-tighter transition-all duration-500 ease-out ${isActive
                      ? "text-[#0051d5] translate-x-2"
                      : "text-slate-900/70 hover:text-[#0051d5] hover:translate-x-1"
                    } ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div
            style={{ transitionDelay: isOpen ? '500ms' : '0ms' }}
            className={`mt-auto pt-10 border-t border-slate-100 space-y-4 transition-all duration-700 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div>
              <p className="text-[10px] font-bold text-[#0051d5] uppercase tracking-[0.2em] mb-1">
                Platform
              </p>
              <p className="text-sm font-headline font-semibold text-slate-900">
                BRH Intellectual
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium leading-relaxed">
              Menyemai Pemikiran,<br />Menggerakkan Perubahan
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
        className="relative z-110 p-2 text-[#0F172A] hover:bg-black/5 rounded-xl transition-all duration-300 active:scale-95 touch-none"
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
