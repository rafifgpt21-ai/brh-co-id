import { PostEditor, type EditorBlock } from "@/components/admin/PostEditor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPostById } from "@/lib/actions/post";
import { Suspense } from "react";

function PostEditorFallback() {
  return <div className="min-h-[70vh] animate-pulse rounded-2xl bg-surface-container-low" />;
}

const editorBlockTypes = new Set<EditorBlock["type"]>(["text", "image", "video", "pdf", "link", "contact"]);

function normalizeEditorBlockType(type: string): EditorBlock["type"] {
  return editorBlockTypes.has(type as EditorBlock["type"]) ? type as EditorBlock["type"] : "text";
}

function normalizePostStatus(status: string): "Published" | "Draft" {
  return status === "Published" ? "Published" : "Draft";
}

async function EditPostContent({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    redirect("/admin");
  }

  return (
    <PostEditor
      initialData={{
        id: post.id,
        title: post.title,
        titleEn: post.titleEn || '',
        category: post.category,
        status: normalizePostStatus(post.status),
        thumbnail: post.thumbnail,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        blocks: post.blocks.map((b) => ({
          id: b.id,
          type: normalizeEditorBlockType(b.type),
          content: b.content,
          contentEn: b.contentEn || '',
          url: b.url || '',
          title: b.title || '',
          titleEn: b.titleEn || '',
          caption: b.caption || '',
          captionEn: b.captionEn || '',
          isLocked: b.isLocked ?? false,
        })),
      }}
    />
  );
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PostEditorFallback />}>
      <EditPostContent params={params} />
    </Suspense>
  );
}
