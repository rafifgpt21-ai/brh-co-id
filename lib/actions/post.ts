"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath, updateTag, cacheTag, cacheLife } from "next/cache";
import { deleteFilesFromStorage } from "@/lib/uploadthing-server";
import { indexPublishedPost, removePostFromKnowledgeIndex } from "@/lib/chatbot/indexing";
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
  blocks: PostBlock[];
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
  blocks: z.array(blockSchema),
});

async function refreshPostKnowledgeIndex(postId: string) {
  try {
    await indexPublishedPost(postId);
  } catch (error) {
    console.error("Error refreshing chatbot knowledge index:", error);
  }
}

// CREATE or UPDATE a post
export async function savePost(data: PostFormData) {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  const parsedData = postFormSchema.safeParse(data);
  if (!parsedData.success) {
    return { success: false, error: "Validasi data gagal: " + parsedData.error.issues[0].message };
  }

  const validData = parsedData.data;

  try {
    const slug = generateSlug(validData.title);
    const slugEn = validData.titleEn?.trim() ? generateSlug(validData.titleEn) : null;

    if (validData.id) {
      // UPDATE existing post
      // 1. Fetch old post to compare files
      const oldPost = await prisma.post.findUnique({ where: { id: validData.id } });
      if (!oldPost) return { success: false, error: "Post tidak ditemukan" };

      const filesToDelete: string[] = [];

      // Check thumbnail
      if (oldPost.thumbnail && oldPost.thumbnail !== validData.thumbnail) {
        filesToDelete.push(oldPost.thumbnail);
      }

      // Check blocks
      const oldUrls = (oldPost.blocks as PostBlock[])
        .map((b) => b.url)
        .filter((url): url is string => !!url);
      const newUrls = validData.blocks
        .map((b) => b.url)
        .filter((url): url is string => !!url);

      // Find URLs in old that are NOT in new
      oldUrls.forEach((url) => {
        if (!newUrls.includes(url)) {
          filesToDelete.push(url);
        }
      });

      // 2. Update post
      const post = await prisma.post.update({
        where: { id: validData.id },
        data: {
          title: validData.title,
          titleEn: validData.titleEn?.trim() || null,
          slug,
          slugEn,
          category: validData.category,
          thumbnail: validData.thumbnail || null,
          status: validData.status,
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
        await deleteFilesFromStorage(filesToDelete);
      }

      revalidatePath("/admin");
      revalidatePath(`/post/${post.slug}`);
      revalidatePath(`/id/post/${post.slug}`);
      revalidatePath(`/en/post/${post.slugEn || post.slug}`);
      revalidatePath("/");
      revalidatePath("/id");
      revalidatePath("/en");
      updateTag("posts");
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
        return { success: false, error: "Gagal membuat slug unik setelah beberapa percobaan" };
      }

      const post = await prisma.post.create({
        data: {
          title: validData.title,
          titleEn: validData.titleEn?.trim() || null,
          slug: uniqueSlug,
          slugEn,
          category: validData.category,
          thumbnail: validData.thumbnail || null,
          status: validData.status,
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
      revalidatePath("/");
      revalidatePath("/id");
      revalidatePath("/en");
      updateTag("posts");
      await refreshPostKnowledgeIndex(post.id);
      return { success: true, post };
    }
  } catch (error: unknown) {
    console.error("Error saving post:", error);
    return { success: false, error: "Gagal menyimpan postingan" };
  }
}

// DELETE a post
export async function deletePost(id: string) {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
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

    if (filesToDelete.length > 0) {
      try {
        await deleteFilesFromStorage(filesToDelete);
      } catch (fileError) {
        console.error("Error deleting files during post deletion:", fileError);
        // We continue deleting the post record even if file deletion fails
      }
    }

    await prisma.post.delete({ where: { id } });
    await removePostFromKnowledgeIndex(id);
    
    revalidatePath("/admin");
    revalidatePath("/");
    updateTag("posts");
    updateTag(`post-${id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return { success: false, error: `Gagal menghapus postingan: ${error?.message || "Kesalahan tidak dikenal"}` };
  }
}

export async function getPosts(options?: {
  search?: string;
  status?: string;
  category?: string;
  locale?: string;
}) {
  const session = await auth();
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

    return await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  } catch (error: unknown) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// GET single post by id
export async function getPostById(id: string) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostByIdInternal(id, isAdmin);
}

async function getPostByIdInternal(id: string, isAdmin: boolean) {
  'use cache';
  cacheTag("posts", `post-${id}`);
  
  try {
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
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostBySlugInternal(slug, isAdmin);
}

async function getPostBySlugInternal(slug: string, isAdmin: boolean) {
  'use cache';
  cacheTag("posts", `post-slug-${slug}`);

  try {
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
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  try {
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
