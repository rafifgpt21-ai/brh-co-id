import { PostEditor } from "@/components/admin/PostEditor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function PostEditorFallback() {
  return <div className="min-h-[70vh] animate-pulse rounded-2xl bg-surface-container-low" />;
}

async function NewPostContent() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return <PostEditor />;
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<PostEditorFallback />}>
      <NewPostContent />
    </Suspense>
  );
}
