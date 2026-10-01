"use server";

import { auth } from "@/auth";
import { getLifetimeViewCount } from "@/lib/analytics/report";

export async function getAdminLifetimeViewCount(pageKey: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") return null;
  if (!/^(post|quote):[a-f\d]{24}$/i.test(pageKey)) return null;
  return getLifetimeViewCount(pageKey);
}
