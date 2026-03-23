"use client";

import React, { useEffect } from "react";

interface SecurePDFViewerProps {
  url: string;
  title?: string;
}

export const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ url, title }) => {
  useEffect(() => {
    // Disable right-click within the container context
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable print (Ctrl+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        alert("Pencetakan tidak diizinkan untuk dokumen ini.");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {title && (
         <h3 className="text-lg font-headline font-bold text-primary">{title}</h3>
      )}
      <div 
        className="relative w-full aspect-[1/1.4] bg-surface-container rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Anti-copy overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none" />
        
        {/* Using standard iframe but with enhancements. For better security, PDF.js can be used,
            but for now, standard rendering with protections is implemented. */}
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-0"
          title={title}
        />
      </div>
      <p className="text-[10px] text-on-surface-variant font-medium italic">
        * Dokumen ini diproteksi. Seleksi teks dan klik kanan dinonaktifkan.
      </p>
    </div>
  );
};
