import { Suspense } from "react";
import Link from "next/link";
import { getPostByFileUrl } from "@/lib/actions/post";
import PDFViewerClient from "@/components/pdf/PDFViewerClient";

export default async function PDFViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const url = params.url;
  const title = params.title;

  if (!url || typeof url !== 'string') {
    return (
      <div className="h-screen flex items-center justify-center p-6 text-center bg-surface-container-lowest">
        <div className="max-w-md bg-white p-12 rounded-[2.5rem] shadow-2xl border border-outline-variant/10">
          <div className="w-20 h-20 bg-error-container/20 rounded-3xl flex items-center justify-center text-error mx-auto mb-8">
            <span className="material-symbols-outlined text-[40px]">error_outline</span>
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-4 tracking-tight">Dokumen Tidak Ditemukan</h1>
          <p className="text-on-surface-variant mb-10 leading-relaxed">Maaf, tautan dokumen PDF tidak valid, tidak lengkap, atau sudah kadaluwarsa.</p>
          <Link 
            href="/"
            className="inline-block px-10 py-4 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all"
          >
            Kembali ke Beranda
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
          <h1 className="text-3xl font-headline font-bold text-primary mb-4 tracking-tight">Akses Terbatas</h1>
          <p className="text-on-surface-variant mb-10 leading-relaxed">Maaf, dokumen ini sedang dalam status DRAFT dan hanya dapat diakses oleh Admin.</p>
          <Link 
            href="/"
            className="inline-block px-10 py-4 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center bg-surface-container-lowest animate-pulse">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-sm font-headline font-bold text-primary uppercase tracking-widest">Memuat Viewer...</p>
      </div>
    }>
      <PDFViewerClient 
        url={decodedUrl} 
        title={typeof title === 'string' ? decodeURIComponent(title) : "Dokumen"} 
      />
    </Suspense>
  );
}
