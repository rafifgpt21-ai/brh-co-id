import { CurrentYear } from '@/components/common/CurrentYear';
import { Suspense } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { OptimisticLink } from '@/components/navigation/NavigationFeedback';

export const Footer = ({ lang, dict }: { lang: Locale; dict: Dictionary }) => {
  return (
    <footer className="w-full py-16 mt-24 bg-tertiary">
      <div className="w-full px-6 md:px-12 lg:px-24 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-4 items-center md:items-start">
          <div className="font-headline font-black text-background text-2xl tracking-tighter">
            BRH Intellectual
          </div>
          <p className="text-background/70 font-body text-sm max-w-xs text-center md:text-left">
            {dict.footer.description}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 font-label text-xs uppercase tracking-widest font-semibold md:gap-12">
          <OptimisticLink href={`/${lang}/biografi`} className="text-background/70 hover:text-primary transition-colors">{dict.nav.biography}</OptimisticLink>
          <OptimisticLink href={`/${lang}/riset`} className="text-background/70 hover:text-primary transition-colors">{dict.nav.research}</OptimisticLink>
          <a href="mailto:budi.rahman@uinjkt.ac.id" className="text-background/70 hover:text-primary transition-colors">{dict.footer.contact}</a>
          <OptimisticLink href="/admin/login" className="text-background/70 hover:text-primary transition-colors">Admin</OptimisticLink>
        </div>
      </div>
      <div className="w-full px-6 md:px-12 lg:px-24 mt-16 pt-8 border-t border-background/10 text-center">
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-background/40">
          &copy; <Suspense fallback={<span>2026</span>}><CurrentYear /></Suspense> BRH Intellectual Platform. {dict.footer.copyright}
        </p>
      </div>
    </footer>
  );
};
