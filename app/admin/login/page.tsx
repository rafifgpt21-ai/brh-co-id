import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { Suspense } from "react";

type LoginSearchParams = Promise<{ error?: string | string[] }>;

async function LoginPanel({ searchParams }: { searchParams: LoginSearchParams }) {
  const session = await auth();
  if (session) {
    redirect("/admin");
  }

  const { error: rawError } = await searchParams;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  return (
    <div className="w-full max-w-md bg-surface-container-low/80 glass-effect rounded-3xl border border-outline-variant/15 p-10 shadow-2xl relative z-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center text-secondary shadow-sm mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
        </div>
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">Portal Admin</h1>
        <p className="font-body text-on-surface-variant text-sm">Masuk untuk mengelola konten web</p>
      </div>

      {error && !error.includes("CredentialsSignin") && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm font-medium mb-6 text-center border border-error/20">
          {error === "SessionRequired" ? "Silakan login untuk mengakses halaman ini." : "Terjadi kesalahan sistem."}
        </div>
      )}

      <LoginForm />
    </div>
  );
}

function LoginPanelFallback() {
  return (
    <div className="w-full max-w-md bg-surface-container-low/80 glass-effect rounded-3xl border border-outline-variant/15 p-10 shadow-2xl relative z-10">
      <div className="h-16 w-16 rounded-full bg-surface-container-lowest mx-auto mb-6 animate-pulse" />
      <div className="h-10 w-56 bg-surface-container-high rounded-xl mx-auto mb-3 animate-pulse" />
      <div className="h-5 w-64 bg-surface-container-high rounded-lg mx-auto mb-8 animate-pulse" />
      <div className="space-y-6">
        <div className="h-14 bg-surface-container-lowest rounded-2xl animate-pulse" />
        <div className="h-14 bg-surface-container-lowest rounded-2xl animate-pulse" />
        <div className="h-14 bg-surface-container-high rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export default function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-secondary-fixed blur-[120px] rounded-full"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary-fixed blur-[120px] rounded-full"></div>
      </div>

      <Suspense fallback={<LoginPanelFallback />}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
