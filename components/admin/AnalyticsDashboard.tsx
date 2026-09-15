import type { AnalyticsReport } from "@/lib/analytics/report";
import Link from "next/link";

const numberFormatter = new Intl.NumberFormat("id-ID");
const decimalFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function percentageChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function MetricCard({ icon, label, value, previous }: { icon: string; label: string; value: string; previous: number }) {
  const positive = previous >= 0;
  return (
    <article className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/10 text-secondary">
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {positive ? "+" : ""}{decimalFormatter.format(previous)}%
        </span>
      </div>
      <p className="mt-6 font-headline text-3xl font-black tracking-tight text-primary">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/65">{label}</p>
    </article>
  );
}

function TrendChart({ data }: { data: AnalyticsReport["trend"] }) {
  const width = 900;
  const height = 250;
  const padding = 26;
  const max = Math.max(...data.map((item) => item.views), 1);
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.views / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-label text-[10px] font-black uppercase tracking-[0.22em] text-secondary">Tren harian</p>
          <h2 className="mt-1 font-headline text-xl font-black text-primary">Tayangan dan pengunjung</h2>
        </div>
        <span className="text-xs font-semibold text-on-surface-variant">Puncak {numberFormatter.format(max)} tayangan</span>
      </div>
      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafik tren tayangan harian" className="h-auto w-full min-w-[560px]">
        <defs>
          <linearGradient id="analytics-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((line) => {
          const y = padding + (line / 4) * (height - padding * 2);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="currentColor" className="text-outline-variant/25" strokeWidth="1" />;
        })}
        {points && <polygon points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill="url(#analytics-trend-fill)" />}
        {points && <polyline points={points} fill="none" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      </div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/55">
        <span>{data[0]?.date || "—"}</span>
        <span>{data.at(-1)?.date || "—"}</span>
      </div>
    </div>
  );
}

function Breakdown({ title, items }: { title: string; items: Array<{ value: string; count: number }> }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="font-headline text-lg font-black text-primary">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.length ? items.map((item) => (
          <div key={item.value}>
            <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
              <span className="min-w-0 truncate font-bold capitalize text-on-surface-variant">{item.value}</span>
              <span className="font-black text-primary">{numberFormatter.format(item.count)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max((item.count / max) * 100, 3)}%` }} />
            </div>
          </div>
        )) : <p className="text-sm text-on-surface-variant/60">Belum ada data.</p>}
      </div>
    </section>
  );
}

export function AnalyticsDashboard({ report }: { report: AnalyticsReport }) {
  const { filters, summary, comparison } = report;
  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 pb-16 sm:px-4 lg:px-8">
      <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight text-primary sm:text-4xl">Analytics BRH Insight</h1>
        </div>
        <Link href="/admin" className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-outline-variant/30 px-5 text-sm font-bold text-primary transition hover:bg-surface-container-low lg:self-auto">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Kelola konten
        </Link>
      </header>

      <form method="get" className="mb-7 grid gap-3 rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-xs font-bold text-on-surface-variant">Periode
          <select name="preset" defaultValue={filters.preset} className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 text-sm text-primary">
            <option value="7">7 hari</option><option value="30">30 hari</option><option value="90">90 hari</option><option value="365">365 hari</option><option value="custom">Custom</option>
          </select>
        </label>
        <label className="text-xs font-bold text-on-surface-variant">Dari
          <input type="date" name="from" defaultValue={filters.from} className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 text-sm text-primary" />
        </label>
        <label className="text-xs font-bold text-on-surface-variant">Sampai
          <input type="date" name="to" defaultValue={filters.to} className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 text-sm text-primary" />
        </label>
        <label className="text-xs font-bold text-on-surface-variant">Bahasa
          <select name="locale" defaultValue={filters.locale} className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 text-sm text-primary">
            <option value="all">Semua</option><option value="id">Indonesia</option><option value="en">English</option>
          </select>
        </label>
        <label className="text-xs font-bold text-on-surface-variant">Tipe halaman
          <select name="type" defaultValue={filters.pageType} className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 text-sm text-primary">
            <option value="all">Semua</option><option value="post">Post</option><option value="quote">Kutipan</option><option value="listing">Listing</option><option value="static">Statis</option><option value="home">Beranda</option><option value="viewer">PDF Viewer</option>
          </select>
        </label>
        <button type="submit" className="h-11 self-end rounded-xl bg-primary px-5 text-sm font-black text-on-primary transition hover:bg-primary/90">Terapkan</button>
      </form>

      {filters.error && <div className="mb-7 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{filters.error} Periode 30 hari digunakan.</div>}

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="visibility" label="Total tayangan" value={numberFormatter.format(summary.views)} previous={percentageChange(summary.views, comparison.views)} />
        <MetricCard icon="group" label="Pengunjung unik" value={numberFormatter.format(summary.visitors)} previous={percentageChange(summary.visitors, comparison.visitors)} />
        <MetricCard icon="browse_activity" label="Sesi" value={numberFormatter.format(summary.sessions)} previous={percentageChange(summary.sessions, comparison.sessions)} />
        <MetricCard icon="ads_click" label="Tayangan per sesi" value={decimalFormatter.format(summary.viewsPerSession)} previous={percentageChange(summary.viewsPerSession, comparison.viewsPerSession)} />
      </section>

      <TrendChart data={report.trend} />

      <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/20 px-6 py-5"><h2 className="font-headline text-xl font-black text-primary">Halaman dan konten teratas</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant"><tr><th className="px-6 py-4">Halaman</th><th className="px-4 py-4">Tipe</th><th className="px-4 py-4 text-right">Tayangan</th><th className="px-6 py-4 text-right">Unik</th></tr></thead>
            <tbody className="divide-y divide-outline-variant/15">
              {report.topPages.map((page) => <tr key={page.pageKey}><td className="px-6 py-4"><p className="max-w-2xl font-bold text-primary">{page.title}</p><p className="mt-1 text-xs text-on-surface-variant/60">{page.path}</p></td><td className="px-4 py-4 capitalize text-on-surface-variant">{page.pageType}</td><td className="px-4 py-4 text-right font-black text-primary">{numberFormatter.format(page.views)}</td><td className="px-6 py-4 text-right font-bold text-on-surface-variant">{numberFormatter.format(page.visitors)}</td></tr>)}
              {!report.topPages.length && <tr><td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant/60">Belum ada tayangan pada periode ini.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title="Sumber trafik" items={report.sources} />
        <Breakdown title="Referrer" items={report.referrers} />
        <Breakdown title="Kampanye UTM" items={report.campaigns} />
        <Breakdown title="Perangkat" items={report.devices} />
        <Breakdown title="Browser" items={report.browsers} />
        <Breakdown title="Bahasa" items={report.locales} />
      </section>
    </div>
  );
}
