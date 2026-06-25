import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/ChatWidget";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Suspense } from "react";

function FloatingActionsFallback({ dict }: { dict: Dictionary }) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[60] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5">
      <button
        type="button"
        aria-label={dict.chat.open}
        disabled
        className="grid h-14 w-14 place-items-center rounded-full bg-primary text-on-primary opacity-85 shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
      >
        <span className="material-symbols-outlined text-[26px]">chat</span>
      </button>
    </div>
  );
}

async function SessionFloatingActions({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <ChatWidget
      lang={lang}
      dict={dict.chat}
      isAdmin={isAdmin}
      quickPostLabels={dict.quickPost}
    />
  );
}

export function FloatingActions({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  return (
    <Suspense fallback={<FloatingActionsFallback dict={dict} />}>
      <SessionFloatingActions lang={lang} dict={dict} />
    </Suspense>
  );
}
