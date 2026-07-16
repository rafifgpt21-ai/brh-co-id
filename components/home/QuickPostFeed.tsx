"use client";

import { AgendaFields, type AgendaFieldLabels } from "@/components/home/AgendaFields";
import { ShareActions } from "@/components/common/ShareActions";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { deleteQuickPost, updateQuickPost, updateQuickPostStatus, type QuickPostType } from "@/lib/actions/quick-post";
import { formatLocalizedDate, getDateLocale, type Locale } from "@/lib/i18n/config";
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
  share: string;
  shareToFacebook: string;
  shareToWhatsapp: string;
  copyLink: string;
  linkCopied: string;
  addImage: string;
  changeImage: string;
  removeImage: string;
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
  const [activeType, setActiveType] = useState<QuickPostType>(visibleTypes[0] ?? "NORMAL");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingPost, setEditingPost] = useState<QuickPostItem | null>(null);
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

  const removeQuickPost = (id: string) => {
    startTransition(async () => {
      const result = await deleteQuickPost(id);
      if (!result.success) alert(result.error || "Gagal menghapus postingan");
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
      {visibleTypes.length > 1 && <div className="mb-5 flex items-center justify-between gap-3 lg:hidden" role="tablist" aria-label="Quickpost categories">
        <div className="grid min-w-0 flex-1 grid-cols-3 rounded-full bg-surface-container p-1">
          {visibleTypes.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={activeType === type}
              aria-controls={`quick-post-column-${type.toLowerCase()}`}
              onClick={() => setActiveType(type)}
              className={`min-w-0 truncate rounded-full px-2 py-2.5 text-[10px] font-black uppercase tracking-wide transition sm:text-xs ${activeType === type ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              {columnLabels[type]}
            </button>
          ))}
        </div>
      </div>}

      <div className={`grid grid-cols-1 gap-6 ${visibleTypes.length === 1 ? "mx-auto max-w-3xl" : "lg:grid-cols-3"} ${isPreview ? "lg:items-stretch" : "lg:items-start"}`}>
        {visibleTypes.map((type) => {
          const posts = isPreview ? quickPosts[type].slice(0, 1) : quickPosts[type];
          return (
            <div key={type} className={`${activeType === type || visibleTypes.length === 1 ? "flex" : "hidden"} min-w-0 flex-col gap-4 lg:flex`}>
              <section
                data-quick-post-column={type}
                id={`quick-post-column-${type.toLowerCase()}`}
                role="tabpanel"
                aria-label={columnLabels[type]}
                className={`min-w-0 overflow-hidden rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-lowest shadow-sm ${isPreview ? "flex flex-1 flex-col" : "block"}`}
              >
              <header className="flex items-center gap-3 border-b border-outline-variant/20 bg-surface-container-low px-5 py-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary/10 text-secondary">
                  <span className="material-symbols-outlined text-[21px]">{columnIcons[type]}</span>
                </span>
                <h2 className="font-headline text-xl font-black tracking-tight text-primary sm:text-2xl">
                  {columnLabels[type]}
                </h2>
              </header>

              <div className={`px-5 py-2 sm:px-6 ${isPreview ? "flex flex-1 flex-col" : ""}`}>
                {posts.length === 0 ? (
                  <div className={`grid min-h-56 place-items-center py-10 text-center ${isPreview ? "flex-1" : ""}`}>
                    <div>
                      <span className="material-symbols-outlined text-3xl text-secondary/40">{columnIcons[type]}</span>
                      <h3 className="mt-3 font-headline text-lg font-black text-primary">{emptyLabels[type]}</h3>
                      <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-on-surface-variant/65">{labels.emptyDescription}</p>
                    </div>
                  </div>
                ) : posts.map((post) => {
                  const isQuote = type === "QUOTE";
                  const isAgenda = type === "AGENDA";
                  const isExpanded = Boolean(expanded[post.id]);
                  const previewLimit = isPreview ? 180 : 280;
                  const isLong = post.content.length > previewLimit;
                  const visibleContent = isExpanded ? post.content : truncate(post.content, previewLimit);
                  const completionTime = post.endsAt || post.startsAt;
                  const isCompleted = isAgenda && completionTime ? new Date(completionTime) < new Date() : false;
                  const shareUrl = buildAbsoluteUrl(`/${lang}/catatan#quick-post-${post.id}`);

                  return (
                    <article key={post.id} id={`quick-post-${post.id}`} className="group relative scroll-mt-24 border-b border-outline-variant/20 py-6 last:border-b-0">
                      {isAdmin && (
                        <div className={`absolute right-0 top-4 z-10 flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest/95 p-1 shadow-lg transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
                          <button type="button" onClick={() => startEdit(post)} className="grid h-8 w-8 place-items-center rounded-full text-secondary hover:bg-secondary/10" aria-label={labels.edit} title={labels.edit}>
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                          <button type="button" onClick={() => removeQuickPost(post.id)} className="grid h-8 w-8 place-items-center rounded-full text-error hover:bg-error/10" aria-label={labels.delete} title={labels.delete}>
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      )}

                      {post.imageUrl && type === "NORMAL" && (
                        <div className="relative mb-5 aspect-16/10 overflow-hidden rounded-2xl bg-surface-container">
                          <Image src={post.imageUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                        </div>
                      )}

                      <div className="mb-4 flex flex-wrap items-center gap-2 pr-16">
                        {post.status === "Draft" && isAdmin && <span className="rounded-full bg-surface-container px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{labels.draftBadge}</span>}
                        {isCompleted && <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">{labels.completedBadge}</span>}
                        {!isAgenda && <span className="text-[11px] font-bold text-on-surface-variant/55">{formatLocalizedDate(post.createdAt, lang)}</span>}
                      </div>

                      {isAgenda && post.startsAt ? (
                        <div className="mb-5 rounded-2xl bg-secondary/8 p-4 text-primary">
                          <p className="flex items-start gap-2 text-sm font-black leading-snug">
                            <span className="material-symbols-outlined text-[19px] text-secondary">calendar_month</span>
                            <span>{formatAgendaDate(post.startsAt, lang)}</span>
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                            <span>{formatAgendaTime(post.startsAt, lang)}{post.endsAt ? `–${formatAgendaTime(post.endsAt, lang)}` : ""} WIB</span>
                          </p>
                          {post.locationLabel && (
                            <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-on-surface-variant">
                              <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">location_on</span>
                              <span>{post.locationLabel}</span>
                            </p>
                          )}

                          <button type="button" onClick={() => toggleExpanded(post.id)} className="mt-4 block w-full border-t border-secondary/15 pt-4 text-left">
                            <p className="whitespace-pre-wrap text-pretty font-body text-sm leading-relaxed text-on-surface sm:text-base">{visibleContent}</p>
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => toggleExpanded(post.id)} className="block w-full text-left">
                          {isQuote ? (
                          <p className="text-pretty font-headline text-xl font-black italic leading-tight tracking-tight text-primary sm:text-2xl">&ldquo;{visibleContent}&rdquo;</p>
                          ) : (
                            <p className="whitespace-pre-wrap text-pretty font-body text-sm leading-relaxed text-on-surface sm:text-base">{visibleContent}</p>
                          )}
                        </button>
                      )}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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
                <OptimisticLink href={archiveHrefs[type]} className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary/15 bg-surface-container-lowest px-5 text-[10px] font-black uppercase tracking-wider text-primary shadow-sm transition hover:border-primary/30 hover:bg-primary hover:text-on-primary active:scale-[0.98]">
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
    </section>
  );
}
