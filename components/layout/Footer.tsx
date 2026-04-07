import Link from 'next/link';
import { CurrentYear } from '@/components/common/CurrentYear';
import { Suspense } from 'react';

export const Footer = () => {
  return (
    <footer className="w-full py-16 mt-24 bg-[#0F172A]">
      <div className="w-full px-6 md:px-12 lg:px-24 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-4 items-center md:items-start">
          <div className="font-headline font-black text-[#ffffff] text-2xl tracking-tighter">
            BRH Intellectual
          </div>
          <p className="text-[#fcf8fa]/50 font-body text-sm max-w-xs text-center md:text-left">
            Platform dedikasi untuk pengembangan pemikiran intelektual dan spiritual kontemporer.
          </p>
        </div>
        <div className="flex gap-12 font-label text-xs uppercase tracking-widest font-semibold">
          <Link href="/biografi" className="text-[#fcf8fa]/50 hover:text-[#316bf3] transition-colors">Biografi</Link>
          <Link href="#" className="text-[#fcf8fa]/50 hover:text-[#316bf3] transition-colors">Metodologi</Link>
          <Link href="#" className="text-[#fcf8fa]/50 hover:text-[#316bf3] transition-colors">Kontak</Link>
          <Link href="/admin/login" className="text-[#fcf8fa]/50 hover:text-[#316bf3] transition-colors">Admin</Link>
        </div>
      </div>
      <div className="w-full px-6 md:px-12 lg:px-24 mt-16 pt-8 border-t border-[#fcf8fa]/10 text-center">
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#fcf8fa]/30">
          &copy; <Suspense fallback={<span>2026</span>}><CurrentYear /></Suspense> BRH Intellectual Platform. Curated for the Academic Mind.
        </p>
      </div>
    </footer>
  );
};
