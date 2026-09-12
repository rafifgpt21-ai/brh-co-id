import { auth } from "@/auth";
import { getLifetimeViewCount } from "@/lib/analytics/report";

export async function AdminViewCount({ pageKey, locale }: { pageKey: string; locale: "id" | "en" }) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") return null;
  const total = await getLifetimeViewCount(pageKey);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-secondary" title={locale === "id" ? "Hanya terlihat oleh admin" : "Visible to admins only"}>
      <span className="material-symbols-outlined text-[16px]">visibility</span>
      {new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(total)} {locale === "id" ? "tayangan" : "views"}
    </span>
  );
}
