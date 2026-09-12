"use client";

import { ANALYTICS_DEDUPE_MS, ANALYTICS_OPTOUT_COOKIE } from "@/lib/analytics/shared";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function trackingIsDisabled() {
  return (
    navigator.doNotTrack === "1" ||
    document.cookie.split(";").some((cookie) => cookie.trim() === `${ANALYTICS_OPTOUT_COOKIE}=1`)
  );
}

function readCampaign() {
  const query = new URLSearchParams(window.location.search);
  return {
    utmSource: query.get("utm_source") || undefined,
    utmMedium: query.get("utm_medium") || undefined,
    utmCampaign: query.get("utm_campaign") || undefined,
  };
}

function readSessionValue(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Tracking still works when storage is unavailable; server-side dedupe remains active.
  }
}

function removeSessionValue(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const record = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      const referrer = previousUrl.current || readSessionValue("brh:analytics:previous-url") || document.referrer || undefined;
      previousUrl.current = window.location.href;
      writeSessionValue("brh:analytics:previous-url", window.location.href);
      if (trackingIsDisabled()) return;

      const dedupeStorageKey = `brh:analytics:last:${pathname}`;
      const lastSent = Number(readSessionValue(dedupeStorageKey) || 0);
      if (Date.now() - lastSent < ANALYTICS_DEDUPE_MS) return;
      writeSessionValue(dedupeStorageKey, String(Date.now()));

      void fetch("/api/analytics/view", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: crypto.randomUUID(),
          pathname,
          referrer,
          ...readCampaign(),
        }),
      }).then((response) => {
        if (!response.ok) removeSessionValue(dedupeStorageKey);
      }).catch(() => removeSessionValue(dedupeStorageKey));
    };

    const recordWhenEnabled = () => record();
    if (document.visibilityState === "visible") {
      record();
    } else {
      document.addEventListener("visibilitychange", record, { once: true });
    }
    window.addEventListener("brh:analytics-enabled", recordWhenEnabled);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", record);
      window.removeEventListener("brh:analytics-enabled", recordWhenEnabled);
    };
  }, [pathname]);

  return null;
}
