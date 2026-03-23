"use client";

import dynamic from "next/dynamic";

const FullPDFViewer = dynamic(
  () => import("./FullPDFViewer").then((mod) => mod.FullPDFViewer),
  { ssr: false }
);

interface PDFViewerClientProps {
  url: string;
  title?: string;
}

export default function PDFViewerClient({ url, title }: PDFViewerClientProps) {
  return <FullPDFViewer url={url} title={title} />;
}
