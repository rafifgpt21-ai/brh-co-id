"use client";

import { createQuickPost } from "@/lib/actions/quick-post";
import { uploadFiles } from "@/lib/uploadthing";
import { AgendaFields, type AgendaFieldLabels } from "@/components/home/AgendaFields";
import type { Locale } from "@/lib/i18n/config";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { compressImage, formatFileSize, type ImageCompressionResult } from "@/lib/image-compression";
import { createUploadReceipt, type UploadReceipt } from "@/lib/uploadthing-types";
import { rollbackUploadedFiles } from "@/lib/actions/uploadthing";

type QuickPostLabels = AgendaFieldLabels & {
  composeTitle: string;
  normal: string;
  agenda: string;
  quote: string;
  placeholderNormal: string;
  placeholderAgenda: string;
  agendaRequired: string;
  placeholderQuote: string;
  addImage: string;
  changeImage: string;
  removeImage: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressionTokenRef = useRef<symbol | null>(null);
  const [type, setType] = useState<"NORMAL" | "AGENDA" | "QUOTE">("NORMAL");
  const [content, setContent] = useState("");
  const [agendaDate, setAgendaDate] = useState("");
  const [agendaStartTime, setAgendaStartTime] = useState("");
  const [agendaEndTime, setAgendaEndTime] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLatitude, setLocationLatitude] = useState<number | undefined>();
  const [locationLongitude, setLocationLongitude] = useState<number | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageCompression, setImageCompression] = useState<ImageCompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    const token = Symbol("quick-post-image");
    compressionTokenRef.current = token;
    setIsCompressing(true);
    setMessage("");
    try {
      const result = await compressImage(file, "quickPost");
      if (compressionTokenRef.current !== token) return;
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(result.file);
      setImagePreview(URL.createObjectURL(result.file));
      setImageCompression(result);
    } catch (error) {
      if (compressionTokenRef.current === token) {
        setMessage(error instanceof Error ? error.message : labels.saveError);
      }
    } finally {
      if (compressionTokenRef.current === token) {
        compressionTokenRef.current = null;
        setIsCompressing(false);
      }
    }
  };

  const removeImage = () => {
    compressionTokenRef.current = Symbol("cancelled");
    setIsCompressing(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setImageCompression(null);
  };

  const submit = async (status: "Published" | "Draft") => {
    if (!content.trim()) {
      setMessage(type === "QUOTE" ? labels.placeholderQuote : type === "AGENDA" ? labels.placeholderAgenda : labels.placeholderNormal);
      return;
    }

    if (type === "AGENDA" && (!agendaDate || !agendaStartTime)) {
      setMessage(labels.agendaRequired);
      return;
    }
    if (isCompressing) {
      setMessage("Tunggu sampai kompresi gambar selesai.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    onSubmitStart?.(status);

    const uploadedReceipts: UploadReceipt[] = [];
    try {
      let imageUrl = "";
      if (type === "NORMAL" && imageFile) {
        const uploaded = await uploadFiles("imageUploader", { files: [imageFile] });
        imageUrl = uploaded[0]?.ufsUrl || uploaded[0]?.url || "";
        if (uploaded[0]) uploadedReceipts.push(createUploadReceipt(uploaded[0], "image"));
      }

      const agendaPayload = type === "AGENDA"
        ? {
            agendaDate,
            agendaStartTime,
            agendaEndTime,
            locationLabel,
            ...(typeof locationLatitude === "number" && typeof locationLongitude === "number"
              ? { locationLatitude, locationLongitude }
              : {}),
          }
        : {};

      const result = await createQuickPost({
        type,
        content,
        imageUrl,
        ...agendaPayload,
        status,
        newUploads: uploadedReceipts,
      });

      if (!result.success) {
        if (uploadedReceipts.length > 0) await rollbackUploadedFiles(uploadedReceipts);
        const errorMessage = result.error || labels.saveError;
        setMessage(errorMessage);
        onSubmitResult?.({ success: false, message: errorMessage, status });
        return;
      }

      setContent("");
      setAgendaDate("");
      setAgendaStartTime("");
      setAgendaEndTime("");
      setLocationLabel("");
      setLocationLatitude(undefined);
      setLocationLongitude(undefined);
      removeImage();
      setMessage(labels.success);
      onSubmitResult?.({ success: true, message: labels.success, status });
      router.refresh();
    } catch (error) {
      console.error("Note submit error:", error);
      if (uploadedReceipts.length > 0) {
        try {
          await rollbackUploadedFiles(uploadedReceipts);
        } catch (cleanupError) {
          console.error("Quick post upload rollback failed:", cleanupError);
        }
      }
      const errorMessage = error instanceof Error && error.message
        ? `${labels.saveError}: ${error.message}`
        : labels.saveError;
      setMessage(errorMessage);
      onSubmitResult?.({ success: false, message: errorMessage, status });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuote = type === "QUOTE";
  const isAgenda = type === "AGENDA";
  const isNormal = type === "NORMAL";

  const selectType = (nextType: "NORMAL" | "AGENDA" | "QUOTE") => {
    setType(nextType);
    if (nextType !== "NORMAL") removeImage();
    setMessage("");
  };

  return (
    <section className={`w-full overflow-hidden bg-surface-container-lowest ${hideHeader ? "" : "rounded-3xl border border-outline-variant/20 shadow-sm"}`}>
      {!hideHeader && (
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/15 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-secondary text-[22px]">edit_square</span>
          <h2 className="font-headline text-sm font-black text-primary tracking-tight truncate">
            {labels.composeTitle}
          </h2>
        </div>

        <div className="grid grid-cols-3 rounded-full bg-surface-container p-1 text-[11px] font-bold shrink-0">
          <button
            type="button"
            onClick={() => selectType("NORMAL")}
            className={`h-8 rounded-full px-3 transition-all ${isNormal ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            {labels.normal}
          </button>
          <button
            type="button"
            onClick={() => selectType("AGENDA")}
            className={`h-8 rounded-full px-3 transition-all ${isAgenda ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            {labels.agenda}
          </button>
          <button
            type="button"
            onClick={() => selectType("QUOTE")}
            className={`h-8 rounded-full px-3 transition-all ${isQuote ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            {labels.quote}
          </button>
        </div>
      </div>
      )}

      <div className="p-4 sm:p-5">
        {hideHeader && (
          <div className="mb-4 grid w-full grid-cols-3 rounded-full bg-surface-container p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => selectType("NORMAL")}
              className={`h-9 rounded-full px-4 transition-all ${isNormal ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {labels.normal}
            </button>
            <button
              type="button"
              onClick={() => selectType("AGENDA")}
              className={`h-9 rounded-full px-4 transition-all ${isAgenda ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {labels.agenda}
            </button>
            <button
              type="button"
              onClick={() => selectType("QUOTE")}
              className={`h-9 rounded-full px-4 transition-all ${isQuote ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {labels.quote}
            </button>
          </div>
        )}

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={isQuote ? labels.placeholderQuote : isAgenda ? labels.placeholderAgenda : labels.placeholderNormal}
          rows={isQuote ? 5 : isAgenda ? 4 : 4}
          maxLength={2000}
          className={`w-full resize-none bg-transparent text-primary placeholder:text-on-surface-variant/35 focus:outline-none font-body leading-relaxed ${isQuote ? "text-xl sm:text-2xl font-semibold italic" : "text-base sm:text-lg"}`}
        />

        {isAgenda && (
          <AgendaFields
            labels={labels}
            lang={lang}
            date={agendaDate}
            startTime={agendaStartTime}
            endTime={agendaEndTime}
            locationLabel={locationLabel}
            locationLatitude={locationLatitude}
            locationLongitude={locationLongitude}
            disabled={isSubmitting}
            onDateChange={setAgendaDate}
            onStartTimeChange={setAgendaStartTime}
            onEndTimeChange={setAgendaEndTime}
            onLocationChange={(location) => {
              setLocationLabel(location.label);
              setLocationLatitude(location.latitude);
              setLocationLongitude(location.longitude);
            }}
          />
        )}

        {imagePreview && isNormal && (
          <div className="relative mt-4 aspect-16/10 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container">
            <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md active:scale-95"
              title={labels.removeImage}
            >
              <span className="material-symbols-outlined text-[19px]">close</span>
            </button>
          </div>
        )}

        {isCompressing && isNormal && <p className="mt-3 text-xs font-bold text-secondary">Mengompresi gambar...</p>}
        {imageCompression && isNormal && (
          <p className="mt-3 text-xs font-bold text-on-surface-variant/60">
            {formatFileSize(imageCompression.originalBytes)} → {formatFileSize(imageCompression.finalBytes)}
            {imageCompression.savedPercent > 0 ? ` · hemat ${imageCompression.savedPercent}%` : " · sudah optimal"}
          </p>
        )}

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleFileChange} />

        {message && (
          <p className="mt-3 rounded-2xl bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant">
            {message}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {isNormal && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isCompressing}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-lowest px-4 text-xs font-black text-primary transition-all hover:bg-surface-container active:scale-95 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[19px]">add_photo_alternate</span>
                {imagePreview ? labels.changeImage : labels.addImage}
              </button>
            )}
            <span className="text-[11px] font-bold text-on-surface-variant/50">
              {content.length}/2000
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => submit("Draft")}
              disabled={isSubmitting || isCompressing}
              className="h-12 rounded-full bg-surface-container px-5 text-xs font-black text-on-surface-variant transition-all active:scale-95 disabled:opacity-60"
            >
              {labels.draft}
            </button>
            <button
              type="button"
              onClick={() => submit("Published")}
              disabled={isSubmitting || isCompressing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-xs font-black text-on-primary shadow-lg shadow-primary/15 transition-all active:scale-95 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">{isSubmitting ? "sync" : "publish"}</span>
              {isSubmitting ? labels.posting : labels.publish}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
