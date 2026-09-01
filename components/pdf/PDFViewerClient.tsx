"use client";

import dynamic from "next/dynamic";

const FullPDFViewer = dynamic(
  () => import("./FullPDFViewer").then((mod) => mod.FullPDFViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex flex-col items-center justify-center bg-surface-container-lowest animate-pulse">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-sm font-headline font-bold text-primary uppercase tracking-widest">Memuat Viewer...</p>
      </div>
    ),
  }
);

interface PDFViewerClientProps {
  url: string;
  title?: string;
  allowDownload?: boolean;
  showWatermark?: boolean;
}

export default function PDFViewerClient({
  url,
  title,
  allowDownload = false,
  showWatermark = true,
}: PDFViewerClientProps) {
  return (
    <FullPDFViewer
      url={url}
      title={title}
      allowDownload={allowDownload}
      showWatermark={showWatermark}
    />
  );
}
