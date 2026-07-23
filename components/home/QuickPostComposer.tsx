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
    <div className="grid grid-cols-2 rounded-full bg-surface-container p-1 text-[11px] font-bold">
      {([
        ["AGENDA", labels.agenda],
        ["QUOTE", labels.quote],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setType(value);
            setMessage("");
            if (value === "QUOTE") {
              setAgendaCategory("");
              setAgendaLink("");
            }
          }}
          className={`h-9 rounded-full px-4 transition-all ${
            type === value ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <section className={`w-full overflow-hidden bg-surface-container-lowest ${hideHeader ? "" : "rounded-3xl border border-outline-variant/20 shadow-sm"}`}>
      {!hideHeader && (
        <div className="flex flex-col gap-4 border-b border-outline-variant/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-headline text-lg font-black text-primary">{labels.composeTitle}</h2>
          {typeSelector}
        </div>
      )}

      <div className="p-4 sm:p-5">
        {hideHeader && <div className="mb-4">{typeSelector}</div>}

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
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                    agendaCategory === value
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/30 bg-surface text-on-surface-variant hover:border-secondary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">{icon}</span>
                  {label}
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
            isQuote ? "font-headline text-xl font-semibold italic" : "font-body text-base"
          }`}
        />

        {isAgenda && (
          <div className="mt-4">
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
              onDateChange={setAgendaDate}
              onStartTimeChange={setAgendaStartTime}
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
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm font-bold text-on-surface-variant" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submit("Draft")}
            className="h-11 rounded-full border border-outline-variant/40 text-sm font-black text-on-surface-variant transition hover:bg-surface-container disabled:opacity-50"
          >
            {isSubmitting ? labels.posting : labels.draft}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submit("Published")}
            className="h-11 rounded-full bg-primary text-sm font-black text-on-primary transition hover:bg-tertiary disabled:opacity-50"
          >
            {isSubmitting ? labels.posting : labels.publish}
          </button>
        </div>
      </div>
    </section>
  );
}
