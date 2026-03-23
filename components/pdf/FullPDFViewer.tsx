"use client";

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FullPDFViewerProps {
  url: string;
  title?: string;
}

// Watermark repeated text
const WatermarkOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-15 select-none flex flex-wrap justify-center items-center gap-20 p-10">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="text-4xl font-bold -rotate-45 whitespace-nowrap">
        BRH INTELLECTUAL PLATFORM
      </div>
    ))}
  </div>
);

interface LazyPageProps {
  index: number;
  searchText: string;
  scale: number;
  containerWidth: number;
  isTypingPage: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setCurrentPage: (page: number) => void;
  setPageInput: (input: string) => void;
}

// Optimized Page Component with Lazy Loading moved outside to prevent re-mounting on every scroll
const LazyPage = ({ 
  index, 
  searchText, 
  scale, 
  containerWidth, 
  isTypingPage, 
  containerRef,
  setCurrentPage,
  setPageInput
}: LazyPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Calculate responsive width
  const pageWidth = containerWidth > 0 ? Math.min(800 * scale, containerWidth) : 800 * scale;

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '100% 0px 100% 0px', // Large margin for pre-loading pages early
        threshold: 0.01
      }
    );

    if (pageRef.current) observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [scale, isTypingPage, containerRef, index, setCurrentPage, setPageInput]);

  return (
    <div
      ref={pageRef}
      id={`page-container-${index + 1}`}
      className="relative shadow-2xl border border-outline-variant/10 bg-white group transition-opacity duration-500"
      style={{
        width: pageWidth,
        minHeight: pageWidth * 1.3,
      }}
    >
      {isVisible ? (
        <>
          <WatermarkOverlay />
          <div className="absolute top-4 right-4 z-30 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity border border-outline-variant/10 shadow-sm">
            Halaman {index + 1}
          </div>
          <Page
            pageNumber={index + 1}
            width={pageWidth}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="max-w-full h-auto bg-white!"
            loading={
              <div
                className="bg-surface-container-low animate-pulse flex items-center justify-center"
                style={{ width: pageWidth, height: pageWidth * 1.3 }}
              >
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Memuat Halaman {index + 1}...</span>
              </div>
            }
            customTextRenderer={({ str }: { str: string }) => {
              if (!searchText) return str;
              const escapedSearchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const parts = str.split(new RegExp(`(${escapedSearchText})`, 'gi'));
              return (
                <span className="pdf-text-item">
                  {parts.map((part, i) =>
                    part.toLowerCase() === searchText.toLowerCase()
                      ? <mark key={i} className="pdf-highlight-mark">{part}</mark>
                      : part
                  )}
                </span>
              ) as any;
            }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 bg-surface-container-lowest">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Halaman {index + 1}</p>
        </div>
      )}
    </div>
  );
};

export const FullPDFViewer = ({ url, title }: FullPDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.2);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchResults, setSearchResults] = useState<{ pageIndex: number; matchIndex: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [allPagesText, setAllPagesText] = useState<string[]>([]);
  const [pageInput, setPageInput] = useState("1");
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isTypingPage, setIsTypingPage] = useState(false);

  // Use proxy for external URLs to bypass CORS
  const proxiedUrl = url.startsWith('http') && !url.includes(window.location.hostname)
    ? `/api/proxy-pdf?url=${encodeURIComponent(url)}`
    : url;

  useEffect(() => {
    if (!containerRef.current || !numPages) return;

    const trackingObserver = new IntersectionObserver(
      (entries) => {
        // Find the page with the largest intersection ratio (most dominant on screen)
        let maxRatio = 0;
        let dominantPage = currentPage;

        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const pageId = entry.target.id;
            const pNum = parseInt(pageId.replace('page-container-', ''));
            if (!isNaN(pNum)) {
              dominantPage = pNum;
            }
          }
        });

        if (maxRatio > 0.1 && dominantPage !== currentPage) {
          setCurrentPage(dominantPage);
          if (!isTypingPage) {
            setPageInput(dominantPage.toString());
          }
        }
      },
      {
        root: containerRef.current,
        rootMargin: '-20% 0px -20% 0px', // Focus on middle 60% of viewport for dominance
        threshold: [0.2, 0.5, 0.8]
      }
    );

    // Observe all page containers
    for (let i = 1; i <= (numPages || 0); i++) {
      const el = document.getElementById(`page-container-${i}`);
      if (el) trackingObserver.observe(el);
    }

    return () => trackingObserver.disconnect();
  }, [numPages, isTypingPage, containerRef.current]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Adjust for viewport padding (32px for mobile, 64px for desktop)
        const padding = window.innerWidth < 768 ? 32 : 64;
        setContainerWidth(containerRef.current.clientWidth - padding);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    // Initial delay to ensure container is rendered
    const timer = setTimeout(updateWidth, 100);
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, []);

  const onDocumentLoadSuccess = async (pdf: any) => {
    setNumPages(pdf.numPages);

    // Extract text from all pages for search index in background
    try {
      const textContent: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        textContent.push(text);
      }
      setAllPagesText(textContent);
    } catch (err) {
      console.error("Error extracting text for search:", err);
    }
  };

  useEffect(() => {
    if (!searchText || allPagesText.length === 0) {
      setSearchResults([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const results: { pageIndex: number; matchIndex: number }[] = [];
    const escapedSearchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearchText, 'gi');

    allPagesText.forEach((text, pageIndex) => {
      let match;
      // Reset regex lastIndex just in case
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        results.push({ pageIndex, matchIndex: match.index });
      }
    });

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentMatchIndex(0);
      // Auto scroll to first result if it's a new search
      scrollToPage(results[0].pageIndex + 1);
    }
  }, [searchText, allPagesText]);

  const scrollToPage = (pageNumber: number) => {
    const element = document.getElementById(`page-container-${pageNumber}`);
    if (element && containerRef.current) {
      const container = containerRef.current;
      const targetOffset = element.offsetTop - container.offsetTop;
      
      container.scrollTo({
        top: targetOffset - 16,
        behavior: 'smooth'
      });
      
      setCurrentPage(pageNumber);
      setPageInput(pageNumber.toString());
    }
  };

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
    scrollToPage(searchResults[nextIndex].pageIndex + 1);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIndex);
    scrollToPage(searchResults[prevIndex].pageIndex + 1);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        alert("Pencetakan tidak diizinkan.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-8 h-16 md:h-20 bg-surface-container-low border-b border-outline-variant/10 z-30 shadow-md shrink-0">
        <div className="flex items-center gap-1 md:gap-4 shrink-0">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all active:scale-90"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-2xl md:text-3xl">arrow_back</span>
          </button>
          <div className="hidden sm:block lg:max-w-[200px] xl:max-w-[400px]">
            <h1 className="font-headline font-bold text-primary truncate text-sm md:text-lg" title={title}>{title || "Dokumen PDF"}</h1>
            <p className="hidden md:block text-[10px] md:text-xs text-on-surface-variant font-medium uppercase tracking-[0.15em] leading-none mt-0.5">Continuous Scroll Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-surface-container-highest/40 p-1 rounded-2xl border border-outline-variant/10 h-10 md:h-12">
            <button 
              onClick={() => handleZoom(-0.1)} 
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-surface-container-high rounded-xl transition-all active:scale-90"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-xl md:text-2xl">zoom_out</span>
            </button>
            <span className="text-[11px] md:text-sm font-black w-12 md:w-16 text-center text-primary">{Math.round(scale * 100)}%</span>
            <button 
              onClick={() => handleZoom(0.1)} 
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-surface-container-high rounded-xl transition-all active:scale-90"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-xl md:text-2xl">zoom_in</span>
            </button>
          </div>

          <div className="h-8 w-px bg-outline-variant/20 hidden sm:block"></div>

          {/* Page Indicator / Jump */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const p = parseInt(pageInput.trim());
              if (!isNaN(p) && p >= 1 && p <= (numPages || 1)) {
                scrollToPage(p);
                (e.target as any).querySelector('input')?.blur();
              } else {
                setPageInput(currentPage.toString());
              }
            }}
            className="flex items-center gap-2 bg-surface-container-highest/40 px-3 h-10 md:h-12 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center gap-1.5 h-full">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onFocus={() => setIsTypingPage(true)}
                onBlur={() => {
                  setTimeout(() => setIsTypingPage(false), 200);
                }}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-10 md:w-12 h-6 md:h-8 bg-surface-container-high rounded-lg border border-outline-variant/30 text-center text-xs md:text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner"
                placeholder="P"
              />
              <AnimatePresence>
                {isTypingPage && (
                  <motion.button 
                    initial={{ scale: 0, width: 0 }}
                    animate={{ scale: 1, width: 'auto' }}
                    exit={{ scale: 0, width: 0 }}
                    type="submit"
                    className="bg-primary text-on-primary p-1.5 md:p-2 rounded-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-md ml-1"
                  >
                    <span className="material-symbols-outlined text-sm md:text-base font-bold">check</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2 text-on-surface-variant font-bold h-full">
              <span className="opacity-30 text-base md:text-lg">/</span>
              <span className="text-[10px] md:text-sm min-w-[20px] md:min-w-[24px] text-primary/80">{numPages || "--"}</span>
            </div>
          </form>

          <div className="h-8 w-px bg-outline-variant/20 hidden md:block"></div>

          {/* Search Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setIsSearching(true);
              setSearchText(searchInput);
              setTimeout(() => setIsSearching(false), 500);
            }} 
            className="relative flex items-center gap-1 md:gap-2 flex-1 md:flex-initial"
          >
            <div className="relative group flex-1 h-10 md:h-12 min-w-[100px] md:min-w-0">
              <span className="material-symbols-outlined absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base md:text-xl transition-colors group-focus-within:text-primary">search</span>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Cari..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-surface-container-high border border-outline-variant/10 rounded-2xl h-full pl-8 md:pl-10 pr-8 md:pr-10 text-[11px] md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-40 lg:w-56 transition-all md:focus:w-72"
              />
              {searchInput && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchText("");
                  }}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-all p-0.5 md:p-1 rounded-full hover:bg-surface-container-highest"
                  title="Bersihkan"
                >
                  <span className="material-symbols-outlined text-xs md:text-base text-black!">close</span>
                </button>
              )}
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-primary text-on-primary h-10 w-10 md:h-12 md:w-auto md:px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 hover:bg-primary/95 transition-all active:scale-95 disabled:opacity-70 shrink-0 border border-white/10"
            >
              <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">{isSearching ? "..." : "Cari"}</span>
              <span className="material-symbols-outlined text-xl md:text-2xl lg:hidden">search</span>
            </button>
          </form>
        </div>
      </div>

      {/* Search Status Indicator */}
      <AnimatePresence mode="wait">
        {searchText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary/5 px-6 py-2 border-b border-outline-variant/10 flex items-center justify-between gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <p className="text-xs font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                Hasil untuk: <span className="text-primary font-bold italic">"{searchText}"</span>
              </p>

              <div className="flex items-center gap-2 bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/10">
                <span className="text-[10px] font-bold text-primary min-w-[40px] text-center">
                  {searchResults.length > 0 ? `${currentMatchIndex + 1} / ${searchResults.length}` : "0 / 0"}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={handlePrevMatch}
                    disabled={searchResults.length === 0}
                    className="p-1 hover:bg-surface-container-high rounded-full disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={searchResults.length === 0}
                    className="p-1 hover:bg-surface-container-high rounded-full disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchInput("");
                setSearchText("");
              }}
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
            >
              Bersihkan
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Container - Scrollable */}
      <div
        ref={containerRef}
        data-lenis-prevent
        className="flex-1 overflow-y-auto bg-surface-dim/30 p-4 md:p-8 flex flex-col items-center gap-8 scrollbar-thin scrollbar-thumb-outline-variant selection:bg-secondary/20"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Document
          file={proxiedUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col gap-8"
          loading={
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm font-headline font-bold text-primary animate-pulse tracking-widest uppercase">Menyiapkan Dokumen...</p>
            </div>
          }
        >
          {Array.from(new Array(numPages), (el, index) => (
            <LazyPage
              key={`page_${index + 1}`}
              index={index}
              searchText={searchText}
              scale={scale}
              containerWidth={containerWidth}
              isTypingPage={isTypingPage}
              containerRef={containerRef}
              setCurrentPage={setCurrentPage}
              setPageInput={setPageInput}
            />
          ))}
        </Document>

        {numPages && (
          <div className="py-20 text-center">
            <div className="w-12 h-1 bg-outline-variant/20 mx-auto rounded-full mb-4"></div>
            <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.2em]">Akhir Dokumen</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .react-pdf__Page__canvas {
          margin: 0 auto;
          max-width: 100% !important;
          height: auto !important;
        }
        .react-pdf__Page__textContent {
          user-select: none !important;
          pointer-events: none !important;
          color: transparent !important;
        }
        .react-pdf__Page__textContent span:not(.pdf-text-item) {
          color: transparent !important;
        }
        .react-pdf__Page__textContent .pdf-text-item {
          color: transparent !important;
        }
        .react-pdf__Page__textContent .pdf-highlight-mark {
          color: black !important;
          -webkit-text-fill-color: black !important;
          background-color: #ffeb3b !important;
          opacity: 1 !important;
          border-radius: 2px;
          box-shadow: 0 0 0 1px #fbc02d;
          padding: 0 1px;
          position: relative;
          z-index: 10;
        }
        .react-pdf__Document {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
};
