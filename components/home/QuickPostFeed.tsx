"use client";

import { deleteQuickPost, updateQuickPost, updateQuickPostStatus } from "@/lib/actions/quick-post";
import { formatLocalizedDate, type Locale } from "@/lib/i18n/config";
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
  emptyTitle: string;
  emptyDescription: string;
  normal: string;
  quote: string;
  readMore: string;
  showLess: string;
  draftBadge: string;
  publish: string;
  edit: string;
  save: string;
  cancel: string;
  delete: string;
};

function truncate(content: string, length: number) {
  return content.length > length ? `${content.slice(0, length).trim()}...` : content;
}

export function QuickPostFeed({
  quickPosts,
  isAdmin,
  lang,
  labels,
}: {
  quickPosts: QuickPostItem[];
  isAdmin: boolean;
  lang: Locale;
  labels: QuickPostFeedLabels;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
    setOpenMenuId(null);
    startTransition(async () => {
      const result = await deleteQuickPost(id);
      if (!result.success) alert(result.error || "Gagal menghapus catatan");
      router.refresh();
    });
  };

  const startEdit = (post: QuickPostItem) => {
    setOpenMenuId(null);
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

  if (quickPosts.length === 0) {
    return (
      <section id="notes" className="border-y border-outline-variant/35 py-8 sm:py-14">
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {quickPosts.map((post, index) => {
          const isQuote = post.type === "QUOTE";
          const isExpanded = Boolean(expanded[post.id]);
          const isLong = post.content.length > (index === 0 ? 420 : 210);
          const visibleContent = isExpanded ? post.content : truncate(post.content, index === 0 ? 420 : 210);
          const isFeatured = index === 0;

          return (
            <article
              key={post.id}
              className={`group border-outline-variant/35 ${
                isFeatured
                  ? "border-y py-5 sm:py-7 lg:col-span-7 lg:row-span-2 lg:py-9"
                  : "border-t py-5 sm:py-6 lg:col-span-5"
              }`}
            >
              {post.imageUrl && !isQuote && (
                <button
                  type="button"
                  onClick={() => toggleExpanded(post.id)}
                  className={`relative mb-6 block w-full overflow-hidden rounded-lg bg-surface-container ${isFeatured ? "aspect-16/9" : "aspect-16/10"}`}
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">
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
                  <p className={`${isFeatured ? "text-2xl sm:text-3xl md:text-5xl" : "text-xl sm:text-2xl md:text-3xl"} text-pretty font-headline font-black italic leading-tight tracking-tight text-primary`}>
                    &ldquo;{visibleContent}&rdquo;
                  </p>
                ) : (
                  <p className={`${isFeatured ? "text-lg sm:text-xl md:text-2xl" : "text-base md:text-lg"} whitespace-pre-wrap text-pretty font-body leading-relaxed text-on-surface`}>
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
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((current) => (current === post.id ? null : post.id))}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
                        title="Actions"
                        aria-label="Note actions"
                        aria-expanded={openMenuId === post.id}
                      >
                        <span className="material-symbols-outlined text-[19px]">more_horiz</span>
                      </button>

                      {openMenuId === post.id && (
                        <>
                          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close menu" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute bottom-11 right-0 z-40 w-44 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-1.5 shadow-2xl shadow-primary/10">
                            <button
                              type="button"
                              onClick={() => startEdit(post)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black text-primary transition hover:bg-surface-container"
                            >
                              <span className="material-symbols-outlined text-[18px] text-secondary">edit</span>
                              {labels.edit}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeQuickPost(post.id)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black text-error transition hover:bg-error/10"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              {labels.delete}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
