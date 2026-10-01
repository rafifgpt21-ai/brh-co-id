"use client";

import { SessionProvider as AuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  // Share session state across public controls; no focus/interval polling.
  // Permissions are still checked by each server action/private route.
  return <AuthSessionProvider refetchInterval={0} refetchOnWindowFocus={false} refetchWhenOffline={false}>{children}</AuthSessionProvider>;
}
