"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { QuickPostComposer } from "@/components/home/QuickPostComposer";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ChatSource = {
  title: string;
  url: string;
  category?: string | null;
  thumbnail?: string | null;
  excerpt?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
};

function createId() {
  return Math.random().toString(36).slice(2);
}

function getSourceMeta(source: ChatSource) {
  try {
    const url = new URL(source.url, window.location.origin);
    return url.origin === window.location.origin ? source.category || "BRH" : url.hostname.replace(/^www\./, "");
  } catch {
    return source.category || "Sumber";
  }
}

export function ChatWidget({
  lang,
  dict,
  isAdmin = false,
  quickPostLabels,
}: {
  lang: Locale;
  dict: Dictionary["chat"];
  isAdmin?: boolean;
  quickPostLabels?: Dictionary["quickPost"];
}) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<"chat" | "note" | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "loading"; message: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: dict.welcome,
    },
  ]);

  useEffect(() => {
    if (activePanel !== "chat") return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activePanel, messages, isLoading]);

  useEffect(() => {
    if (!notice || notice.tone === "loading") return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/pdf-viewer")) {
    return null;
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;
    const history = messages
      .filter((item) => item.id !== "welcome")
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    setInput("");
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, currentPath: pathname, locale: lang }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || dict.error);
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: error instanceof Error ? error.message : dict.error,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[60] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5">
      {activePanel === "note" && isAdmin && quickPostLabels && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <button
            type="button"
            aria-label={quickPostLabels.cancel}
            className="absolute inset-0 cursor-default"
            onClick={() => setActivePanel(null)}
          />
          <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-t-[1.5rem] bg-surface-container-lowest shadow-[0_24px_90px_rgba(41,47,54,0.28)] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="material-symbols-outlined text-[21px] text-secondary">edit_note</span>
                <h2 className="truncate font-headline text-sm font-black text-primary">
                  {quickPostLabels.composeTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="grid h-10 w-10 place-items-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high"
                aria-label={quickPostLabels.cancel}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <QuickPostComposer
              labels={quickPostLabels}
              lang={lang}
              hideHeader
              onSubmitStart={(status) => {
                setActivePanel(null);
                setNotice({
                  tone: "loading",
                  message: status === "Published" ? "Publishing note..." : "Saving draft...",
                });
              }}
              onSubmitResult={(result) => {
                setNotice({
                  tone: result.success ? "success" : "error",
                  message: result.success
                    ? result.status === "Published"
                      ? "Note published."
                      : "Draft saved."
                    : result.message,
                });
              }}
            />
          </section>
        </div>
      )}

      {activePanel === "chat" && (
        <section className="flex h-[min(680px,calc(100dvh-6rem))] w-full max-w-[430px] flex-col overflow-hidden rounded-xl border border-outline-variant/25 bg-surface shadow-[0_20px_70px_rgba(41,47,54,0.22)] sm:w-[430px]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/20 bg-primary px-4 py-3 text-on-primary">
            <div className="min-w-0">
              <h2 className="truncate font-headline text-sm font-bold">BRH Assistant</h2>
              <p className="truncate text-xs text-on-primary/75">{dict.subtitle}</p>
            </div>
            <button
              type="button"
              aria-label={dict.close}
              onClick={() => setActivePanel(null)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background px-4 py-4"
          >
            <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-sm bg-secondary text-on-secondary"
                      : "rounded-bl-sm bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  {!!message.sources?.length && (
                    <div className="mt-3 space-y-2 border-t border-outline-variant/25 pt-2.5">
                      {message.sources.map((source) => (
                        <Link
                          key={`${source.url}-${source.title}`}
                          href={source.url}
                          target={source.url.startsWith("http") ? "_blank" : undefined}
                          rel={source.url.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="group flex gap-2 rounded-lg border border-outline-variant/25 bg-background p-2 text-left transition hover:border-secondary/35 hover:bg-secondary/5"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-container-high">
                            {source.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={source.thumbnail}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-secondary">
                                <span className="material-symbols-outlined text-[24px]">article</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
                              <span className="min-w-0 truncate">{getSourceMeta(source)}</span>
                              <span className="material-symbols-outlined text-[13px] opacity-70">open_in_new</span>
                            </div>
                            <div className="line-clamp-2 text-xs font-bold leading-snug text-on-surface group-hover:text-primary">
                              {source.title}
                            </div>
                            {source.excerpt && (
                              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-on-surface-variant/75">
                                {source.excerpt}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-xl rounded-bl-sm bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface-variant shadow-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                  {dict.searching}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={submitMessage} className="shrink-0 border-t border-outline-variant/20 bg-surface px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={1}
                maxLength={1000}
                placeholder={dict.placeholder}
                className="max-h-28 min-h-12 flex-1 resize-none rounded-lg border border-outline-variant/35 bg-surface-container-lowest px-3 py-3 text-sm leading-5 text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
              />
              <button
                type="submit"
                disabled={isLoading || input.trim().length < 3}
                aria-label={dict.send}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary text-on-secondary transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="material-symbols-outlined text-[22px]">send</span>
              </button>
            </div>
            <p className="mt-2 px-1 text-[11px] leading-4 text-on-surface-variant/70">
              {dict.shortcut}
            </p>
          </form>
        </section>
      )}

      {notice && (
        <div
          role="status"
          className={`mr-1 flex max-w-[min(92vw,360px)] items-center gap-2 rounded-full border px-4 py-3 text-xs font-black shadow-[0_14px_40px_rgba(41,47,54,0.18)] backdrop-blur-xl ${
            notice.tone === "error"
              ? "border-error/20 bg-error/95 text-white"
              : notice.tone === "success"
                ? "border-secondary/20 bg-secondary text-on-secondary"
                : "border-outline-variant/25 bg-surface/95 text-primary"
          }`}
        >
          <span className={`material-symbols-outlined text-[18px] ${notice.tone === "loading" ? "animate-spin" : ""}`}>
            {notice.tone === "error" ? "error" : notice.tone === "success" ? "check_circle" : "progress_activity"}
          </span>
          <span className="min-w-0 truncate">{notice.message}</span>
        </div>
      )}

      {isAdmin && quickPostLabels ? (
        <div className="flex max-w-full items-center gap-2 rounded-full border border-outline-variant/25 bg-surface/92 p-1.5 shadow-[0_14px_40px_rgba(41,47,54,0.18)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActivePanel((current) => (current === "note" ? null : "note"))}
            aria-label={quickPostLabels.composeTitle}
            className={`inline-flex h-12 min-w-0 items-center gap-2 rounded-full px-4 text-xs font-black transition sm:px-5 ${
              activePanel === "note"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-primary hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[21px]">edit_note</span>
            <span className="truncate">{quickPostLabels.composeTitle}</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePanel((current) => (current === "chat" ? null : "chat"))}
            aria-label={dict.open}
            className={`grid h-12 w-12 place-items-center rounded-full transition ${
              activePanel === "chat"
                ? "bg-primary text-on-primary"
                : "bg-tertiary text-on-tertiary hover:bg-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[23px]">
              {activePanel === "chat" ? "keyboard_arrow_down" : "chat"}
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setActivePanel((current) => (current === "chat" ? null : "chat"))}
          aria-label={dict.open}
          className="grid h-14 w-14 place-items-center rounded-full bg-primary text-on-primary shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:scale-105"
        >
          <span className="material-symbols-outlined text-[26px]">
            {activePanel === "chat" ? "keyboard_arrow_down" : "chat"}
          </span>
        </button>
      )}
    </div>
  );
}
