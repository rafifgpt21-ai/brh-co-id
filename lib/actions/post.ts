"use server";

import { revalidatePath, updateTag, cacheTag, cacheLife } from "next/cache";
import {
  deleteFilesFromStorage,
  receiptsMatchUrls,
  rollbackNewUploads,
  validateUploadReceipts,
} from "@/lib/uploadthing-server";
import type { UploadReceipt } from "@/lib/uploadthing-types";
import { z } from "zod";

// Helper: generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export type PostFormData = {
  id?: string;
  title: string;
  titleEn?: string;
  category: string;
  thumbnail?: string;
  status: "Published" | "Draft";
  publishedAt: string;
  blocks: PostBlock[];
  newUploads?: UploadReceipt[];
};

type PostBlock = {
  id: string;
  type: string;
  content: string;
  contentEn?: string | null;
  url?: string | null;
  title?: string | null;
  titleEn?: string | null;
  caption?: string | null;
  captionEn?: string | null;
  isLocked?: boolean;
};

const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string(),
  contentEn: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  titleEn: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  captionEn: z.string().optional().nullable(),
  isLocked: z.boolean().optional(),
});

const postFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul tidak boleh kosong"),
  titleEn: z.string().optional(),
  category: z.string().min(1, "Kategori tidak boleh kosong"),
  thumbnail: z.string().optional(),
  status: z.enum(["Published", "Draft"]),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal terbit tidak valid"),
  blocks: z.array(blockSchema),
});

function resolvePostThumbnail(thumbnail: string | undefined, blocks: PostBlock[]) {
  const selectedThumbnail = thumbnail?.trim();
  if (selectedThumbnail) return selectedThumbnail;

  return blocks.find((block) => block.type === "image" && block.url?.trim())?.url?.trim() || null;
}

const HOME_SITE_SETTING_KEY = "home";

const homeFeaturedPostIdsSchema = z.array(z.string().min(1)).length(3, "Pilih tepat 3 karya untuk Karya Pilihan");

function parsePublicationDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function getSession() {
  const { auth } = await import("@/auth");
  return auth();
}

function isAdminSession(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
}

function refreshHomePaths() {
  revalidatePath("/");
  revalidatePath("/id");
  revalidatePath("/en");
  updateTag("posts");
}

async function refreshPostKnowledgeIndex(postId: string) {
  try {
    const { indexPublishedPost } = await import("@/lib/chatbot/indexing");
    await indexPublishedPost(postId);
  } catch (error) {
    console.error("Error refreshing chatbot knowledge index:", error);
  }
}

// CREATE or UPDATE a post
export async function savePost(data: PostFormData) {
  const session = await getSession();
  if (!isAdminSession(session)) {
    return { success: false, error: "Unauthorized" };
  }

  const newUploads = validateUploadReceipts(data.newUploads);
  if (!newUploads) {
    return { success: false, error: "Receipt upload tidak valid" };
  }

  const failWithRollback = async (error: string) => {
    if (newUploads.length > 0) {
      try {
        await rollbackNewUploads(newUploads, "post-save-failed");
      } catch (cleanupError) {
        console.error("Error rolling back failed post upload:", cleanupError);
      }
    }
    return { success: false as const, error };
  };

  const parsedData = postFormSchema.safeParse(data);
  if (!parsedData.success) {
    return failWithRollback("Validasi data gagal: " + parsedData.error.issues[0].message);
  }

  const validData = parsedData.data;
  const resolvedThumbnail = resolvePostThumbnail(validData.thumbnail, validData.blocks);
  const submittedUrls = [resolvedThumbnail, ...validData.blocks.map((block) => block.url)];
  if (!receiptsMatchUrls(newUploads, submittedUrls)) {
    return failWithRollback("Receipt upload tidak sesuai dengan file postingan");
  }

  try {
    const prisma = await getPrisma();
    const slug = generateSlug(validData.title);
    const slugEn = validData.titleEn?.trim() ? generateSlug(validData.titleEn) : null;
    const publishedAt = parsePublicationDate(validData.publishedAt);
    if (!publishedAt) return failWithRollback("Tanggal terbit tidak valid");

    if (validData.id) {
      // UPDATE existing post
      // 1. Fetch old post to compare files
      const oldPost = await prisma.post.findUnique({ where: { id: validData.id } });
      if (!oldPost) return failWithRollback("Post tidak ditemukan");

      const oldUrls = [
        oldPost.thumbnail,
        ...(oldPost.blocks as PostBlock[])
        .map((b) => b.url)
      ].filter((url): url is string => Boolean(url));
      const newUrls = [
        resolvedThumbnail,
        ...validData.blocks.map((b) => b.url),
      ].filter((url): url is string => Boolean(url));
      const filesToDelete = Array.from(new Set(oldUrls.filter((url) => !newUrls.includes(url))));

      // 2. Update post
      const post = await prisma.post.update({
        where: { id: validData.id },
        data: {
          title: validData.title,
          titleEn: validData.titleEn?.trim() || null,
          slug,
          slugEn,
          category: validData.category,
          thumbnail: resolvedThumbnail,
          status: validData.status,
          publishedAt,
          blocks: validData.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            content: b.content,
            contentEn: b.contentEn || null,
            url: b.url || null,
            title: b.title || null,
            titleEn: b.titleEn || null,
            caption: b.caption || null,
            captionEn: b.captionEn || null,
            isLocked: b.isLocked ?? false,
          })),
        },
      });

      // 3. Clean up deleted files
      if (filesToDelete.length > 0) {
        try {
          await deleteFilesFromStorage(filesToDelete);
        } catch (cleanupError) {
          console.error("Error cleaning replaced post files:", cleanupError);
        }
      }

      revalidatePath("/admin");
      revalidatePath(`/post/${post.slug}`);
      revalidatePath(`/id/post/${post.slug}`);
      revalidatePath(`/en/post/${post.slugEn || post.slug}`);
      refreshHomePaths();
      updateTag(`post-${post.id}`);
      await refreshPostKnowledgeIndex(post.id);
      return { success: true, post };
    } else {
      // CREATE new post
      // Ensure slug uniqueness with a robust retry mechanism
      let uniqueSlug = slug;
      let isUnique = false;
      let retryCount = 0;
      const MAX_RETRIES = 10;

      while (!isUnique && retryCount < MAX_RETRIES) {
        const existing = await prisma.post.findUnique({ 
          where: { slug: uniqueSlug },
          select: { id: true } 
        });
        
        if (!existing) {
          isUnique = true;
        } else {
          retryCount++;
          // Append a random string or counter for uniqueness
          uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }
      }

      if (!isUnique) {
        return failWithRollback("Gagal membuat slug unik setelah beberapa percobaan");
      }

      const post = await prisma.post.create({
        data: {
          title: validData.title,
          titleEn: validData.titleEn?.trim() || null,
          slug: uniqueSlug,
          slugEn,
          category: validData.category,
          thumbnail: resolvedThumbnail,
          status: validData.status,
          publishedAt,
          blocks: validData.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            content: b.content,
            contentEn: b.contentEn || null,
            url: b.url || null,
            title: b.title || null,
            titleEn: b.titleEn || null,
            caption: b.caption || null,
            captionEn: b.captionEn || null,
            isLocked: b.isLocked ?? false,
          })),
        },
      });
      revalidatePath("/admin");
      refreshHomePaths();
      await refreshPostKnowledgeIndex(post.id);
      return { success: true, post };
    }
  } catch (error: unknown) {
    console.error("Error saving post:", error);
    return failWithRollback("Gagal menyimpan postingan");
  }
}

// DELETE a post
export async function deletePost(id: string) {
  const session = await getSession();
  if (!isAdminSession(session)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const prisma = await getPrisma();
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return { success: false, error: "Post tidak ditemukan" };
    }

    const filesToDelete: string[] = [];
    if (post.thumbnail) filesToDelete.push(post.thumbnail);
    
    // Clean up blocks
    if (Array.isArray(post.blocks)) {
      (post.blocks as PostBlock[]).forEach((block) => {
        if (block.url) filesToDelete.push(block.url);
      });
    }

    await prisma.post.delete({ where: { id } });

    if (filesToDelete.length > 0) {
      try {
        await deleteFilesFromStorage(filesToDelete);
      } catch (fileError) {
        console.error("Error deleting files after post deletion:", fileError);
      }
    }
    try {
      const { removePostFromKnowledgeIndex } = await import("@/lib/chatbot/indexing");
      await removePostFromKnowledgeIndex(id);
    } catch (indexError) {
      console.error("Error removing deleted post from knowledge index:", indexError);
    }
    
    revalidatePath("/admin");
    refreshHomePaths();
    updateTag(`post-${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    const message = error instanceof Error ? error.message : "Kesalahan tidak dikenal";
    return { success: false, error: `Gagal menghapus postingan: ${message}` };
  }
}

export async function getHomeFeaturedPostIdsForAdmin() {
  const session = await getSession();
  if (!isAdminSession(session)) {
    return [];
  }

  try {
    const prisma = await getPrisma();
    const setting = await prisma.siteSetting.findUnique({
      where: { key: HOME_SITE_SETTING_KEY },
      select: { homeFeaturedPostIds: true },
    });

    return setting?.homeFeaturedPostIds || [];
  } catch (error) {
    console.error("Error fetching home featured posts setting:", error);
    return [];
  }
}

export async function saveHomeFeaturedPostIds(postIds: string[]) {
  const session = await getSession();
  if (!isAdminSession(session)) {
    return { success: false, error: "Unauthorized" };
  }

  const uniquePostIds = Array.from(new Set(postIds));
  const parsedPostIds = homeFeaturedPostIdsSchema.safeParse(uniquePostIds);
  if (!parsedPostIds.success) {
    return { success: false, error: parsedPostIds.error.issues[0].message };
  }

  try {
    const prisma = await getPrisma();
    const publishedPosts = await prisma.post.findMany({
      where: {
        id: { in: parsedPostIds.data },
        status: "Published",
      },
      select: { id: true },
    });
    const publishedPostIds = new Set(publishedPosts.map((post) => post.id));

    if (parsedPostIds.data.some((id) => !publishedPostIds.has(id))) {
      return { success: false, error: "Hanya karya Published yang bisa ditampilkan di beranda" };
    }

    await prisma.siteSetting.upsert({
      where: { key: HOME_SITE_SETTING_KEY },
      create: {
        key: HOME_SITE_SETTING_KEY,
        homeFeaturedPostIds: parsedPostIds.data,
      },
      update: {
        homeFeaturedPostIds: parsedPostIds.data,
      },
    });

    revalidatePath("/admin");
    refreshHomePaths();

    return { success: true, homeFeaturedPostIds: parsedPostIds.data };
  } catch (error) {
    console.error("Error saving home featured posts setting:", error);
    return { success: false, error: "Gagal menyimpan pilihan beranda" };
  }
}

export async function resetHomeFeaturedPostIds() {
  const session = await getSession();
  if (!isAdminSession(session)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const prisma = await getPrisma();
    await prisma.siteSetting.upsert({
      where: { key: HOME_SITE_SETTING_KEY },
      create: { key: HOME_SITE_SETTING_KEY, homeFeaturedPostIds: [] },
      update: { homeFeaturedPostIds: [] },
    });
    revalidatePath("/admin");
    refreshHomePaths();
    return { success: true, homeFeaturedPostIds: [] };
  } catch (error) {
    console.error("Error resetting home featured posts setting:", error);
    return { success: false, error: "Gagal mereset pilihan Highlight" };
  }
}

export async function getPosts(options?: {
  search?: string;
  status?: string;
  category?: string;
  locale?: string;
}) {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return getPostsInternal(options, isAdmin);
}

// Internal function to use cache
async function getPostsInternal(options?: {
  search?: string;
  status?: string;
  category?: string;
  locale?: string;
}, isAdmin?: boolean) {
  'use cache';
  cacheTag("posts");
  cacheLife("minutes");

  try {
    const prisma = await getPrisma();
    const where: Record<string, unknown> = {};

    if (!isAdmin) {
      where.status = "Published";
    } else if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { titleEn: { contains: options.search, mode: "insensitive" } },
      ];
    }
    if (options?.category) {
      where.category = options.category;
    }

    const posts = await prisma.post.findMany({
      where,
    });
    return posts.sort((a, b) =>
      (b.publishedAt || b.createdAt).getTime() - (a.publishedAt || a.createdAt).getTime()
    );
  } catch (error: unknown) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// GET single post by id
export async function getPostById(id: string) {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostByIdInternal(id, isAdmin);
}

async function getPostByIdInternal(id: string, isAdmin: boolean) {
  'use cache';
  cacheTag("posts", `post-${id}`);
  
  try {
    const prisma = await getPrisma();
    const post = await prisma.post.findUnique({ where: { id } });
    if (post && post.status !== "Published" && !isAdmin) {
      return null;
    }
    return post;
  } catch {
    return null;
  }
}

// GET single post by slug (for public view)
export async function getPostBySlug(slug: string) {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostBySlugInternal(slug, isAdmin);
}

async function getPostBySlugInternal(slug: string, isAdmin: boolean) {
  'use cache';
  cacheTag("posts", `post-slug-${slug}`);

  try {
    const prisma = await getPrisma();
    const post = await prisma.post.findFirst({
      where: {
        OR: [
          { slug },
          { slugEn: slug },
        ],
      },
    });
    if (post && post.status !== "Published" && !isAdmin) {
      return null;
    }
    return post;
  } catch {
    return null;
  }
}

// Check if a file URL (PDF/Image) is authorized to be viewed
export async function getPostByFileUrl(url: string) {
  const session = await getSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  try {
    const prisma = await getPrisma();
    // Find any post containing this URL in its blocks
    const post = await prisma.post.findFirst({
      where: {
        blocks: {
          some: {
            url: { equals: url }
          }
        }
      }
    });

    // If post not found, we assume it's OK (could be a public asset not tied to a post)
    // BUT for PDF viewer, we want to be safe.
    if (!post) return { authorized: true };

    if (post.status !== "Published" && !isAdmin) {
      return { authorized: false, status: post.status };
    }

    return { authorized: true, status: post.status };
  } catch (error) {
    console.error("Error checking file authorization:", error);
    return { authorized: false };
  }
}
