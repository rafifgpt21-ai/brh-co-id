"use client";

import { AgendaFields, type AgendaFieldLabels } from "@/components/home/AgendaFields";
import { ShareActions } from "@/components/common/ShareActions";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { deleteQuickPost, updateQuickPost, updateQuickPostStatus, type QuickPostType } from "@/lib/actions/quick-post";
import { formatLocalizedDate, getDateLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { buildAbsoluteUrl } from "@/lib/share-url";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { uploadFiles } from "@/lib/uploadthing";
import { compressImage, formatFileSize, type ImageCompressionResult } from "@/lib/image-compression";
import { createUploadReceipt, type UploadReceipt } from "@/lib/uploadthing-types";
import { rollbackUploadedFiles } from "@/lib/actions/uploadthing";

export type QuickPostItem = {
  id: string;
  type: string;
  content: string;
  imageUrl?: string | null;
  sourcePostId?: string | null;
  sourceTitle?: string | null;
  sourceSlug?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  locationLabel?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  status: string;
  createdAt: Date | string;
};

export type QuickPostColumns = Record<QuickPostType, QuickPostItem[]>;

type QuickPostFeedLabels = AgendaFieldLabels & {
  normal: string;
  agenda: string;
  quote: string;
  emptyNormal: string;
  emptyAgenda: string;
  emptyQuote: string;
  emptyDescription: string;
  agendaRequired: string;
  readMore: string;
  showLess: string;
  viewAll: string;
  viewAllNormal: string;
  viewAllAgenda: string;
  viewAllQuote: string;
  draftBadge: string;
  completedBadge: string;
  publish: string;
  edit: string;
  save: string;
  cancel: string;
  delete: string;
  deleteConfirmTitle: string;
  deleteConfirmDescription: string;
  share: string;
  shareToFacebook: string;
  shareToWhatsapp: string;
  copyLink: string;
  linkCopied: string;
  addImage: string;
  changeImage: string;
  removeImage: string;
  sourceArticle: string;
  readSource: string;
};

const COLUMN_TYPES: QuickPostType[] = ["NORMAL", "AGENDA", "QUOTE"];

function truncate(content: string, length: number) {
  return content.length > length ? `${content.slice(0, length).trim()}...` : content;
}

function getQuickPostShareTitle(post: QuickPostItem, agendaLabel: string) {
  const content = truncate(post.content.replace(/\s+/g, " ").trim(), 180);
  if (post.type === "QUOTE") return `"${content}"`;
  if (post.type === "AGENDA") return `${agendaLabel}: ${content}`;
  return content;
}

function getWibFormParts(value?: Date | string | null) {
  if (!value) return { date: "", time: "" };
  const wibValue = new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000);
  const year = wibValue.getUTCFullYear();
  const month = String(wibValue.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibValue.getUTCDate()).padStart(2, "0");
  const hours = String(wibValue.getUTCHours()).padStart(2, "0");
  const minutes = String(wibValue.getUTCMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function formatAgendaDate(value: Date | string, lang: Locale) {
  return new Intl.DateTimeFormat(getDateLocale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatAgendaTime(value: Date | string, lang: Locale) {
  return new Intl.DateTimeFormat(getDateLocale(lang), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function QuickPostFeed({
  quickPosts,
  isAdmin,
  lang,
  labels,
  archiveHrefs,
  visibleTypes = COLUMN_TYPES,
  variant = "full",
}: {
  quickPosts: QuickPostColumns;
  isAdmin: boolean;
  lang: Locale;
  labels: QuickPostFeedLabels;
  archiveHrefs?: Partial<Record<QuickPostType, string>>;
  visibleTypes?: QuickPostType[];
  variant?: "preview" | "full";
}) {
  const router = useRouter();
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editCompressionTokenRef = useRef<symbol | null>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const quoteTextRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [activeType, setActiveType] = useState<QuickPostType>(visibleTypes[0] ?? "NORMAL");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [clampedQuotes, setClampedQuotes] = useState<Record<string, boolean>>({});
  const [editingPost, setEditingPost] = useState<QuickPostItem | null>(null);
  const [deletingPost, setDeletingPost] = useState<QuickPostItem | null>(null);
  const [editType, setEditType] = useState<QuickPostType>("NORMAL");
  const [editContent, setEditContent] = useState("");
  const [editAgendaDate, setEditAgendaDate] = useState("");
  const [editAgendaStartTime, setEditAgendaStartTime] = useState("");
  const [editAgendaEndTime, setEditAgendaEndTime] = useState("");
  const [editLocationLabel, setEditLocationLabel] = useState("");
  const [editLocationLatitude, setEditLocationLatitude] = useState<number | undefined>();
  const [editLocationLongitude, setEditLocationLongitude] = useState<number | undefined>();
  const [editMessage, setEditMessage] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageCompression, setEditImageCompression] = useState<ImageCompressionResult | null>(null);
  const [isEditCompressing, setIsEditCompressing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isPreview = variant === "preview";

  useEffect(() => {
    return () => {
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    };
  }, [editImagePreview]);

  useEffect(() => {
    if (!isPreview) return;

    const updateClampedQuotes = () => {
      setClampedQuotes((current) => {
        const next = { ...current };
        let changed = false;

        Object.entries(quoteTextRefs.current).forEach(([id, element]) => {
          if (!element || expanded[id]) return;
          const isClamped = element.scrollHeight > element.clientHeight + 1;
          if (next[id] !== isClamped) {
            next[id] = isClamped;
            changed = true;
          }
        });

        return changed ? next : current;
      });
    };

    const animationFrame = window.requestAnimationFrame(updateClampedQuotes);
    const resizeObserver = new ResizeObserver(updateClampedQuotes);
    Object.values(quoteTextRefs.current).forEach((element) => {
      if (element) resizeObserver.observe(element);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [expanded, isPreview, quickPosts.QUOTE]);

  useEffect(() => {
    if (!deletingPost) return;

    deleteCancelButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setDeletingPost(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deletingPost, isPending]);

  const columnLabels: Record<QuickPostType, string> = {
    NORMAL: labels.normal,
    AGENDA: labels.agenda,
    QUOTE: labels.quote,
  };
  const emptyLabels: Record<QuickPostType, string> = {
    NORMAL: labels.emptyNormal,
    AGENDA: labels.emptyAgenda,
    QUOTE: labels.emptyQuote,
  };
  const columnIcons: Record<QuickPostType, string> = {
    NORMAL: "lightbulb",
    AGENDA: "event",
    QUOTE: "format_quote",
  };
  const viewAllLabels: Record<QuickPostType, string> = {
    NORMAL: labels.viewAllNormal,
    AGENDA: labels.viewAllAgenda,
    QUOTE: labels.viewAllQuote,
  };

  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  const publishQuickPost = (id: string) => {
    startTransition(async () => {
      const result = await updateQuickPostStatus({ id, status: "Published" });
      if (!result.success) alert(result.error || "Gagal publish postingan");
      router.refresh();
    });
  };

  const confirmQuickPostDeletion = () => {
    if (!deletingPost) return;
    const id = deletingPost.id;

    startTransition(async () => {
      const result = await deleteQuickPost(id);
      if (!result.success) {
        alert(result.error || "Gagal menghapus postingan");
        return;
      }
      setDeletingPost(null);
      router.refresh();
    });
  };

  const startEdit = (post: QuickPostItem) => {
    const type: QuickPostType = post.type === "AGENDA" ? "AGENDA" : post.type === "QUOTE" ? "QUOTE" : "NORMAL";
    const start = getWibFormParts(post.startsAt);
    const end = getWibFormParts(post.endsAt);
    setEditingPost(post);
    setEditType(type);
    setEditContent(post.content);
    setEditAgendaDate(start.date);
    setEditAgendaStartTime(start.time);
    setEditAgendaEndTime(end.time);
    setEditLocationLabel(post.locationLabel || "");
    setEditLocationLatitude(post.locationLatitude ?? undefined);
    setEditLocationLongitude(post.locationLongitude ?? undefined);
    setEditImageUrl(post.imageUrl || "");
    setEditImageFile(null);
    setEditImageCompression(null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview("");
    setEditMessage("");
  };

  const clearEditStagedImage = () => {
    editCompressionTokenRef.current = Symbol("cancelled");
    setIsEditCompressing(false);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview("");
    setEditImageFile(null);
    setEditImageCompression(null);
  };

  const cancelEdit = () => {
    clearEditStagedImage();
    setEditingPost(null);
    setEditContent("");
    setEditMessage("");
  };

  const handleEditImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const token = Symbol("edit-quick-post-image");
    editCompressionTokenRef.current = token;
    setIsEditCompressing(true);
    setEditMessage("");
    try {
      const result = await compressImage(file, "quickPost");
      if (editCompressionTokenRef.current !== token) return;
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
      setEditImageFile(result.file);
      setEditImagePreview(URL.createObjectURL(result.file));
      setEditImageCompression(result);
    } catch (error) {
      if (editCompressionTokenRef.current === token) {
        setEditMessage(error instanceof Error ? error.message : "Gagal mengompresi gambar");
      }
    } finally {
      if (editCompressionTokenRef.current === token) {
        editCompressionTokenRef.current = null;
        setIsEditCompressing(false);
      }
    }
  };

  const removeEditImage = () => {
    clearEditStagedImage();
    setEditImageUrl("");
  };

  const saveEdit = () => {
    if (!editingPost) return;
    if (!editContent.trim()) {
      setEditMessage("Konten tidak boleh kosong");
      return;
    }
    if (editType === "AGENDA" && (!editAgendaDate || !editAgendaStartTime)) {
      setEditMessage(labels.agendaRequired);
      return;
    }
    if (isEditCompressing) {
      setEditMessage("Tunggu sampai kompresi gambar selesai.");
      return;
    }

    startTransition(async () => {
      const uploadedReceipts: UploadReceipt[] = [];
      try {
        let finalImageUrl = editImageUrl;
        if (editType === "NORMAL" && editImageFile) {
          const uploaded = await uploadFiles("imageUploader", { files: [editImageFile] });
          finalImageUrl = uploaded[0]?.ufsUrl || uploaded[0]?.url || "";
          if (uploaded[0]) uploadedReceipts.push(createUploadReceipt(uploaded[0], "image"));
        }
        const agendaPayload = editType === "AGENDA"
          ? {
              agendaDate: editAgendaDate,
              agendaStartTime: editAgendaStartTime,
              agendaEndTime: editAgendaEndTime,
              locationLabel: editLocationLabel,
              ...(typeof editLocationLatitude === "number" && typeof editLocationLongitude === "number"
                ? { locationLatitude: editLocationLatitude, locationLongitude: editLocationLongitude }
                : {}),
            }
          : {};
        const result = await updateQuickPost({
          id: editingPost.id,
          type: editType,
          content: editContent,
          imageUrl: editType === "NORMAL" ? finalImageUrl : "",
          newUploads: uploadedReceipts,
          ...agendaPayload,
        });
        if (!result.success) {
          if (uploadedReceipts.length > 0) await rollbackUploadedFiles(uploadedReceipts);
          setEditMessage(result.error || "Gagal mengubah postingan");
          return;
        }
        cancelEdit();
        router.refresh();
      } catch (error) {
        if (uploadedReceipts.length > 0) {
          try {
            await rollbackUploadedFiles(uploadedReceipts);
          } catch (cleanupError) {
            console.error("Quick post edit rollback failed:", cleanupError);
          }
        }
        setEditMessage(error instanceof Error && error.message
          ? `Gagal mengubah postingan: ${error.message}`
          : "Gagal mengubah postingan");
      }
    });
  };

  const shareLabels = {
    share: labels.share,
    shareToFacebook: labels.shareToFacebook,
    shareToWhatsapp: labels.shareToWhatsapp,
    copyLink: labels.copyLink,
    linkCopied: labels.linkCopied,
  };

  return (
    <section id="notes" className="w-full">
      {visibleTypes.length > 1 && <div className={`${isPreview ? "mb-3" : "mb-5"} flex items-center justify-between gap-3 lg:hidden`} role="tablist" aria-label="Quickpost categories">
        <div className="grid min-w-0 flex-1 grid-cols-3 rounded-full border border-outline-variant/30 bg-surface-container-low/55 p-1">
          {visibleTypes.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={activeType === type}
              aria-controls={`quick-post-column-${type.toLowerCase()}`}
              onClick={() => setActiveType(type)}
              className={`min-w-0 truncate rounded-full px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide transition sm:text-xs ${activeType === type ? "bg-primary text-on-primary" : "text-on-surface-variant/70 hover:text-primary"}`}
            >
              {columnLabels[type]}
            </button>
          ))}
        </div>
      </div>}

      <div className={`grid grid-cols-1 ${isPreview ? "gap-5 lg:gap-6 xl:gap-7" : "gap-5"} ${visibleTypes.length === 1 ? "mx-auto max-w-3xl" : "lg:grid-cols-3"} ${isPreview ? "lg:items-stretch" : "lg:items-start"}`}>
        {visibleTypes.map((type) => {
          const previewPostLimit = type === "AGENDA" ? 3 : 1;
          const posts = isPreview ? quickPosts[type].slice(0, previewPostLimit) : quickPosts[type];
          return (
            <div key={type} className={`${activeType === type || visibleTypes.length === 1 ? "flex" : "hidden"} min-w-0 flex-col ${isPreview ? "gap-3.5 lg:gap-5" : "gap-4"} lg:flex`}>
              <section
                data-quick-post-column={type}
                id={`quick-post-column-${type.toLowerCase()}`}
                role="tabpanel"
                aria-label={columnLabels[type]}
                className={`min-w-0 overflow-hidden border bg-surface-container-lowest transition duration-300 ${isPreview ? "relative flex flex-1 flex-col rounded-[1.75rem] border-outline-variant/20 shadow-[0_22px_65px_-38px_rgba(55,34,28,0.38)] hover:-translate-y-1 hover:border-secondary/25 hover:shadow-[0_28px_70px_-36px_rgba(122,49,31,0.38)] sm:min-h-[620px] lg:min-h-[clamp(680px,76svh,760px)]" : "block rounded-[1.75rem] border-outline-variant/30 shadow-sm"}`}
              >
              {isPreview && <span className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-secondary/55 to-transparent" />}
              <header className={`flex items-center ${isPreview ? "gap-3.5 px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6 lg:px-7" : "gap-3 border-b border-outline-variant/20 bg-surface-container-low px-5 py-5"}`}>
                <span className={isPreview ? "grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary/10 text-secondary ring-1 ring-secondary/10" : "grid h-10 w-10 place-items-center rounded-full bg-secondary/10 text-secondary"}>
                  <span className={`material-symbols-outlined ${isPreview ? "text-[20px]" : "text-[21px]"}`}>{columnIcons[type]}</span>
                </span>
                <div className="min-w-0">
                  {isPreview && <span className="mb-0.5 block text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant/45">Quickpost</span>}
                  <h2 className={`font-headline tracking-tight text-primary ${isPreview ? "text-lg font-black sm:text-xl lg:text-[1.3rem]" : "text-xl font-black sm:text-2xl"}`}>
                    {columnLabels[type]}
                  </h2>
                </div>
              </header>

              <div className={`${isPreview ? "flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6 lg:px-7" : "px-5 py-2 sm:px-6"}`}>
                {posts.length === 0 ? (
                  <div className={`grid place-items-center text-center ${isPreview ? "min-h-56 flex-1 py-10" : "min-h-56 py-10"}`}>
                    <div>
                      <span className={`material-symbols-outlined mx-auto grid place-items-center text-secondary/35 ${isPreview ? "h-14 w-14 rounded-2xl border border-outline-variant/20 bg-surface-container-low text-[25px] shadow-sm" : "text-3xl"}`}>{columnIcons[type]}</span>
                      <h3 className={`font-headline text-primary ${isPreview ? "mt-4 text-base font-black" : "mt-3 text-lg font-black"}`}>{emptyLabels[type]}</h3>
                      <p className={`mx-auto mt-2 max-w-xs text-xs leading-relaxed text-on-surface-variant/55 ${isPreview ? "max-w-[17rem]" : ""}`}>{labels.emptyDescription}</p>
                    </div>
                  </div>
                ) : posts.map((post) => {
                  const isQuote = type === "QUOTE";
                  const isAgenda = type === "AGENDA";
                  const isExpanded = Boolean(expanded[post.id]);
                  const previewLimit = isPreview && isAgenda ? 120 : isPreview ? 180 : 280;
                  const isLong = isPreview && isQuote ? Boolean(clampedQuotes[post.id]) : post.content.length > previewLimit;
                  const visibleContent = isExpanded || (isPreview && isQuote) ? post.content : truncate(post.content, previewLimit);
                  const completionTime = post.endsAt || post.startsAt;
                  const isCompleted = isAgenda && completionTime ? new Date(completionTime) < new Date() : false;
                  const shareUrl = buildAbsoluteUrl(`${withLocale("/catatan", lang)}#quick-post-${post.id}`);
                  const showPostMeta = (post.status === "Draft" && isAdmin) || isCompleted || !isAgenda;

                  return (
                    <article key={post.id} id={`quick-post-${post.id}`} className={`group relative scroll-mt-24 border-b border-outline-variant/20 last:border-b-0 ${isPreview ? `flex flex-col ${isAgenda ? "min-h-0 py-2" : "h-full flex-1 pb-1 pt-2"}` : "py-6"}`}>
                      {isAdmin && (
                        <div className={`absolute right-0 top-4 z-10 flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest/95 p-1 shadow-lg transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
                          <button type="button" onClick={() => startEdit(post)} className="grid h-8 w-8 place-items-center rounded-full text-secondary hover:bg-secondary/10" aria-label={labels.edit} title={labels.edit}>
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeletingPost(post)} className="grid h-8 w-8 place-items-center rounded-full text-error hover:bg-error/10" aria-label={labels.delete} title={labels.delete}>
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      )}

                      {post.imageUrl && type === "NORMAL" && (
                        <div className={`relative overflow-hidden bg-surface-container-low ${isPreview ? "mb-5 aspect-square w-full rounded-[1.35rem] border border-outline-variant/15" : "mb-5 aspect-16/10 rounded-2xl"}`}>
                          <Image src={post.imageUrl} alt="" fill sizes={isPreview ? "(max-width: 1024px) 100vw, 33vw" : "(max-width: 1024px) 100vw, 33vw"} className={`${isPreview ? "object-contain" : "object-cover"} transition duration-700 group-hover:scale-[1.025]`} />
                          {isPreview && <span className="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/35" />}
                        </div>
                      )}

                      {showPostMeta && (
                        <div className={`${isPreview ? "mb-3" : "mb-4"} flex flex-wrap items-center gap-2 pr-16`}>
                          {post.status === "Draft" && isAdmin && <span className="rounded-full bg-surface-container px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{labels.draftBadge}</span>}
                          {isCompleted && <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">{labels.completedBadge}</span>}
                          {!isAgenda && <span className="text-[11px] font-bold text-on-surface-variant/55">{formatLocalizedDate(post.createdAt, lang)}</span>}
                        </div>
                      )}

                      {isAgenda && post.startsAt ? (
                        <div className={`${isPreview ? "mb-2 rounded-xl p-3 sm:rounded-2xl" : "mb-5 rounded-2xl p-4"} bg-secondary/8 text-primary`}>
                          <p className="flex items-start gap-2 text-sm font-black leading-snug">
                            <span className="material-symbols-outlined text-[19px] text-secondary">calendar_month</span>
                            <span>{formatAgendaDate(post.startsAt, lang)}</span>
                          </p>
                          <p className={`${isPreview ? "mt-1.5" : "mt-2"} flex items-center gap-2 text-xs font-bold text-on-surface-variant`}>
                            <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                            <span>{formatAgendaTime(post.startsAt, lang)}{post.endsAt ? `–${formatAgendaTime(post.endsAt, lang)}` : ""} WIB</span>
                          </p>
                          {post.locationLabel && (
                            <p className={`${isPreview ? "mt-1.5 line-clamp-1" : "mt-2"} flex items-start gap-2 text-xs leading-relaxed text-on-surface-variant`}>
                              <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">location_on</span>
                              <span>{post.locationLabel}</span>
                            </p>
                          )}

                          <button type="button" onClick={() => toggleExpanded(post.id)} className={`${isPreview ? "mt-2 pt-2" : "mt-4 pt-4"} block w-full border-t border-secondary/15 text-left`}>
                            <p className={`whitespace-pre-wrap text-pretty font-body text-sm leading-relaxed text-on-surface ${isPreview ? "sm:text-sm" : "sm:text-base"} ${isPreview && !isExpanded ? "line-clamp-2" : ""}`}>{visibleContent}</p>
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => toggleExpanded(post.id)} className="block w-full text-left">
                          {isQuote ? (
                          <span className={isPreview ? "relative block rounded-[1.35rem] bg-surface-container-low/55 p-5 ring-1 ring-outline-variant/15 sm:p-6" : "block"}>
                            {isPreview && <span className="material-symbols-outlined absolute right-4 top-3 text-[34px] text-secondary/12">format_quote</span>}
                            <span
                              ref={isPreview ? (element) => {
                                if (element) quoteTextRefs.current[post.id] = element;
                                else delete quoteTextRefs.current[post.id];
                              } : undefined}
                              data-quote-content={isPreview ? post.id : undefined}
                              className={`relative block text-pretty font-headline italic tracking-[-0.02em] text-primary ${isPreview ? `text-lg font-semibold leading-[1.5] sm:text-xl ${isExpanded ? "" : "line-clamp-[13]"}` : "text-xl font-black leading-tight sm:text-2xl"}`}
                            >&ldquo;{visibleContent}&rdquo;</span>
                          </span>
                          ) : (
                            <p className={`whitespace-pre-wrap text-pretty font-body text-sm leading-relaxed text-on-surface sm:text-base ${isPreview && !isExpanded ? "line-clamp-4" : ""}`}>{visibleContent}</p>
                          )}
                        </button>
                      )}

                      {post.sourceSlug && post.sourceTitle && (
                        <OptimisticLink
                          href={withLocale(`/post/${post.sourceSlug}`, lang)}
                          className={`${isPreview ? "mt-4 rounded-xl p-3" : "mt-5 rounded-2xl p-4"} group/source flex items-center gap-3 border border-outline-variant/25 bg-surface-container-low transition hover:border-secondary/35 hover:bg-secondary/5`}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary">
                            <span className="material-symbols-outlined text-[20px]">article</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-secondary">{labels.sourceArticle}</span>
                            <span className="mt-1 block line-clamp-2 text-sm font-bold leading-snug text-primary">{post.sourceTitle}</span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-wider text-secondary sm:flex">
                            {labels.readSource}
                            <span className="material-symbols-outlined text-[17px] transition-transform group-hover/source:translate-x-0.5">arrow_forward</span>
                          </span>
                        </OptimisticLink>
                      )}

                      <div className={`${isPreview ? `${isAgenda ? "mt-0 min-h-9 pt-2" : "mt-auto min-h-12 pt-5"} flex items-end border-t border-outline-variant/15` : "mt-5"} flex flex-wrap items-center justify-between gap-3`}>
                        {isLong ? (
                          <button type="button" onClick={() => toggleExpanded(post.id)} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary">
                            {isExpanded ? labels.showLess : labels.readMore}
                            <span className="material-symbols-outlined text-[16px]">{isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}</span>
                          </button>
                        ) : <span />}
                        <ShareActions url={shareUrl} title={getQuickPostShareTitle(post, labels.agenda)} labels={shareLabels} variant="quick" />
                      </div>

                      {isAdmin && post.status === "Draft" && (
                        <button type="button" onClick={() => publishQuickPost(post.id)} disabled={isPending} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-[10px] font-black uppercase tracking-wider text-on-primary disabled:opacity-60">
                          <span className="material-symbols-outlined text-[16px]">publish</span>
                          {labels.publish}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
              </section>

              {isPreview && archiveHrefs?.[type] && (
                <OptimisticLink href={archiveHrefs[type]} className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-5 text-[10px] font-black uppercase tracking-wider text-primary shadow-[0_12px_30px_-22px_rgba(55,34,28,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-secondary/30 hover:text-secondary hover:shadow-[0_16px_34px_-22px_rgba(122,49,31,0.5)] active:translate-y-0 active:scale-[0.98]">
                  {viewAllLabels[type]}
                  <span className="material-symbols-outlined text-[18px]">east</span>
                </OptimisticLink>
              )}
            </div>
          );
        })}
      </div>

      {editingPost && (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="font-headline text-xl font-black text-primary">{labels.edit}</h3>
              <button type="button" onClick={cancelEdit} className="grid h-10 w-10 place-items-center rounded-full bg-surface-container text-on-surface-variant" aria-label={labels.cancel}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 rounded-full bg-surface-container p-1 text-[11px] font-bold">
              {COLUMN_TYPES.map((type) => (
                <button key={type} type="button" onClick={() => {
                  setEditType(type);
                  setEditMessage("");
                  if (type !== "NORMAL") clearEditStagedImage();
                }} className={`h-10 rounded-full px-3 transition ${editType === type ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}>
                  {columnLabels[type]}
                </button>
              ))}
            </div>

            <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={6} maxLength={2000} className={`w-full resize-none rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-4 text-primary outline-none transition focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 ${editType === "QUOTE" ? "font-headline text-xl font-black italic leading-snug" : "font-body text-base leading-relaxed"}`} />

            {editType === "NORMAL" && (
              <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                {(editImagePreview || editImageUrl) && (
                  <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-surface-container">
                    <img src={editImagePreview || editImageUrl} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={removeEditImage} disabled={isPending || isEditCompressing} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md disabled:opacity-60" title={labels.removeImage}>
                      <span className="material-symbols-outlined text-[19px]">close</span>
                    </button>
                  </div>
                )}
                {isEditCompressing && <p className="mt-3 text-xs font-bold text-secondary">Mengompresi gambar...</p>}
                {editImageCompression && (
                  <p className="mt-3 text-xs font-bold text-on-surface-variant/60">
                    {formatFileSize(editImageCompression.originalBytes)} → {formatFileSize(editImageCompression.finalBytes)}
                    {editImageCompression.savedPercent > 0 ? ` · hemat ${editImageCompression.savedPercent}%` : " · sudah optimal"}
                  </p>
                )}
                <input ref={editImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleEditImageChange} />
                <button type="button" onClick={() => editImageInputRef.current?.click()} disabled={isPending || isEditCompressing} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-on-primary disabled:opacity-60">
                  <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                  {editImagePreview || editImageUrl ? labels.changeImage : labels.addImage}
                </button>
              </div>
            )}

            {editType === "AGENDA" && (
              <AgendaFields
                labels={labels}
                lang={lang}
                date={editAgendaDate}
                startTime={editAgendaStartTime}
                endTime={editAgendaEndTime}
                locationLabel={editLocationLabel}
                locationLatitude={editLocationLatitude}
                locationLongitude={editLocationLongitude}
                disabled={isPending}
                onDateChange={setEditAgendaDate}
                onStartTimeChange={setEditAgendaStartTime}
                onEndTimeChange={setEditAgendaEndTime}
                onLocationChange={(location) => {
                  setEditLocationLabel(location.label);
                  setEditLocationLatitude(location.latitude);
                  setEditLocationLongitude(location.longitude);
                }}
              />
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold text-on-surface-variant/50">{editContent.length}/2000</p>
              {editMessage && <p className="text-xs font-bold text-error">{editMessage}</p>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={cancelEdit} disabled={isPending} className="h-12 rounded-full bg-surface-container text-xs font-black text-on-surface-variant disabled:opacity-60">{labels.cancel}</button>
              <button type="button" onClick={saveEdit} disabled={isPending || isEditCompressing} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-xs font-black text-on-primary shadow-lg shadow-primary/15 disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">{isPending ? "sync" : "check"}</span>
                {labels.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingPost && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPending) setDeletingPost(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="quick-post-delete-title"
            aria-describedby="quick-post-delete-description"
            className="w-full max-w-md rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl sm:p-7"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-error/10 text-error">
              <span className="material-symbols-outlined text-[30px]">delete</span>
            </div>
            <div className="mt-5 text-center">
              <h3 id="quick-post-delete-title" className="font-headline text-xl font-black text-primary">
                {labels.deleteConfirmTitle}
              </h3>
              <p id="quick-post-delete-description" className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant">
                {labels.deleteConfirmDescription}
              </p>
            </div>
            <p className="mt-5 line-clamp-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
              {deletingPost.content}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                ref={deleteCancelButtonRef}
                type="button"
                onClick={() => setDeletingPost(null)}
                disabled={isPending}
                className="h-12 rounded-full bg-surface-container text-xs font-black text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={confirmQuickPostDeletion}
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-error text-xs font-black text-on-error shadow-lg shadow-error/15 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-[18px] ${isPending ? "animate-spin" : ""}`}>
                  {isPending ? "progress_activity" : "delete"}
                </span>
                {labels.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
