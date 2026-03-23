'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker to use external CDN for simplicity
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const SecurePDFViewer = ({ url }: { url: string }) => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div 
      className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl select-none"
      onContextMenu={(e) => e.preventDefault()} // Disable right-click
    >
      <div className="mb-4 flex gap-4 items-center">
        <button 
          type="button"
          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="px-4 py-2 bg-(--color-primary) text-white rounded-md disabled:opacity-50 hover:bg-opacity-90 transition-colors font-medium text-sm"
        >
          Sebelumnnya
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700">
          Halaman {pageNumber} dari {numPages || '--'}
        </span>
        <button 
           type="button"
           onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
           disabled={pageNumber >= (numPages || 1)}
           className="px-4 py-2 bg-(--color-primary) text-white rounded-md disabled:opacity-50 hover:bg-opacity-90 transition-colors font-medium text-sm"
        >
          Selanjutnya
        </button>
      </div>

      <div className="border border-gray-300 dark:border-gray-700 shadow-xl overflow-hidden pointer-events-none rounded-sm bg-white">
        <Document 
           file={url} 
           onLoadSuccess={onDocumentLoadSuccess} 
           loading={<div className="p-20 text-gray-500">Memuat Dokumen...</div>}
           error={<div className="p-20 text-red-500">Gagal memuat dokumen.</div>}
        >
          <Page 
             pageNumber={pageNumber} 
             renderTextLayer={false} 
             renderAnnotationLayer={false} 
             scale={1.2} 
             className="max-w-full"
          />
        </Document>
      </div>
      <p className="mt-4 text-xs tracking-widest text-gray-400 uppercase font-semibold">Protected Document - Read Only</p>
    </div>
  );
};
