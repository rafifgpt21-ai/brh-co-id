"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { deleteFilesFromStorage } from "@/lib/uploadthing-server";

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
  category: string;
  thumbnail?: string;
  status: "Published" | "Draft";
  blocks: {
    id: string;
    type: string;
    content: string;
    url?: string;
    title?: string;
    caption?: string;
    isLocked?: boolean;
  }[];
};

// CREATE or UPDATE a post
export async function savePost(data: PostFormData) {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const slug = generateSlug(data.title);

    if (data.id) {
      // UPDATE existing post
      // 1. Fetch old post to compare files
      const oldPost = await prisma.post.findUnique({ where: { id: data.id } });
      if (!oldPost) return { success: false, error: "Post tidak ditemukan" };

      const filesToDelete: string[] = [];

      // Check thumbnail
      if (oldPost.thumbnail && oldPost.thumbnail !== data.thumbnail) {
        filesToDelete.push(oldPost.thumbnail);
      }

      // Check blocks
      const oldUrls = (oldPost.blocks as any[])
        .map((b) => b.url)
        .filter((url): url is string => !!url);
      const newUrls = data.blocks
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
        where: { id: data.id },
        data: {
          title: data.title,
          slug,
          category: data.category,
          thumbnail: data.thumbnail || null,
          status: data.status,
          blocks: data.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            content: b.content,
            url: b.url || null,
            title: b.title || null,
            caption: b.caption || null,
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
      revalidatePath("/");
      revalidateTag("posts", "max");
      revalidateTag(`post-${post.id}`, "max");
      return { success: true, post };
    } else {
      // CREATE new post
      // Ensure slug uniqueness
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const post = await prisma.post.create({
        data: {
          title: data.title,
          slug: uniqueSlug,
          category: data.category,
          thumbnail: data.thumbnail || null,
          status: data.status,
          blocks: data.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            content: b.content,
            url: b.url || null,
            title: b.title || null,
            caption: b.caption || null,
            isLocked: b.isLocked ?? false,
          })),
        },
      });
      revalidatePath("/admin");
      revalidatePath("/");
      revalidateTag("posts", "max");
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
    if (post) {
      const filesToDelete: string[] = [];
      if (post.thumbnail) filesToDelete.push(post.thumbnail);
      
      // Clean up blocks
      post.blocks.forEach((block: any) => {
        if (block.url) filesToDelete.push(block.url);
      });

      if (filesToDelete.length > 0) {
        await deleteFilesFromStorage(filesToDelete);
      }
    }

    await prisma.post.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    revalidateTag("posts", "max");
    revalidateTag(`post-${id}`, "max");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Gagal menghapus postingan" };
  }
}

const getPostsCached = unstable_cache(
  async (options?: {
    search?: string;
    status?: string;
    category?: string;
  }, isAdmin?: boolean) => {
    try {
      const where: Record<string, any> = {};

      if (!isAdmin) {
        where.status = "Published";
      } else if (options?.status) {
        where.status = options.status;
      }

      if (options?.search) {
        where.title = { contains: options.search, mode: "insensitive" };
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
  },
  ["get-posts"],
  { tags: ["posts"], revalidate: 3600 }
);

export async function getPosts(options?: {
  search?: string;
  status?: string;
  category?: string;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostsCached(options, isAdmin);
}

// GET single post by id
const getPostByIdCached = unstable_cache(
  async (id: string, isAdmin: boolean) => {
    try {
      const post = await prisma.post.findUnique({ where: { id } });
      if (post && post.status !== "Published" && !isAdmin) {
        return null;
      }
      return post;
    } catch {
      return null;
    }
  },
  ["post-by-id"],
  { tags: ["posts"] }
);

export async function getPostById(id: string) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostByIdCached(id, isAdmin);
}

// GET single post by slug (for public view)
const getPostBySlugCached = unstable_cache(
  async (slug: string, isAdmin: boolean) => {
    try {
      const post = await prisma.post.findUnique({ where: { slug } });
      if (post && post.status !== "Published" && !isAdmin) {
        return null;
      }
      return post;
    } catch {
      return null;
    }
  },
  ["post-by-slug"],
  { tags: ["posts"] }
);

export async function getPostBySlug(slug: string) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  return getPostBySlugCached(slug, isAdmin);
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
