import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { NavLinks } from './NavLinks';
import { MobileMenu } from './MobileMenu';

export const Header = async () => {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="w-full px-6 md:px-8 lg:px-12 xl:px-24 flex justify-between items-center h-20">
        <div className="flex items-center gap-4">
          <MobileMenu isAdmin={isAdmin} />
          <div className="text-xl font-bold tracking-tighter text-tertiary font-headline">
            <Link href="/">BRH Intellectual</Link>
          </div>
        </div>
        
        <NavLinks isAdmin={isAdmin} />
        
        <div className="flex items-center gap-4">
          {session ? (
            <details className="relative group cursor-pointer">
              <summary className="list-none flex items-center gap-3 bg-secondary/5 px-4 py-2 rounded-xl text-primary font-headline font-medium transition-all hover:bg-secondary/10">
                <span className="capitalize hidden sm:inline">{session.user?.name || "User"}</span>
                {session.user?.role && (
                  <span className="text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN" ? "Admin" : session.user.role}
                  </span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4 transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
              </summary>
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-2 z-50">
                <div className="flex flex-col gap-1">
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-widest">Akun</div>
                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                  {isSuperAdmin && (
                    <Link href="/admin/settings" className="w-full text-left font-headline font-medium px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                      Settings
                    </Link>
                  )}
                  <form action={async () => {
                    "use server";
                    await signOut();
                  }}>
                    <button type="submit" className="w-full text-left font-headline font-medium px-3 py-2 text-[#e11d48] hover:bg-[#e11d48]/5 rounded-lg transition-all flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ) : (
            <Link href="/admin/login" className="text-primary font-headline font-medium px-6 py-2 rounded-xl hover:bg-secondary/5 transition-all text-sm sm:text-base">
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>

  );
};
