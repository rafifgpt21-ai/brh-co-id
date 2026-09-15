"use server";

import {
  deleteFilesFromStorage,
  receiptsMatchUrls,
  rollbackNewUploads,
  validateUploadReceipts,
} from "@/lib/uploadthing-server";
import type { UploadReceipt } from "@/lib/uploadthing-types";
import {
  getRecurringAgendaDates,
  MAX_RECURRING_AGENDA_OCCURRENCES,
  MAX_RECURRING_AGENDA_RANGE_DAYS,
} from "@/lib/quick-post-recurrence";
import { randomBytes } from "node:crypto";
import { cacheLife, cacheTag, revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

const quickPostTypeSchema = z.enum(["AGENDA", "QUOTE"]);
const agendaCategorySchema = z.enum(["TEACHING", "ENGAGEMENT"]);
const agendaDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));
const agendaTimeSchema = z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal(""));

const quickPostFields = {
  type: quickPostTypeSchema,
  agendaCategory: agendaCategorySchema.optional(),
  content: z.string().trim().min(1, "Konten tidak boleh kosong").max(2000, "Konten terlalu panjang"),
  agendaDate: agendaDateSchema,
  agendaStartTime: agendaTimeSchema,
  agendaEndTime: agendaTimeSchema,
  agendaLink: z.string().trim().max(2048, "Tautan terlalu panjang").optional().or(z.literal("")),
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

  if (data.type !== "AGENDA") {
    if (data.agendaCategory) {
      context.addIssue({
        code: "custom",
        message: "Kategori agenda hanya berlaku untuk agenda",
        path: ["agendaCategory"],
      });
    }
    if (data.agendaLink) {
      context.addIssue({
        code: "custom",
        message: "Tautan pengajaran hanya berlaku untuk agenda Pengajaran",
        path: ["agendaLink"],
      });
    }
    return;
  }

  if (!data.agendaCategory) {
    context.addIssue({
      code: "custom",
      message: "Pilih kategori Pengajaran atau Pengabdian",
      path: ["agendaCategory"],
    });
  }

  if (data.agendaLink) {
    let validUrl = false;
    try {
      const url = new URL(data.agendaLink);
      validUrl = url.protocol === "http:" || url.protocol === "https:";
    } catch {
      validUrl = false;
    }

    if (!validUrl) {
      context.addIssue({
        code: "custom",
        message: "Tautan harus berupa URL http atau https yang valid",
        path: ["agendaLink"],
      });
    } else if (data.agendaCategory !== "TEACHING") {
      context.addIssue({
        code: "custom",
        message: "Tautan hanya dapat ditambahkan pada agenda Pengajaran",
        path: ["agendaLink"],
      });
    }
  }

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

const recurringQuickPostSchema = z.object({
  type: z.literal("AGENDA"),
  agendaCategory: agendaCategorySchema,
  content: quickPostFields.content,
  rangeStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai rentang tidak valid"),
  rangeEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal akhir rentang tidak valid"),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, "Pilih minimal satu hari").max(7),
  agendaStartTime: agendaTimeSchema,
  agendaEndTime: agendaTimeSchema,
  agendaLink: quickPostFields.agendaLink,
  locationLabel: quickPostFields.locationLabel,
  locationLatitude: quickPostFields.locationLatitude,
  locationLongitude: quickPostFields.locationLongitude,
  status: z.enum(["Published", "Draft"]),
});

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
export type RecurringQuickPostFormData = z.infer<typeof recurringQuickPostSchema>;
export type ActiveQuickPostType = z.infer<typeof quickPostTypeSchema>;
export type QuickPostType = "NORMAL" | ActiveQuickPostType;
export type AgendaCategory = z.infer<typeof agendaCategorySchema>;
export type QuickPostUpdateData = z.infer<typeof quickPostUpdateSchema> & { newUploads?: UploadReceipt[] };

function getAgendaData(data: z.infer<z.ZodObject<typeof quickPostFields>>) {
  if (data.type !== "AGENDA") {
    return {
      startsAt: null,
      endsAt: null,
      agendaCategory: null,
      agendaLink: null,
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
    agendaCategory: data.agendaCategory,
    agendaLink: data.agendaCategory === "TEACHING" ? data.agendaLink || null : null,
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
  revalidatePath("/pengabdian");
  revalidatePath("/en/engagement");
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
        imageUrl: null,
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

export async function createRecurringQuickPosts(data: RecurringQuickPostFormData) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsedData = recurringQuickPostSchema.safeParse(data);
  if (!parsedData.success) {
    return { success: false as const, error: parsedData.error.issues[0].message };
  }

  const validData = parsedData.data;
  const schedule = getRecurringAgendaDates(
    validData.rangeStartDate,
    validData.rangeEndDate,
    validData.weekdays,
  );

  if (schedule.error === "invalid-range") {
    return { success: false as const, error: "Rentang tanggal tidak valid" };
  }
  if (schedule.error === "range-too-long") {
    return {
      success: false as const,
      error: `Rentang jadwal maksimal ${MAX_RECURRING_AGENDA_RANGE_DAYS} hari`,
    };
  }
  if (schedule.error === "too-many") {
    return {
      success: false as const,
      error: `Maksimal ${MAX_RECURRING_AGENDA_OCCURRENCES} agenda dalam sekali posting`,
    };
  }
  if (schedule.dates.length === 0) {
    return { success: false as const, error: "Tidak ada hari terpilih dalam rentang tanggal" };
  }

  const firstOccurrence = quickPostSchema.safeParse({
    type: "AGENDA",
    agendaCategory: validData.agendaCategory,
    content: validData.content,
    agendaDate: schedule.dates[0],
    agendaStartTime: validData.agendaStartTime,
    agendaEndTime: validData.agendaEndTime,
    agendaLink: validData.agendaLink,
    locationLabel: validData.locationLabel,
    locationLatitude: validData.locationLatitude,
    locationLongitude: validData.locationLongitude,
    imageUrl: "",
    status: validData.status,
  });
  if (!firstOccurrence.success) {
    return { success: false as const, error: firstOccurrence.error.issues[0].message };
  }

  try {
    const prisma = await getPrisma();
    const ids = schedule.dates.map(() => randomBytes(12).toString("hex"));
    await prisma.quickPost.createMany({
      data: schedule.dates.map((agendaDate, index) => {
        const agendaData = getAgendaData({
          type: "AGENDA",
          agendaCategory: validData.agendaCategory,
          content: validData.content,
          agendaDate,
          agendaStartTime: validData.agendaStartTime,
          agendaEndTime: validData.agendaEndTime,
          agendaLink: validData.agendaLink,
          locationLabel: validData.locationLabel,
          locationLatitude: validData.locationLatitude,
          locationLongitude: validData.locationLongitude,
        });

        return {
          id: ids[index],
          type: "AGENDA",
          content: validData.content,
          imageUrl: null,
          ...agendaData,
          status: validData.status,
        };
      }),
    });

    refreshQuickPostPaths();
    if (validData.status === "Published") {
      after(async () => {
        for (let index = 0; index < ids.length; index += 4) {
          await Promise.all(ids.slice(index, index + 4).map(refreshQuickPostKnowledgeIndex));
        }
      });
    }

    return { success: true as const, count: schedule.dates.length };
  } catch (error) {
    console.error("Error creating recurring quick posts:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Gagal menyimpan agenda berulang",
    };
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

    const nextImageUrl = null;
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
    const [quote, upcomingAgenda, pastAgenda] = await Promise.all([
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
      NORMAL: [],
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
      where: {
        ...(options.includeDrafts ? {} : { status: "Published" }),
        type: { in: ["AGENDA", "QUOTE"] },
      },
      orderBy: { createdAt: "desc" },
      take: options.limit,
    });
  } catch (error) {
    console.error("Error fetching quick posts:", error);
    return [];
  }
}
