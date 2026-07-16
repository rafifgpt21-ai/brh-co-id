"use server";

import {
  deleteFilesFromStorage,
  receiptsMatchUrls,
  rollbackNewUploads,
  validateUploadReceipts,
} from "@/lib/uploadthing-server";
import type { UploadReceipt } from "@/lib/uploadthing-types";
import { cacheLife, cacheTag, revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

const quickPostTypeSchema = z.enum(["NORMAL", "AGENDA", "QUOTE"]);
const agendaDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));
const agendaTimeSchema = z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal(""));

const quickPostFields = {
  type: quickPostTypeSchema,
  content: z.string().trim().min(1, "Konten tidak boleh kosong").max(2000, "Konten terlalu panjang"),
  agendaDate: agendaDateSchema,
  agendaStartTime: agendaTimeSchema,
  agendaEndTime: agendaTimeSchema,
  locationLabel: z.string().trim().max(500, "Alamat terlalu panjang").optional().or(z.literal("")),
  locationLatitude: z.number().finite().min(-90).max(90).optional(),
  locationLongitude: z.number().finite().min(-180).max(180).optional(),
};

function parseWibDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes));
  const wibValue = new Date(value.getTime() + 7 * 60 * 60 * 1000);

  if (
    wibValue.getUTCFullYear() !== year
    || wibValue.getUTCMonth() !== month - 1
    || wibValue.getUTCDate() !== day
    || wibValue.getUTCHours() !== hours
    || wibValue.getUTCMinutes() !== minutes
  ) {
    return null;
  }

  return value;
}

function validateAgendaFields(data: z.infer<z.ZodObject<typeof quickPostFields>>, context: z.RefinementCtx) {
  const hasLatitude = typeof data.locationLatitude === "number";
  const hasLongitude = typeof data.locationLongitude === "number";

  if (hasLatitude !== hasLongitude) {
    context.addIssue({
      code: "custom",
      message: "Koordinat lokasi harus lengkap",
      path: ["locationLabel"],
    });
  }

  if ((hasLatitude || hasLongitude) && !data.locationLabel?.trim()) {
    context.addIssue({
      code: "custom",
      message: "Alamat lokasi tidak boleh kosong",
      path: ["locationLabel"],
    });
  }

  if (data.type !== "AGENDA") return;

  if (!data.agendaDate) {
    context.addIssue({ code: "custom", message: "Tanggal agenda wajib diisi", path: ["agendaDate"] });
  }
  if (!data.agendaStartTime) {
    context.addIssue({ code: "custom", message: "Waktu mulai wajib diisi", path: ["agendaStartTime"] });
  }
  if (!data.agendaDate || !data.agendaStartTime) return;

  const startsAt = parseWibDateTime(data.agendaDate, data.agendaStartTime);
  if (!startsAt) {
    context.addIssue({ code: "custom", message: "Tanggal atau waktu mulai tidak valid", path: ["agendaDate"] });
    return;
  }

  if (data.agendaEndTime) {
    const endsAt = parseWibDateTime(data.agendaDate, data.agendaEndTime);
    if (!endsAt || endsAt <= startsAt) {
      context.addIssue({
        code: "custom",
        message: "Waktu selesai harus setelah waktu mulai pada tanggal yang sama",
        path: ["agendaEndTime"],
      });
    }
  }
}

const quickPostSchema = z.object({
  ...quickPostFields,
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["Published", "Draft"]),
}).superRefine(validateAgendaFields);

const quickPostStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["Published", "Draft"]),
});

const quickPostUpdateSchema = z.object({
  id: z.string().min(1),
  ...quickPostFields,
  imageUrl: z.string().url().optional().or(z.literal("")),
}).superRefine(validateAgendaFields);

export type QuickPostFormData = z.infer<typeof quickPostSchema> & { newUploads?: UploadReceipt[] };
export type QuickPostType = z.infer<typeof quickPostTypeSchema>;
export type QuickPostUpdateData = z.infer<typeof quickPostUpdateSchema> & { newUploads?: UploadReceipt[] };

function getAgendaData(data: z.infer<z.ZodObject<typeof quickPostFields>>) {
  if (data.type !== "AGENDA") {
    return {
      startsAt: null,
      endsAt: null,
      locationLabel: null,
      locationLatitude: null,
      locationLongitude: null,
    };
  }

  const startsAt = parseWibDateTime(data.agendaDate || "", data.agendaStartTime || "");
  const endsAt = data.agendaEndTime
    ? parseWibDateTime(data.agendaDate || "", data.agendaEndTime)
    : null;

  return {
    startsAt,
    endsAt,
    locationLabel: data.locationLabel || null,
    locationLatitude: data.locationLatitude ?? null,
    locationLongitude: data.locationLongitude ?? null,
  };
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function getSession() {
  const { auth } = await import("@/auth");
  return auth();
}

async function requireAdmin() {
  const session = await getSession();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return null;
  }
  return session;
}

function refreshQuickPostPaths() {
  revalidatePath("/");
  revalidatePath("/id");
  revalidatePath("/en");
  revalidatePath("/id/catatan");
  revalidatePath("/en/catatan");
  updateTag("quick-posts");
}

async function refreshQuickPostKnowledgeIndex(id: string) {
  try {
    const { indexPublishedQuickPost } = await import("@/lib/chatbot/indexing");
    await indexPublishedQuickPost(id);
  } catch (error) {
    console.error("Error refreshing quick post knowledge index:", error);
  }
}

async function removeQuickPostKnowledgeIndex(id: string) {
  try {
    const { removeQuickPostFromKnowledgeIndex } = await import("@/lib/chatbot/indexing");
    await removeQuickPostFromKnowledgeIndex(id);
  } catch (error) {
    console.error("Error removing quick post knowledge index:", error);
  }
}

export async function createQuickPost(data: QuickPostFormData) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const newUploads = validateUploadReceipts(data.newUploads);
  if (!newUploads) {
    return { success: false, error: "Receipt upload tidak valid" };
  }
  const failWithRollback = async (error: string) => {
    if (newUploads.length > 0) {
      try {
        await rollbackNewUploads(newUploads, "quick-post-create-failed");
      } catch (cleanupError) {
        console.error("Error rolling back quick post upload:", cleanupError);
      }
    }
    return { success: false as const, error };
  };

  const parsedData = quickPostSchema.safeParse(data);
  if (!parsedData.success) {
    return failWithRollback(parsedData.error.issues[0].message);
  }

  const validData = parsedData.data;
  if (!receiptsMatchUrls(newUploads, [validData.imageUrl])) {
    return failWithRollback("Receipt upload tidak sesuai dengan gambar quick post");
  }

  try {
    const prisma = await getPrisma();
    const quickPost = await prisma.quickPost.create({
      data: {
        type: validData.type,
        content: validData.content,
        imageUrl: validData.type === "NORMAL" ? validData.imageUrl || null : null,
        ...getAgendaData(validData),
        status: validData.status,
      },
      select: { id: true },
    });

    refreshQuickPostPaths();
    await refreshQuickPostKnowledgeIndex(quickPost.id);
    return { success: true, id: quickPost.id };
  } catch (error) {
    console.error("Error creating quick post:", error);
    return failWithRollback(error instanceof Error ? error.message : "Gagal menyimpan quick post");
  }
}

export async function updateQuickPostStatus(data: { id: string; status: "Published" | "Draft" }) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsedData = quickPostStatusSchema.safeParse(data);
  if (!parsedData.success) {
    return { success: false, error: parsedData.error.issues[0].message };
  }

  try {
    const prisma = await getPrisma();
    const quickPost = await prisma.quickPost.update({
      where: { id: parsedData.data.id },
      data: { status: parsedData.data.status },
      select: { id: true },
    });

    refreshQuickPostPaths();
    await refreshQuickPostKnowledgeIndex(quickPost.id);
    return { success: true, id: quickPost.id };
  } catch (error) {
    console.error("Error updating quick post:", error);
    return { success: false, error: "Gagal mengubah status quick post" };
  }
}

export async function updateQuickPost(data: QuickPostUpdateData) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const newUploads = validateUploadReceipts(data.newUploads);
  if (!newUploads) {
    return { success: false, error: "Receipt upload tidak valid" };
  }
  const failWithRollback = async (error: string) => {
    if (newUploads.length > 0) {
      try {
        await rollbackNewUploads(newUploads, "quick-post-update-failed");
      } catch (cleanupError) {
        console.error("Error rolling back quick post replacement:", cleanupError);
      }
    }
    return { success: false as const, error };
  };

  const parsedData = quickPostUpdateSchema.safeParse(data);
  if (!parsedData.success) {
    return failWithRollback(parsedData.error.issues[0].message);
  }

  if (!receiptsMatchUrls(newUploads, [parsedData.data.imageUrl])) {
    return failWithRollback("Receipt upload tidak sesuai dengan gambar quick post");
  }

  try {
    const prisma = await getPrisma();
    const existingQuickPost = await prisma.quickPost.findUnique({
      where: { id: parsedData.data.id },
      select: { imageUrl: true },
    });
    if (!existingQuickPost) return failWithRollback("Quick post tidak ditemukan");

    const nextImageUrl = parsedData.data.type === "NORMAL"
      ? parsedData.data.imageUrl === undefined
        ? existingQuickPost.imageUrl
        : parsedData.data.imageUrl || null
      : null;
    const quickPost = await prisma.quickPost.update({
      where: { id: parsedData.data.id },
      data: {
        type: parsedData.data.type,
        content: parsedData.data.content,
        imageUrl: nextImageUrl,
        ...getAgendaData(parsedData.data),
      },
      select: { id: true },
    });

    if (existingQuickPost.imageUrl && existingQuickPost.imageUrl !== nextImageUrl) {
      try {
        await deleteFilesFromStorage([existingQuickPost.imageUrl]);
      } catch (fileError) {
        console.error("Error deleting replaced quick post image:", fileError);
      }
    }

    refreshQuickPostPaths();
    await refreshQuickPostKnowledgeIndex(quickPost.id);
    return { success: true, id: quickPost.id };
  } catch (error) {
    console.error("Error updating quick post:", error);
    return failWithRollback("Gagal mengubah quick post");
  }
}

export async function deleteQuickPost(id: string) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const prisma = await getPrisma();
    const quickPost = await prisma.quickPost.findUnique({ where: { id } });
    if (!quickPost) {
      return { success: true };
    }

    await prisma.quickPost.delete({ where: { id } });
    if (quickPost.imageUrl) {
      try {
        await deleteFilesFromStorage([quickPost.imageUrl]);
      } catch (fileError) {
        console.error("Error deleting quick post image after record deletion:", fileError);
      }
    }
    refreshQuickPostPaths();
    await removeQuickPostKnowledgeIndex(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting quick post:", error);
    return { success: false, error: "Gagal menghapus quick post" };
  }
}

export async function getQuickPosts(options?: { includeDrafts?: boolean; limit?: number }) {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return getQuickPostsInternal({
    includeDrafts: Boolean(options?.includeDrafts && isAdmin),
    limit: options?.limit ?? 12,
  });
}

export async function getQuickPostsByType(options?: {
  includeDrafts?: boolean;
  limitPerType?: number;
  upcomingAgendaOnly?: boolean;
}) {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return getQuickPostsByTypeInternal({
    includeDrafts: Boolean(options?.includeDrafts && isAdmin),
    limitPerType: options?.limitPerType ?? 60,
    upcomingAgendaOnly: options?.upcomingAgendaOnly ?? false,
  });
}

async function getQuickPostsByTypeInternal(options: {
  includeDrafts: boolean;
  limitPerType: number;
  upcomingAgendaOnly: boolean;
}) {
  "use cache";
  cacheTag("quick-posts");
  cacheLife("minutes");

  try {
    const prisma = await getPrisma();
    const statusWhere = options.includeDrafts ? {} : { status: "Published" };
    const now = new Date();
    const [normal, quote, upcomingAgenda, pastAgenda] = await Promise.all([
      prisma.quickPost.findMany({
        where: { ...statusWhere, type: "NORMAL" },
        orderBy: { createdAt: "desc" },
        take: options.limitPerType,
      }),
      prisma.quickPost.findMany({
        where: { ...statusWhere, type: "QUOTE" },
        orderBy: { createdAt: "desc" },
        take: options.limitPerType,
      }),
      prisma.quickPost.findMany({
        where: { ...statusWhere, type: "AGENDA", startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: options.limitPerType,
      }),
      options.upcomingAgendaOnly
        ? Promise.resolve([])
        : prisma.quickPost.findMany({
            where: { ...statusWhere, type: "AGENDA", startsAt: { lt: now } },
            orderBy: { startsAt: "desc" },
            take: options.limitPerType,
          }),
    ]);

    return {
      NORMAL: normal,
      AGENDA: [...upcomingAgenda, ...pastAgenda],
      QUOTE: quote,
    };
  } catch (error) {
    console.error("Error fetching quick posts by type:", error);
    return { NORMAL: [], AGENDA: [], QUOTE: [] };
  }
}

async function getQuickPostsInternal(options: { includeDrafts: boolean; limit: number }) {
  "use cache";
  cacheTag("quick-posts");
  cacheLife("minutes");

  try {
    const prisma = await getPrisma();
    return await prisma.quickPost.findMany({
      where: options.includeDrafts ? {} : { status: "Published" },
      orderBy: { createdAt: "desc" },
      take: options.limit,
    });
  } catch (error) {
    console.error("Error fetching quick posts:", error);
    return [];
  }
}
