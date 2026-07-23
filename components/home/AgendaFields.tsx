"use client";

import type { Locale } from "@/lib/i18n/config";
import { useEffect, useState } from "react";

export type AgendaFieldLabels = {
  agendaDate: string;
  agendaStartTime: string;
  agendaEndTime: string;
  agendaTimeZone: string;
  agendaLink: string;
  agendaLinkPlaceholder: string;
  agendaLinkHint: string;
  agendaLocation: string;
  agendaLocationPlaceholder: string;
  addressSearching: string;
  addressNoResults: string;
  addressSearchError: string;
  addressPoweredBy: string;
};

type AddressResult = {
  label: string;
  latitude: number;
  longitude: number;
};

export function AgendaFields({
  labels,
  lang,
  date,
  startTime,
  endTime,
  link,
  showLink = false,
  locationLabel,
  locationLatitude,
  locationLongitude,
  disabled = false,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onLinkChange,
  onLocationChange,
}: {
  labels: AgendaFieldLabels;
  lang: Locale;
  date: string;
  startTime: string;
  endTime: string;
  link: string;
  showLink?: boolean;
  locationLabel: string;
  locationLatitude?: number;
  locationLongitude?: number;
  disabled?: boolean;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onLocationChange: (value: { label: string; latitude?: number; longitude?: number }) => void;
}) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const query = locationLabel.trim();
    if (query.length < 3 || (typeof locationLatitude === "number" && typeof locationLongitude === "number")) {
      setResults([]);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await fetch(`/api/address-search?q=${encodeURIComponent(query)}&lang=${lang}`, {
          signal: controller.signal,
        });
        const payload = await response.json() as { results?: AddressResult[]; error?: string };

        if (!response.ok) throw new Error(labels.addressSearchError);

        setResults(payload.results || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setSearchError(error instanceof Error ? error.message : labels.addressSearchError);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [lang, labels.addressSearchError, locationLabel, locationLatitude, locationLongitude]);

  return (
    <div className="mt-5 grid gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
      {showLink && (
        <label className="grid gap-1.5 text-xs font-bold text-on-surface-variant">
          {labels.agendaLink}
          <span className="relative block">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-secondary">link</span>
            <input
              type="url"
              value={link}
              disabled={disabled}
              maxLength={2048}
              inputMode="url"
              autoComplete="url"
              placeholder={labels.agendaLinkPlaceholder}
              onChange={(event) => onLinkChange(event.target.value)}
              className="h-12 w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest pl-10 pr-4 text-sm text-primary outline-none placeholder:text-on-surface-variant/40 focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
            />
          </span>
          <span className="text-[10px] font-medium leading-relaxed text-on-surface-variant/55">{labels.agendaLinkHint}</span>
        </label>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-bold text-on-surface-variant">
          {labels.agendaDate}
          <input
            type="date"
            value={date}
            disabled={disabled}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-11 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-on-surface-variant">
          {labels.agendaStartTime}
          <input
            type="time"
            value={startTime}
            disabled={disabled}
            onChange={(event) => onStartTimeChange(event.target.value)}
            className="h-11 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-on-surface-variant">
          {labels.agendaEndTime}
          <input
            type="time"
            value={endTime}
            disabled={disabled}
            onChange={(event) => onEndTimeChange(event.target.value)}
            className="h-11 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 text-sm text-primary outline-none focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
          />
        </label>
      </div>

      <p className="-mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/55">
        {labels.agendaTimeZone}
      </p>

      <div className="relative">
        <label className="grid gap-1.5 text-xs font-bold text-on-surface-variant">
          {labels.agendaLocation}
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-secondary">location_on</span>
            <input
              type="text"
              value={locationLabel}
              disabled={disabled}
              maxLength={500}
              autoComplete="off"
              placeholder={labels.agendaLocationPlaceholder}
              onChange={(event) => onLocationChange({ label: event.target.value })}
              className="h-12 w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest pl-10 pr-4 text-sm text-primary outline-none placeholder:text-on-surface-variant/40 focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
            />
          </div>
        </label>

        {(isSearching || searchError || results.length > 0 || (locationLabel.trim().length >= 3 && typeof locationLatitude !== "number" && !isSearching)) && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl shadow-primary/15">
            {isSearching && <p className="px-4 py-3 text-xs font-bold text-on-surface-variant">{labels.addressSearching}</p>}
            {!isSearching && searchError && <p className="px-4 py-3 text-xs font-bold text-error">{searchError}</p>}
            {!isSearching && !searchError && results.length === 0 && (
              <p className="px-4 py-3 text-xs text-on-surface-variant">{labels.addressNoResults}</p>
            )}
            {!isSearching && results.map((result) => (
              <button
                key={`${result.label}-${result.latitude}-${result.longitude}`}
                type="button"
                onClick={() => {
                  onLocationChange(result);
                  setResults([]);
                  setSearchError("");
                }}
                className="flex w-full items-start gap-3 border-b border-outline-variant/15 px-4 py-3 text-left text-sm leading-relaxed text-primary transition hover:bg-secondary/8 last:border-b-0"
              >
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">location_on</span>
                <span>{result.label}</span>
              </button>
            ))}
            <a
              href="https://www.geoapify.com/"
              target="_blank"
              rel="noreferrer"
              className="block px-4 py-2 text-right text-[10px] font-bold text-on-surface-variant/55 hover:text-secondary"
            >
              {labels.addressPoweredBy}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
