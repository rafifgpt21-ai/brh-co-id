"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
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
}: {
  lang: Locale;
  dict: Dictionary["chat"];
}) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: dict.welcome,
    },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages, isLoading]);

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
    <div className="fixed inset-x-3 bottom-3 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5">
      {isOpen && (
        <section className="flex h-[min(680px,calc(100dvh-6rem))] w-full max-w-[430px] flex-col overflow-hidden rounded-xl border border-outline-variant/25 bg-surface shadow-[0_20px_70px_rgba(41,47,54,0.22)] sm:w-[430px]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/20 bg-primary px-4 py-3 text-on-primary">
            <div className="min-w-0">
              <h2 className="truncate font-headline text-sm font-bold">BRH Assistant</h2>
              <p className="truncate text-xs text-on-primary/75">{dict.subtitle}</p>
            </div>
            <button
              type="button"
              aria-label={dict.close}
              onClick={() => setIsOpen(false)}
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

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={dict.open}
        className="grid h-14 w-14 place-items-center rounded-full bg-primary text-on-primary shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:scale-105"
      >
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? "keyboard_arrow_down" : "chat"}
        </span>
      </button>
    </div>
  );
}
