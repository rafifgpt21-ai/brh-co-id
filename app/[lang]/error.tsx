"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { defaultLocale, hasLocale, type Locale } from "@/lib/i18n/config";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const params = useParams<{ lang?: string }>();
  const lang: Locale = hasLocale(params.lang) ? params.lang : defaultLocale;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[62vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-lg bg-error/10 text-error">
        <span className="material-symbols-outlined text-[32px]">error</span>
      </div>
      <h1 className="mt-6 font-headline text-3xl font-black tracking-tight text-primary sm:text-4xl">
        Something did not load cleanly
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-on-surface-variant/75 sm:text-base">
        The page can usually recover with a quick retry. Your current navigation and shared layout stay intact.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-on-primary transition hover:bg-tertiary"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Try again
        </button>
        <Link
          href={`/${lang}`}
          className="tap-target inline-flex items-center justify-center rounded-full border border-outline-variant/60 bg-surface px-6 text-sm font-black text-primary transition hover:border-secondary hover:bg-surface-container-low"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}
