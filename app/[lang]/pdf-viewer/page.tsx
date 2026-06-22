import { Suspense } from "react";
import Link from "next/link";
import { getPostByFileUrl } from "@/lib/actions/post";
import PDFViewerClient from "@/components/pdf/PDFViewerClient";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notFound } from "next/navigation";

export default async function PDFViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang: rawLang } = await params;
  if (!hasLocale(rawLang)) notFound();
  const lang: Locale = rawLang;
  const dict = await getDictionary(lang);
  const query = await searchParams;
  const url = query.url;
  const title = query.title;

  if (!url || typeof url !== 'string') {
    return (
      <div className="h-screen flex items-center justify-center p-6 text-center bg-surface-container-lowest">
        <div className="max-w-md bg-white p-12 rounded-[2.5rem] shadow-2xl border border-outline-variant/10">
          <div className="w-20 h-20 bg-error-container/20 rounded-3xl flex items-center justify-center text-error mx-auto mb-8">
            <span className="material-symbols-outlined text-[40px]">error_outline</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-4 tracking-tight">{dict.pdf.missingTitle}</h1>
          <p className="text-on-surface-variant mb-10 leading-relaxed">{dict.pdf.missingDescription}</p>
          <Link 
            href={`/${lang}`}
            className="inline-block px-10 py-4 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all"
          >
            {dict.pdf.backHome}
          </Link>
        </div>
      </div>
    );
  }

  // Security Check: is this file part of a draft post?
  const decodedUrl = decodeURIComponent(url);
  const { authorized } = await getPostByFileUrl(decodedUrl);

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center p-6 text-center bg-surface-container-lowest">
        <div className="max-w-md bg-white p-12 rounded-[2.5rem] shadow-2xl border border-outline-variant/10">
          <div className="w-20 h-20 bg-error-container/20 rounded-3xl flex items-center justify-center text-error mx-auto mb-8">
            <span className="material-symbols-outlined text-[40px]">lock</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-4 tracking-tight">{dict.pdf.restrictedTitle}</h1>
          <p className="text-on-surface-variant mb-10 leading-relaxed">{dict.pdf.restrictedDescription}</p>
          <Link 
            href={`/${lang}`}
            className="inline-block px-10 py-4 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all"
          >
            {dict.pdf.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center bg-surface-container-lowest animate-pulse">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-sm font-headline font-bold text-primary uppercase tracking-widest">{dict.pdf.loading}</p>
      </div>
    }>
      <PDFViewerClient 
        url={decodedUrl} 
        title={typeof title === 'string' ? decodeURIComponent(title) : "Dokumen"} 
      />
    </Suspense>
  );
}
