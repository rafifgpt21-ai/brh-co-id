"use client";

import { useState } from "react";

export type ShareLabels = {
  share: string;
  shareToFacebook: string;
  shareToWhatsapp: string;
  copyLink: string;
  linkCopied: string;
};

type ShareActionsProps = {
  url: string;
  title: string;
  labels: ShareLabels;
  variant?: "post" | "quick";
  className?: string;
};

export function ShareActions({
  url,
  title,
  labels,
  variant = "post",
  className = "",
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const shareText = `${title} ${url}`.trim();
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const isQuick = variant === "quick";
  const wrapperClass = isQuick
    ? "flex flex-wrap items-center justify-end gap-1.5"
    : "flex flex-wrap items-center justify-center gap-2.5";
  const labelClass = isQuick
    ? "sr-only"
    : "font-label text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/65";
  const buttonClass = isQuick
    ? "inline-flex h-8 items-center gap-1.5 rounded-full border border-outline-variant/25 bg-surface-container-lowest px-2.5 text-[10px] font-black uppercase tracking-wider text-on-surface-variant transition hover:border-secondary/35 hover:bg-secondary/10 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/35"
    : "inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-lowest/85 px-4 text-[11px] font-black uppercase tracking-wider text-on-surface-variant shadow-sm shadow-primary/5 transition hover:border-secondary/35 hover:bg-secondary/10 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/35";

  return (
    <div className={`${wrapperClass} ${className}`} aria-label={labels.share}>
      <span className={labelClass}>{labels.share}</span>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} hover:text-[#1877F2]`}
        aria-label={labels.shareToFacebook}
        title={labels.shareToFacebook}
      >
        <span className="material-symbols-outlined text-[16px]">public</span>
        {!isQuick && <span>Facebook</span>}
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} hover:text-[#128C7E]`}
        aria-label={labels.shareToWhatsapp}
        title={labels.shareToWhatsapp}
      >
        <span className="material-symbols-outlined text-[16px]">chat</span>
        {!isQuick && <span>WhatsApp</span>}
      </a>
      <button
        type="button"
        onClick={copyUrl}
        className={buttonClass}
        aria-label={copied ? labels.linkCopied : labels.copyLink}
        title={copied ? labels.linkCopied : labels.copyLink}
      >
        <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
        {!isQuick && <span>{copied ? labels.linkCopied : labels.copyLink}</span>}
      </button>
    </div>
  );
}
