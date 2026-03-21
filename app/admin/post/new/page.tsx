import { PostEditor } from "@/components/admin/PostEditor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return <PostEditor />;
}
