import { auth } from "@/auth";
import Link from "next/link";
import { Suspense } from "react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Not explicitly requiring session here since pages handle redirects, 
  // but we can leave the server component wrapper.

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      <div className="flex-1 px-1 sm:px-6 w-full mx-auto pt-2 md:pt-4 pb-8 lg:pb-16">
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-sm text-on-surface-variant">Memuat admin...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
