"use client";

import { deleteQuickPost, updateQuickPost, updateQuickPostStatus } from "@/lib/actions/quick-post";
import { ShareActions } from "@/components/common/ShareActions";
import { formatLocalizedDate, type Locale } from "@/lib/i18n/config";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { buildAbsoluteUrl } from "@/lib/share-url";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type QuickPostItem = {
  id: string;
  type: string;
  content: string;
  imageUrl?: string | null;
  status: string;
  createdAt: Date | string;
};

type QuickPostFeedLabels = {
  eyebrow: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  normal: string;
  quote: string;
  readMore: string;
  showLess: string;
  viewAll: string;
  draftBadge: string;
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
};

function truncate(content: string, length: number) {
  return content.length > length ? `${content.slice(0, length).trim()}...` : content;
}

function getQuickPostShareTitle(post: QuickPostItem) {
  const content = truncate(post.content.replace(/\s+/g, " ").trim(), 180);
  return post.type === "QUOTE" ? `"${content}"` : content;
}

export function QuickPostFeed({
  quickPosts,
  isAdmin,
  lang,
  labels,
  hrefAll,
  variant = "full",
}: {
  quickPosts: QuickPostItem[];
  isAdmin: boolean;
  lang: Locale;
  labels: QuickPostFeedLabels;
  hrefAll?: string;
  variant?: "preview" | "full";
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingPost, setEditingPost] = useState<QuickPostItem | null>(null);
  const [editType, setEditType] = useState<"NORMAL" | "QUOTE">("NORMAL");
  const [editContent, setEditContent] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  const publishQuickPost = (id: string) => {
    startTransition(async () => {
      const result = await updateQuickPostStatus({ id, status: "Published" });
      if (!result.success) alert(result.error || "Gagal publish catatan");
      router.refresh();
    });
  };

  const removeQuickPost = (id: string) => {
    startTransition(async () => {
      const result = await deleteQuickPost(id);
      if (!result.success) alert(result.error || "Gagal menghapus catatan");
      router.refresh();
    });
  };

  const startEdit = (post: QuickPostItem) => {
    setEditingPost(post);
    setEditType(post.type === "QUOTE" ? "QUOTE" : "NORMAL");
    setEditContent(post.content);
    setEditMessage("");
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
    setEditMessage("");
  };

  const saveEdit = () => {
    if (!editingPost) return;
    if (!editContent.trim()) {
      setEditMessage("Konten tidak boleh kosong");
      return;
    }

    startTransition(async () => {
      const result = await updateQuickPost({
        id: editingPost.id,
        type: editType,
        content: editContent,
      });
      if (!result.success) {
        setEditMessage(result.error || "Gagal mengubah catatan");
        return;
      }
      cancelEdit();
      router.refresh();
    });
  };

  const isPreview = variant === "preview";
  const visibleQuickPosts = isPreview ? quickPosts.slice(0, 3) : quickPosts;
  if (visibleQuickPosts.length === 0) {
    return (
      <section id="notes" className="border-y border-outline-variant/35 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="material-symbols-outlined text-3xl text-secondary/45 sm:text-4xl">edit_note</span>
          <h2 className="mt-3 font-headline text-xl font-black text-primary sm:mt-4 sm:text-2xl">{labels.emptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-on-surface-variant/70">
            {labels.emptyDescription}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="notes" className="w-full">
      {isPreview && (
        <div className="mb-5 flex flex-col gap-4 border-b border-outline-variant/25 pb-5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <span className="font-label text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              {labels.eyebrow}
            </span>
            <h2 className="mt-2 font-headline text-2xl font-black leading-tight tracking-tight text-primary sm:text-3xl">
              {labels.title}
            </h2>
          </div>
          {hrefAll && (
            <OptimisticLink
              href={hrefAll}
              className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 text-xs font-black uppercase tracking-wider text-on-primary shadow-lg shadow-primary/10 transition hover:bg-tertiary active:scale-[0.98]"
            >
              {labels.viewAll}
              <span className="material-symbols-outlined text-[18px]">east</span>
            </OptimisticLink>
          )}
        </div>
      )}

      <div className={isPreview ? "grid grid-cols-1 gap-0 lg:grid-cols-3 lg:gap-6" : "grid grid-cols-1 gap-6 lg:grid-cols-12"}>
        {visibleQuickPosts.map((post, index) => {
          const isQuote = post.type === "QUOTE";
          const isExpanded = Boolean(expanded[post.id]);
          const previewLimit = isPreview ? 145 : index === 0 ? 420 : 210;
          const isLong = post.content.length > previewLimit;
          const visibleContent = isExpanded ? post.content : truncate(post.content, previewLimit);
          const isFeatured = !isPreview && index === 0;
          const shareUrl = buildAbsoluteUrl(`/${lang}/catatan#quick-post-${post.id}`);
          const shareLabels = {
            share: labels.share,
            shareToFacebook: labels.shareToFacebook,
            shareToWhatsapp: labels.shareToWhatsapp,
            copyLink: labels.copyLink,
            linkCopied: labels.linkCopied,
          };

          return (
            <article
              key={post.id}
              id={`quick-post-${post.id}`}
              className={`group relative border-outline-variant/35 ${
                isPreview
                  ? "scroll-mt-24 border-t py-4 first:border-t-0 lg:border-l lg:border-t-0 lg:py-1 lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
                  : isFeatured
                  ? "scroll-mt-24 border-y py-5 sm:py-7 lg:col-span-7 lg:row-span-2 lg:py-9"
                  : "scroll-mt-24 border-t py-5 sm:py-6 lg:col-span-5"
              }`}
            >
              {isAdmin && (
                <div
                  className={`absolute right-2 top-3 z-10 flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container-lowest/95 p-1 shadow-xl shadow-primary/10 backdrop-blur transition sm:right-0 sm:top-4 sm:opacity-0 sm:translate-y-1 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 ${
                    isPending ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    className="grid h-8 w-8 place-items-center rounded-full text-secondary transition hover:bg-secondary/10"
                    title={labels.edit}
                    aria-label={labels.edit}
                  >
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuickPost(post.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-error transition hover:bg-error/10"
                    title={labels.delete}
                    aria-label={labels.delete}
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              )}

              {post.imageUrl && !isQuote && (
                <button
                  type="button"
                  onClick={() => toggleExpanded(post.id)}
                  className={`relative mb-4 block w-full overflow-hidden rounded-lg bg-surface-container ${isPreview ? "aspect-16/7 sm:aspect-16/6 lg:aspect-16/9" : isFeatured ? "aspect-16/9" : "aspect-16/10"}`}
                >
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    sizes={isFeatured ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 42vw"}
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </button>
              )}

              <div className="mb-5 flex flex-wrap items-center gap-2">
                {isQuote && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-secondary sm:text-[10px]">
                    <span className="material-symbols-outlined text-[15px]">format_quote</span>
                    {labels.quote}
                  </span>
                )}
                {post.status === "Draft" && isAdmin && (
                  <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {labels.draftBadge}
                  </span>
                )}
                <span className="text-[11px] font-bold text-on-surface-variant/55">
                  {formatLocalizedDate(post.createdAt, lang)}
                </span>
              </div>

              <button type="button" onClick={() => toggleExpanded(post.id)} className="block w-full text-left">
                {isQuote ? (
                  <p className={`${isPreview ? "text-lg sm:text-xl lg:text-2xl" : isFeatured ? "text-2xl sm:text-3xl md:text-5xl" : "text-xl sm:text-2xl md:text-3xl"} text-pretty font-headline font-black italic leading-tight tracking-tight text-primary`}>
                    &ldquo;{visibleContent}&rdquo;
                  </p>
                ) : (
                  <p className={`${isPreview ? "text-sm sm:text-base" : isFeatured ? "text-lg sm:text-xl md:text-2xl" : "text-base md:text-lg"} whitespace-pre-wrap text-pretty font-body leading-relaxed text-on-surface`}>
                    {visibleContent}
                  </p>
                )}
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {isLong ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(post.id)}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary"
                  >
                    {isExpanded ? labels.showLess : labels.readMore}
                    <span className="material-symbols-outlined text-[17px]">{isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}</span>
                  </button>
                ) : (
                  <span />
                )}

                <ShareActions
                  url={shareUrl}
                  title={getQuickPostShareTitle(post)}
                  labels={shareLabels}
                  variant="quick"
                />

                {isAdmin && (
                  <div className={`flex items-center gap-2 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
                    {post.status === "Draft" && (
                      <button
                        type="button"
                        onClick={() => publishQuickPost(post.id)}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-[10px] font-black uppercase tracking-wider text-on-primary"
                      >
                        <span className="material-symbols-outlined text-[16px]">publish</span>
                        {labels.publish}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {editingPost && (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-xl rounded-t-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-label text-[10px] font-black uppercase tracking-[0.25em] text-secondary">
                  {labels.normal}
                </p>
                <h3 className="mt-1 font-headline text-xl font-black text-primary">{labels.edit}</h3>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high"
                aria-label={labels.cancel}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mb-4 grid w-fit grid-cols-2 rounded-full bg-surface-container p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setEditType("NORMAL")}
                className={`h-9 rounded-full px-4 transition ${editType === "NORMAL" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
              >
                {labels.normal}
              </button>
              <button
                type="button"
                onClick={() => setEditType("QUOTE")}
                className={`h-9 rounded-full px-4 transition ${editType === "QUOTE" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
              >
                {labels.quote}
              </button>
            </div>

            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={7}
              maxLength={2000}
              className={`w-full resize-none rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-4 text-primary outline-none transition focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10 ${editType === "QUOTE" ? "font-headline text-xl font-black italic leading-snug" : "font-body text-base leading-relaxed"}`}
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold text-on-surface-variant/50">{editContent.length}/2000</p>
              {editMessage && <p className="text-xs font-bold text-error">{editMessage}</p>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={cancelEdit} disabled={isPending} className="h-12 rounded-full bg-surface-container text-xs font-black text-on-surface-variant transition disabled:opacity-60">
                {labels.cancel}
              </button>
              <button type="button" onClick={saveEdit} disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-xs font-black text-on-primary shadow-lg shadow-primary/15 transition disabled:opacity-60">
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
