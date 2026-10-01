"use client";

import { signOut, useSession } from "next-auth/react";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type HeaderControlVariant = "topbar" | "drawer";

export function LoginControl({ dict, variant = "topbar" }: { dict: Dictionary; variant?: HeaderControlVariant }) {
  if (variant === "drawer") {
    return (
      <OptimisticLink
        href="/admin/login"
        className="flex w-full items-center justify-between border-b border-outline-variant/20 pb-4 font-headline text-sm font-semibold text-primary transition-colors hover:text-primary/80"
      >
        <span>{dict.nav.login}</span>
        <span className="material-symbols-outlined text-[18px]">login</span>
      </OptimisticLink>
    );
  }

  return (
    <OptimisticLink
      href="/admin/login"
      className="rounded-xl bg-primary px-4 py-2 font-headline text-sm font-semibold text-on-primary transition-all hover:bg-primary/90"
    >
      {dict.nav.login}
    </OptimisticLink>
  );
}

export function AccountControls({ dict, variant = "topbar" }: { dict: Dictionary; variant?: HeaderControlVariant }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isDrawer = variant === "drawer";

  if (!session) {
    return <LoginControl dict={dict} variant={variant} />;
  }

  if (isDrawer) {
    return (
      <div className="w-full border-b border-outline-variant/20 pb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate font-headline text-sm font-semibold text-tertiary">
            {session.user?.name || "User"}
          </span>
          {session.user?.role && (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary">
              {isAdmin ? "Admin" : session.user.role}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {isAdmin && (
            <>
              <OptimisticLink href="/admin" className="flex items-center justify-between rounded-md py-2 font-headline text-sm font-semibold text-primary transition-colors hover:text-primary/80">
                <span>{dict.nav.admin}</span>
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
              </OptimisticLink>
              <OptimisticLink href="/admin/analytics" className="flex items-center justify-between rounded-md py-2 font-headline text-sm font-semibold text-tertiary/80 transition-colors hover:text-primary">
                <span>Analytics</span>
                <span className="material-symbols-outlined text-[18px]">analytics</span>
              </OptimisticLink>
            </>
          )}
          {isSuperAdmin && (
            <OptimisticLink href="/admin/settings" className="flex items-center justify-between rounded-md py-2 font-headline text-sm font-semibold text-tertiary/80 transition-colors hover:text-primary">
              <span>{dict.nav.settings}</span>
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </OptimisticLink>
          )}
          <form action={async () => {
            await signOut();
          }}>
            <button type="submit" className="flex w-full items-center justify-between rounded-md py-2 text-left font-headline text-sm font-semibold text-[#e11d48] transition-colors hover:text-[#be123c]">
              <span>{dict.nav.logout}</span>
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <details className="relative group cursor-pointer">
      <summary className="list-none flex items-center gap-3 bg-secondary/5 px-4 py-2 rounded-xl text-primary font-headline font-medium transition-all hover:bg-secondary/10">
        <span className="capitalize hidden sm:inline">{session.user?.name || "User"}</span>
        {session.user?.role && (
          <span className="text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
            {isAdmin ? "Admin" : session.user.role}
          </span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4 transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-2 z-50">
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-widest">{dict.nav.account}</div>
          <div className="h-px bg-gray-100 my-1 mx-2"></div>
          {isAdmin && (
            <>
              <OptimisticLink href="/admin" className="w-full text-left font-headline font-medium px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                {dict.nav.admin}
              </OptimisticLink>
              <OptimisticLink href="/admin/analytics" className="w-full text-left font-headline font-medium px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                Analytics
              </OptimisticLink>
            </>
          )}
          {isSuperAdmin && (
            <OptimisticLink href="/admin/settings" className="w-full text-left font-headline font-medium px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              {dict.nav.settings}
            </OptimisticLink>
          )}
          <form action={async () => {
            await signOut();
          }}>
            <button type="submit" className="w-full text-left font-headline font-medium px-3 py-2 text-[#e11d48] hover:bg-[#e11d48]/5 rounded-lg transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              {dict.nav.logout}
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}

