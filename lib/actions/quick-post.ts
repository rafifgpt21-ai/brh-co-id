"use server";

import { deleteFilesFromStorage } from "@/lib/uploadthing-server";
import { cacheLife, cacheTag, revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

const quickPostSchema = z.object({
  type: z.enum(["NORMAL", "QUOTE"]),
  content: z.string().trim().min(1, "Konten tidak boleh kosong").max(2000, "Konten terlalu panjang"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["Published", "Draft"]),
});

const quickPostStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["Published", "Draft"]),
});

const quickPostUpdateSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["NORMAL", "QUOTE"]),
  content: z.string().trim().min(1, "Konten tidak boleh kosong").max(2000, "Konten terlalu panjang"),
});

export type QuickPostFormData = z.infer<typeof quickPostSchema>;

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
  updateTag("quick-posts");
}

export async function createQuickPost(data: QuickPostFormData) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsedData = quickPostSchema.safeParse(data);
  if (!parsedData.success) {
    return { success: false, error: parsedData.error.issues[0].message };
  }

  const validData = parsedData.data;

  try {
    const prisma = await getPrisma();
    const quickPost = await prisma.quickPost.create({
      data: {
        type: validData.type,
        content: validData.content,
        imageUrl: validData.type === "NORMAL" ? validData.imageUrl || null : null,
        status: validData.status,
      },
      select: { id: true },
    });

    refreshQuickPostPaths();
    return { success: true, id: quickPost.id };
  } catch (error) {
    console.error("Error creating quick post:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan quick post" };
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
    return { success: true, id: quickPost.id };
  } catch (error) {
    console.error("Error updating quick post:", error);
    return { success: false, error: "Gagal mengubah status quick post" };
  }
}

export async function updateQuickPost(data: { id: string; type: "NORMAL" | "QUOTE"; content: string }) {
  const session = await requireAdmin();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsedData = quickPostUpdateSchema.safeParse(data);
  if (!parsedData.success) {
    return { success: false, error: parsedData.error.issues[0].message };
  }

  try {
    const prisma = await getPrisma();
    const quickPost = await prisma.quickPost.update({
      where: { id: parsedData.data.id },
      data: {
        type: parsedData.data.type,
        content: parsedData.data.content,
        imageUrl: parsedData.data.type === "QUOTE" ? null : undefined,
      },
      select: { id: true },
    });

    refreshQuickPostPaths();
    return { success: true, id: quickPost.id };
  } catch (error) {
    console.error("Error updating quick post:", error);
    return { success: false, error: "Gagal mengubah quick post" };
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

    if (quickPost.imageUrl) {
      try {
        await deleteFilesFromStorage([quickPost.imageUrl]);
      } catch (fileError) {
        console.error("Error deleting quick post image:", fileError);
      }
    }

    await prisma.quickPost.delete({ where: { id } });
    refreshQuickPostPaths();
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
