import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/user-actions";
import { UserTable, type AdminUserRow } from "@/components/admin/UserTable";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { indexAllKnowledge } from "@/lib/chatbot/indexing";
import { revalidatePath } from "next/cache";

async function reindexChatbotKnowledge() {
  "use server";

  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  await indexAllKnowledge();
  revalidatePath("/admin/settings");
}

function SettingsFallback() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 md:px-12 xl:px-24 bg-[#fcf8fa]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-16 max-w-sm rounded-2xl bg-surface-container-low animate-pulse" />
        <div className="h-96 rounded-2xl bg-surface-container-low animate-pulse" />
      </div>
    </div>
  );
}

async function SettingsContent() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const users = await getUsers();
  const adminUsers: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  }));

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 md:px-12 xl:px-24 bg-[#fcf8fa]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-[#0F172A] tracking-tight">
              Settings
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Kelola pengguna (admin) dan pengaturan platform.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <Suspense fallback={<div className="h-44 animate-pulse rounded-2xl bg-surface-container-low" />}>
            <ChatbotIndexStatus />
          </Suspense>
        </div>

        <UserTable initialUsers={adminUsers} />
      </div>
    </div>
  );
}

async function ChatbotIndexStatus() {
  const [total, idCount, enCount, postCount, quickPostCount, latestChunk] = await Promise.all([
    prisma.knowledgeChunk.count(),
    prisma.knowledgeChunk.count({ where: { locale: "id" } }),
    prisma.knowledgeChunk.count({ where: { locale: "en" } }),
    prisma.knowledgeChunk.count({ where: { sourceType: "post" } }),
    prisma.knowledgeChunk.count({ where: { sourceType: "quick_post" } }),
    prisma.knowledgeChunk.findFirst({ orderBy: { indexedAt: "desc" } }),
  ]);
  const canReindex = Boolean(process.env.GEMINI_API_KEY);

  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-label text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
            Chatbot Knowledge
          </p>
          <h2 className="mt-2 font-headline text-2xl font-black text-primary">
            Status Indeks Arsip BRH
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Panel ini menunjukkan apakah asisten chat sudah memiliki potongan pengetahuan dari artikel, catatan, biografi, dan riset.
          </p>
        </div>
        <form action={reindexChatbotKnowledge}>
          <button
            type="submit"
            disabled={!canReindex}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-black uppercase tracking-wider text-on-primary transition hover:bg-tertiary disabled:cursor-not-allowed disabled:opacity-45"
            title={canReindex ? "Re-index seluruh arsip chatbot" : "GEMINI_API_KEY belum tersedia"}
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Re-index
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total Chunk", total],
          ["Indonesia", idCount],
          ["English", enCount],
          ["Artikel", postCount],
          ["Catatan", quickPostCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
            <p className="mt-2 font-headline text-2xl font-black text-primary">{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-gray-500">
        Terakhir diindeks:{" "}
        <span className="text-primary">
          {latestChunk ? latestChunk.indexedAt.toLocaleString("id-ID") : "Belum ada indeks"}
        </span>
      </p>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsContent />
    </Suspense>
  );
}
