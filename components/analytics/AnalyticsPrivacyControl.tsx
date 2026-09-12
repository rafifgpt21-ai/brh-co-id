"use client";

import { ANALYTICS_OPTOUT_COOKIE } from "@/lib/analytics/shared";
import { useEffect, useState } from "react";

type PrivacyLabels = {
  trigger: string;
  title: string;
  description: string;
  enabled: string;
  disabled: string;
  disable: string;
  enable: string;
  close: string;
  dnt: string;
  error: string;
};

function hasOptedOut() {
  return document.cookie.split(";").some((cookie) => cookie.trim() === `${ANALYTICS_OPTOUT_COOKIE}=1`);
}

export function AnalyticsPrivacyControl({ labels }: { labels: PrivacyLabels }) {
  const [open, setOpen] = useState(false);
  const [optedOut, setOptedOut] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [dnt, setDnt] = useState(false);

  useEffect(() => {
    setOptedOut(hasOptedOut());
    setDnt(navigator.doNotTrack === "1");
  }, []);

  const disable = async () => {
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/analytics/view", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Opt-out failed");
      setOptedOut(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const enable = () => {
    document.cookie = `${ANALYTICS_OPTOUT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    setOptedOut(false);
    setError(false);
    window.dispatchEvent(new Event("brh:analytics-enabled"));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-background/55 transition-colors hover:text-background"
      >
        {labels.trigger}
      </button>
      {open && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4" role="presentation">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label={labels.close} onClick={() => setOpen(false)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="analytics-privacy-title"
            className="relative w-full max-w-lg rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-7 text-left text-on-surface shadow-2xl sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-label text-[10px] font-black uppercase tracking-[0.22em] text-secondary">BRH Insight</span>
                <h2 id="analytics-privacy-title" className="mt-2 font-headline text-2xl font-black text-primary">{labels.title}</h2>
              </div>
              <button type="button" autoFocus onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container text-on-surface-variant" aria-label={labels.close}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mt-5 text-sm leading-7 text-on-surface-variant">{labels.description}</p>
            <div className="mt-6 rounded-2xl bg-surface-container-low p-4 text-sm font-bold text-primary">
              {dnt ? labels.dnt : optedOut ? labels.disabled : labels.enabled}
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-error">{labels.error}</p>}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {optedOut ? (
                <button type="button" disabled={dnt} onClick={enable} className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">{labels.enable}</button>
              ) : (
                <button type="button" disabled={pending || dnt} onClick={disable} className="rounded-full border border-outline-variant/40 px-6 py-3 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50">{labels.disable}</button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
