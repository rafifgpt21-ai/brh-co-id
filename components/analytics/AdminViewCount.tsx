"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getAdminLifetimeViewCount } from "@/lib/actions/analytics";

export function AdminViewCount({ pageKey, locale }: { pageKey: string; locale: "id" | "en" }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const [result, setResult] = useState<{ pageKey: string; total: number } | null>(null);
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void getAdminLifetimeViewCount(pageKey).then((total) => {
      if (active && total !== null) setResult({ pageKey, total });
    }).catch(() => {});
    return () => { active = false; };
  }, [isAdmin, pageKey]);
  if (!isAdmin || result?.pageKey !== pageKey) return null;
  const total = result.total;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-secondary" title={locale === "id" ? "Hanya terlihat oleh admin" : "Visible to admins only"}>
      <span className="material-symbols-outlined text-[16px]">visibility</span>
      {new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(total)} {locale === "id" ? "tayangan" : "views"}
    </span>
  );
}
