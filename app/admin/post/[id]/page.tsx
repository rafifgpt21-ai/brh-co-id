import { PostEditor } from "@/components/admin/PostEditor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPostById } from "@/lib/actions/post";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
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
        titleEn: (post as any).titleEn || '',
        category: post.category,
        status: post.status,
        thumbnail: post.thumbnail,
        blocks: post.blocks.map((b: any) => ({
          id: b.id,
          type: b.type,
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
