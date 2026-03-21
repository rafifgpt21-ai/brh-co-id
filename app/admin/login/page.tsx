import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session) {
    redirect("/admin");
  }

  const error = searchParams?.error;

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-secondary-fixed blur-[120px] rounded-full"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary-fixed blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-surface-container-low/80 glass-effect rounded-3xl border border-outline-variant/15 p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center text-secondary shadow-sm mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
          </div>
          <h1 className="font-headline text-4xl font-bold text-primary mb-2">Portal Admin</h1>
          <p className="font-body text-on-surface-variant text-sm">Masuk untuk mengelola konten web</p>
        </div>
        
        {error && (
          <div className="bg-error/10 text-error p-4 rounded-xl text-sm font-medium mb-6 text-center border border-error/20">
            {error === "CredentialsSignin" ? "Username/Email atau Password salah." : "Terjadi kesalahan saat login."}
          </div>
        )}
        
        <form
          action={async (formData) => {
            "use server"
            try {
              await signIn("credentials", formData)
            } catch (error) {
              if (error instanceof AuthError) {
                return redirect(`/admin/login?error=${error.type}`)
              }
              throw error
            }
          }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <label htmlFor="identifier" className="block text-xs font-label font-bold tracking-widest uppercase text-secondary">
              Email atau Username
            </label>
            <input 
              type="text" 
              name="identifier" 
              id="identifier" 
              required 
              placeholder="admin / admin@brh.co.id" 
              className="h-14 font-body bg-surface-container-lowest border border-outline-variant/50 outline-none focus:ring-2 focus:ring-secondary/50 rounded-xl px-5 w-full text-on-surface placeholder:text-on-surface-variant/50 shadow-inner" 
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="password" className="block text-xs font-label font-bold tracking-widest uppercase text-secondary">
              Password
            </label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              required 
              placeholder="••••••••" 
              className="h-14 font-body bg-surface-container-lowest border border-outline-variant/50 outline-none focus:ring-2 focus:ring-secondary/50 rounded-xl px-5 w-full text-on-surface placeholder:text-on-surface-variant/50 shadow-inner" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-secondary text-on-secondary h-14 rounded-xl font-headline font-bold hover:shadow-lg hover:shadow-secondary/20 hover:scale-[1.02] transition-all duration-200 cursor-pointer text-base uppercase tracking-wider"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
