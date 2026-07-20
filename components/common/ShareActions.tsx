"use client";

import { useEffect, useRef, useState } from "react";

export type ShareLabels = {
  share: string;
  shareToFacebook: string;
  shareToWhatsapp: string;
  copyLink: string;
  linkCopied: string;
};

type ShareActionsProps = {
  url: string;
  whatsappShareUrl?: string;
  title: string;
  labels: ShareLabels;
  variant?: "post" | "quick";
  className?: string;
};

export function ShareActions({
  url,
  whatsappShareUrl,
  title,
  labels,
  variant = "post",
  className = "",
}: ShareActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const shareText = `${title} ${whatsappShareUrl || url}`.trim();
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setOpen(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const isQuick = variant === "quick";
  const wrapperClass = isQuick
    ? "relative flex justify-end"
    : "relative flex justify-center";
  const triggerClass = isQuick
    ? "inline-flex h-8 items-center gap-1.5 rounded-full border border-outline-variant/25 bg-surface-container-lowest px-2.5 text-[10px] font-black uppercase tracking-wider text-on-surface-variant transition hover:border-secondary/35 hover:bg-secondary/10 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/35"
    : "inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-lowest/85 px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant shadow-sm shadow-primary/5 transition hover:border-secondary/35 hover:bg-secondary/10 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/35";
  const menuClass = isQuick
    ? "absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-1.5 shadow-2xl shadow-primary/12"
    : "absolute left-1/2 top-12 z-30 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-1.5 shadow-2xl shadow-primary/12";
  const menuItemClass = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-on-surface-variant transition hover:bg-secondary/10 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/35";

  return (
    <div ref={menuRef} className={`${wrapperClass} ${className}`} aria-label={labels.share}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={triggerClass}
        aria-label={labels.share}
        aria-expanded={open}
        aria-haspopup="menu"
        title={copied ? labels.linkCopied : labels.share}
      >
        <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "share"}</span>
        {!isQuick && <span>{copied ? labels.linkCopied : labels.share}</span>}
      </button>

      {open && (
        <div className={menuClass} role="menu">
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${menuItemClass} hover:text-[#1877F2]`}
            aria-label={labels.shareToFacebook}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="material-symbols-outlined text-[16px]">public</span>
            <span>Facebook</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${menuItemClass} hover:text-[#128C7E]`}
            aria-label={labels.shareToWhatsapp}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={copyUrl}
            className={menuItemClass}
            aria-label={copied ? labels.linkCopied : labels.copyLink}
            role="menuitem"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
            <span>{copied ? labels.linkCopied : labels.copyLink}</span>
          </button>
        </div>
      )}
    </div>
  );
}
