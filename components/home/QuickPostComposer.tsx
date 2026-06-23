"use client";

import { createQuickPost } from "@/lib/actions/quick-post";
import { uploadFiles } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type QuickPostLabels = {
  composeTitle: string;
  normal: string;
  quote: string;
  placeholderNormal: string;
  placeholderQuote: string;
  addImage: string;
  changeImage: string;
  removeImage: string;
  publish: string;
  draft: string;
  posting: string;
  success: string;
};

export function QuickPostComposer({
  labels,
  hideHeader = false,
}: {
  labels: QuickPostLabels;
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"NORMAL" | "QUOTE">("NORMAL");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  };

  const submit = async (status: "Published" | "Draft") => {
    if (!content.trim()) {
      setMessage(type === "QUOTE" ? labels.placeholderQuote : labels.placeholderNormal);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      let imageUrl = "";
      if (type === "NORMAL" && imageFile) {
        const uploaded = await uploadFiles("imageUploader", { files: [imageFile] });
        imageUrl = uploaded[0]?.ufsUrl || uploaded[0]?.url || "";
      }

      const result = await createQuickPost({
        type,
        content,
        imageUrl,
        status,
      });

      if (!result.success) {
        setMessage(result.error || "Gagal menyimpan catatan");
        return;
      }

      setContent("");
      removeImage();
      setMessage(labels.success);
      router.refresh();
    } catch (error) {
      console.error("Note submit error:", error);
      setMessage("Gagal menyimpan catatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuote = type === "QUOTE";

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

        <div className="grid grid-cols-2 rounded-full bg-surface-container p-1 text-[11px] font-bold shrink-0">
          <button
            type="button"
            onClick={() => setType("NORMAL")}
            className={`h-8 rounded-full px-3 transition-all ${!isQuote ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            {labels.normal}
          </button>
          <button
            type="button"
            onClick={() => {
              setType("QUOTE");
              removeImage();
            }}
            className={`h-8 rounded-full px-3 transition-all ${isQuote ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            {labels.quote}
          </button>
        </div>
      </div>
      )}

      <div className="p-4 sm:p-5">
        {hideHeader && (
          <div className="mb-4 grid w-fit grid-cols-2 rounded-full bg-surface-container p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setType("NORMAL")}
              className={`h-9 rounded-full px-4 transition-all ${!isQuote ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {labels.normal}
            </button>
            <button
              type="button"
              onClick={() => {
                setType("QUOTE");
                removeImage();
              }}
              className={`h-9 rounded-full px-4 transition-all ${isQuote ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {labels.quote}
            </button>
          </div>
        )}

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={isQuote ? labels.placeholderQuote : labels.placeholderNormal}
          rows={isQuote ? 5 : 4}
          maxLength={2000}
          className={`w-full resize-none bg-transparent text-primary placeholder:text-on-surface-variant/35 focus:outline-none font-body leading-relaxed ${isQuote ? "text-xl sm:text-2xl font-semibold italic" : "text-base sm:text-lg"}`}
        />

        {imagePreview && !isQuote && (
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

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {message && (
          <p className="mt-3 rounded-2xl bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant">
            {message}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {!isQuote && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
              className="h-12 rounded-full bg-surface-container px-5 text-xs font-black text-on-surface-variant transition-all active:scale-95 disabled:opacity-60"
            >
              {labels.draft}
            </button>
            <button
              type="button"
              onClick={() => submit("Published")}
              disabled={isSubmitting}
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
