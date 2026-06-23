import { auth } from "@/auth";
import { ChatWidget } from "@/components/chat/ChatWidget";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export async function FloatingActions({
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
