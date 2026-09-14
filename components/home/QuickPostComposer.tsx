"use client";

import { AgendaFields, type AgendaFieldLabels } from "@/components/home/AgendaFields";
import { createQuickPost, type ActiveQuickPostType, type AgendaCategory } from "@/lib/actions/quick-post";
import type { Locale } from "@/lib/i18n/config";
import { useRouter } from "next/navigation";
import { useState } from "react";

type QuickPostLabels = AgendaFieldLabels & {
  composeTitle: string;
  agenda: string;
  quote: string;
  teaching: string;
  engagement: string;
  agendaCategory: string;
  agendaCategoryRequired: string;
  placeholderAgenda: string;
  agendaRequired: string;
  placeholderQuote: string;
  publish: string;
  draft: string;
  posting: string;
  success: string;
  saveError: string;
};

export function QuickPostComposer({
  labels,
  lang,
  hideHeader = false,
  onSubmitStart,
  onSubmitResult,
}: {
  labels: QuickPostLabels;
  lang: Locale;
  hideHeader?: boolean;
  onSubmitStart?: (status: "Published" | "Draft") => void;
  onSubmitResult?: (result: { success: boolean; message: string; status: "Published" | "Draft" }) => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<ActiveQuickPostType>("AGENDA");
  const [agendaCategory, setAgendaCategory] = useState<AgendaCategory | "">("");
  const [content, setContent] = useState("");
  const [agendaDate, setAgendaDate] = useState("");
  const [agendaStartTime, setAgendaStartTime] = useState("");
  const [agendaEndTime, setAgendaEndTime] = useState("");
  const [agendaLink, setAgendaLink] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLatitude, setLocationLatitude] = useState<number | undefined>();
  const [locationLongitude, setLocationLongitude] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isAgenda = type === "AGENDA";
  const isQuote = type === "QUOTE";

  function resetForm() {
    setContent("");
    setAgendaCategory("");
    setAgendaDate("");
    setAgendaStartTime("");
    setAgendaEndTime("");
    setAgendaLink("");
    setLocationLabel("");
    setLocationLatitude(undefined);
    setLocationLongitude(undefined);
  }

  async function submit(status: "Published" | "Draft") {
    if (!content.trim()) {
      setMessage(isQuote ? labels.placeholderQuote : labels.placeholderAgenda);
      return;
    }
    if (isAgenda && !agendaCategory) {
      setMessage(labels.agendaCategoryRequired);
      return;
    }
    if (isAgenda && (!agendaDate || !agendaStartTime)) {
      setMessage(labels.agendaRequired);
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    onSubmitStart?.(status);

    const result = await createQuickPost({
      type,
      content,
      status,
      ...(isAgenda
        ? {
            agendaCategory: agendaCategory || undefined,
            agendaDate,
            agendaStartTime,
            agendaEndTime,
            agendaLink: agendaCategory === "TEACHING" ? agendaLink : "",
            locationLabel,
            ...(typeof locationLatitude === "number" && typeof locationLongitude === "number"
              ? { locationLatitude, locationLongitude }
              : {}),
          }
        : {}),
    });

    if (result.success) {
      resetForm();
      setMessage(labels.success);
      router.refresh();
      onSubmitResult?.({ success: true, message: labels.success, status });
    } else {
      const errorMessage = result.error || labels.saveError;
      setMessage(errorMessage);
      onSubmitResult?.({ success: false, message: errorMessage, status });
    }
    setIsSubmitting(false);
  }

  const typeSelector = (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-container p-1 text-xs font-black">
      {([
        ["AGENDA", labels.agenda, "event"],
        ["QUOTE", labels.quote, "format_quote"],
      ] as const).map(([value, label, icon]) => (
        <button
          key={value}
          type="button"
          aria-pressed={type === value}
          onClick={() => {
            setType(value);
            setMessage("");
            if (value === "QUOTE") {
              setAgendaCategory("");
              setAgendaLink("");
            }
          }}
          className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 transition-all ${
            type === value ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined shrink-0 text-[18px]">{icon}</span>
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <section className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface-container-lowest ${hideHeader ? "" : "rounded-3xl border border-outline-variant/20 shadow-sm"}`}>
      {!hideHeader && (
        <div className="flex shrink-0 flex-col gap-4 border-b border-outline-variant/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-headline text-lg font-black text-primary">{labels.composeTitle}</h2>
          {typeSelector}
        </div>
      )}

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5"
      >
        {hideHeader && <div className="mb-4 sm:mb-5">{typeSelector}</div>}

        {isAgenda && (
          <fieldset className="mb-4">
            <legend className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
              {labels.agendaCategory}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["TEACHING", labels.teaching, "school"],
                ["ENGAGEMENT", labels.engagement, "diversity_3"],
              ] as const).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={agendaCategory === value}
                  onClick={() => {
                    setAgendaCategory(value);
                    if (value !== "TEACHING") setAgendaLink("");
                    setMessage("");
                  }}
                  className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-black transition sm:px-3 ${
                    agendaCategory === value
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/30 bg-surface text-on-surface-variant hover:border-secondary/50"
                  }`}
                >
                  <span className="material-symbols-outlined shrink-0 text-[19px]">{icon}</span>
                  <span className="min-w-0 leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setMessage("");
          }}
          placeholder={isQuote ? labels.placeholderQuote : labels.placeholderAgenda}
          rows={isQuote ? 5 : 4}
          maxLength={2000}
          className={`w-full resize-none rounded-xl border border-outline-variant/25 bg-surface px-4 py-3 text-primary placeholder:text-on-surface-variant/35 focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/10 ${
            isQuote ? "min-h-40 font-headline text-xl font-semibold italic leading-relaxed" : "min-h-32 font-body text-base leading-relaxed"
          }`}
        />

        {isAgenda && (
          <AgendaFields
            labels={labels}
            lang={lang}
            date={agendaDate}
            startTime={agendaStartTime}
            endTime={agendaEndTime}
            link={agendaLink}
            showLink={agendaCategory === "TEACHING"}
            locationLabel={locationLabel}
            locationLatitude={locationLatitude}
            locationLongitude={locationLongitude}
            disabled={isSubmitting}
            onDateChange={(value) => {
              setAgendaDate(value);
              setMessage("");
            }}
            onStartTimeChange={(value) => {
              setAgendaStartTime(value);
              setMessage("");
            }}
            onEndTimeChange={setAgendaEndTime}
            onLinkChange={(value) => {
              setAgendaLink(value);
              setMessage("");
            }}
            onLocationChange={(value) => {
              setLocationLabel(value.label);
              setLocationLatitude(value.latitude);
              setLocationLongitude(value.longitude);
            }}
          />
        )}

      </div>

      <div className="z-20 grid shrink-0 grid-cols-2 gap-3 border-t border-outline-variant/20 bg-surface-container-lowest/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-12px_30px_-24px_rgba(41,47,54,0.45)] backdrop-blur-xl sm:px-5 sm:pb-5">
        {message && (
          <p className="col-span-2 text-sm font-bold text-on-surface-variant" role="status" aria-live="polite">
            {message}
          </p>
        )}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit("Draft")}
          className="min-h-12 rounded-xl border border-outline-variant/40 text-sm font-black text-on-surface-variant transition hover:bg-surface-container disabled:opacity-50 sm:rounded-full"
        >
          {isSubmitting ? labels.posting : labels.draft}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit("Published")}
          className="min-h-12 rounded-xl bg-primary text-sm font-black text-on-primary shadow-sm transition hover:bg-tertiary disabled:opacity-50 sm:rounded-full"
        >
          {isSubmitting ? labels.posting : labels.publish}
        </button>
      </div>
    </section>
  );
}
