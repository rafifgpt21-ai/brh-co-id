"use client";

import { useSession } from "next-auth/react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function FloatingActions({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return <ChatWidget lang={lang} dict={dict.chat} isAdmin={isAdmin} quickPostLabels={dict.quickPost} />;
}
