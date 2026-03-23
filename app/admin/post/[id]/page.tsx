import { PostEditor } from "@/components/admin/PostEditor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPostById } from "@/lib/actions/post";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "ADMIN") {
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
        category: post.category,
        status: post.status,
        thumbnail: post.thumbnail,
        blocks: post.blocks.map((b: any) => ({
          id: b.id,
          type: b.type,
          content: b.content,
          url: b.url || '',
          title: b.title || '',
          caption: b.caption || '',
          isLocked: b.isLocked ?? false,
        })),
      }}
    />
  );
}
