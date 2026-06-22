import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/user-actions";
import { UserTable } from "@/components/admin/UserTable";

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const users = await getUsers();

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 md:px-12 xl:px-24 bg-[#fcf8fa]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-[#0F172A] tracking-tight">
              Settings
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Kelola pengguna (admin) dan pengaturan platform.
            </p>
          </div>
        </div>

        <UserTable initialUsers={users as any} />
      </div>
    </div>
  );
}
