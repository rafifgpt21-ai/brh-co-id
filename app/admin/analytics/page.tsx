import { auth } from "@/auth";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { getAnalyticsReport, resolveAnalyticsFilters } from "@/lib/analytics/report";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type AnalyticsSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function AnalyticsContent({ searchParams }: { searchParams: AnalyticsSearchParams }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session) redirect("/admin/login");
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/");
  const filters = resolveAnalyticsFilters(await searchParams);
  const report = await getAnalyticsReport(filters);
  return <AnalyticsDashboard report={report} />;
}

function AnalyticsFallback() {
  return <div className="mx-auto min-h-[70vh] max-w-[1500px] animate-pulse rounded-[2rem] bg-surface-container-low" />;
}

export default function AnalyticsPage({ searchParams }: { searchParams: AnalyticsSearchParams }) {
  return <Suspense fallback={<AnalyticsFallback />}><AnalyticsContent searchParams={searchParams} /></Suspense>;
}
