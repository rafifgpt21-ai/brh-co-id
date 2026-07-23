"use client";

import {
  initialContactFormState,
  sendContactMessage,
} from "@/lib/actions/contact";
import type { Locale } from "@/lib/i18n/config";
import { useActionState, useEffect, useRef } from "react";

const labels = {
  id: {
    name: "Nama",
    email: "Email",
    subject: "Subjek",
    message: "Pesan",
    namePlaceholder: "Nama lengkap",
    emailPlaceholder: "nama@email.com",
    subjectPlaceholder: "Topik korespondensi",
    messagePlaceholder: "Tuliskan pesan Anda...",
    submit: "Kirim Pesan",
    sending: "Mengirim...",
  },
  en: {
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    namePlaceholder: "Full name",
    emailPlaceholder: "name@email.com",
    subjectPlaceholder: "Correspondence topic",
    messagePlaceholder: "Write your message...",
    submit: "Send Message",
    sending: "Sending...",
  },
} as const;

export function ContactForm({ lang }: { lang: Locale }) {
  const [state, action, pending] = useActionState(sendContactMessage, initialContactFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const copy = labels[lang];

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const fieldClass = "mt-2 h-12 w-full rounded-xl border border-outline-variant/30 bg-surface px-4 text-sm text-primary outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10";

  return (
    <form ref={formRef} action={action} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm sm:p-7">
      <input type="hidden" name="locale" value={lang} />
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
          {copy.name}
          <input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder={copy.namePlaceholder} className={fieldClass} />
          {state.errors?.name?.[0] && <span className="mt-1 block normal-case tracking-normal text-error">{state.errors.name[0]}</span>}
        </label>
        <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
          {copy.email}
          <input name="email" required type="email" maxLength={200} autoComplete="email" placeholder={copy.emailPlaceholder} className={fieldClass} />
          {state.errors?.email?.[0] && <span className="mt-1 block normal-case tracking-normal text-error">{state.errors.email[0]}</span>}
        </label>
      </div>

      <label className="mt-5 block text-xs font-black uppercase tracking-wider text-on-surface-variant">
        {copy.subject}
        <input name="subject" required minLength={3} maxLength={160} placeholder={copy.subjectPlaceholder} className={fieldClass} />
        {state.errors?.subject?.[0] && <span className="mt-1 block normal-case tracking-normal text-error">{state.errors.subject[0]}</span>}
      </label>

      <label className="mt-5 block text-xs font-black uppercase tracking-wider text-on-surface-variant">
        {copy.message}
        <textarea name="message" required minLength={10} maxLength={5000} rows={7} placeholder={copy.messagePlaceholder} className={`${fieldClass} h-auto resize-y py-3 leading-relaxed`} />
        {state.errors?.message?.[0] && <span className="mt-1 block normal-case tracking-normal text-error">{state.errors.message[0]}</span>}
      </label>

      {state.message && (
        <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-error-container text-error"}`} role="status" aria-live="polite">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-on-primary transition hover:bg-tertiary disabled:cursor-wait disabled:opacity-60 sm:w-auto">
        <span className={`material-symbols-outlined text-[19px] ${pending ? "animate-spin" : ""}`}>{pending ? "progress_activity" : "send"}</span>
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}
