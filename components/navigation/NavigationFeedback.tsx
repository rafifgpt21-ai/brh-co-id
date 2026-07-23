"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type NavigationFeedbackContextValue = {
  isNavigating: boolean;
  pendingHref: string | null;
  startNavigation: (href: string) => void;
};

const NavigationFeedbackContext = createContext<NavigationFeedbackContextValue | null>(null);

function normalizeHref(href: LinkProps["href"]) {
  const value = typeof href === "string" ? href : href.toString();
  if (!value.startsWith("/id")) return value;
  return value.replace(/^\/id(?=\/|[?#]|$)/, "") || "/";
}

function NavigationFeedbackRuntime({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setPendingHref(null), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  const startNavigation = useCallback((href: string) => {
    const current = `${pathname || ""}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    if (href === current || href === pathname) return;
    setPendingHref(href);
  }, [pathname, searchParams]);

  const value = useMemo(
    () => ({
      isNavigating: Boolean(pendingHref),
      pendingHref,
      startNavigation,
    }),
    [pendingHref, startNavigation],
  );

  return (
    <NavigationFeedbackContext.Provider value={value}>
      <div
        aria-hidden="true"
        className={`fixed inset-x-0 top-0 z-[10000] h-0.5 overflow-hidden bg-transparent transition-opacity duration-150 ${
          pendingHref ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 animate-pulse rounded-r-full bg-secondary shadow-[0_0_18px_rgba(0,81,213,0.35)] motion-reduce:animate-none" />
      </div>
      {children}
    </NavigationFeedbackContext.Provider>
  );
}

export function NavigationFeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationFeedbackRuntime>{children}</NavigationFeedbackRuntime>
    </Suspense>
  );
}

export function useNavigationFeedback() {
  const context = useContext(NavigationFeedbackContext);
  if (!context) {
    return {
      isNavigating: false,
      pendingHref: null,
      startNavigation: () => undefined,
    };
  }

  return context;
}

export function isPendingNavigationTarget(pendingHref: string | null, href: string) {
  if (!pendingHref) return false;
  const pendingPath = pendingHref.split("?")[0];
  return pendingPath === href || (href !== "/" && pendingPath.startsWith(`${href}/`));
}

type OptimisticLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    active?: boolean;
  };

export function OptimisticLink({
  href,
  onClick,
  onFocus,
  onPointerEnter,
  active,
  className,
  ...props
}: OptimisticLinkProps) {
  const router = useRouter();
  const { pendingHref, startNavigation } = useNavigationFeedback();
  const hrefString = normalizeHref(href);
  const normalizedHref = typeof href === "string" ? hrefString : href;
  const isPending = pendingHref === hrefString;

  const prefetch = useCallback(() => {
    router.prefetch(hrefString);
  }, [hrefString, router]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    startNavigation(hrefString);
  };

  return (
    <Link
      {...props}
      href={normalizedHref}
      data-active={active ? "" : undefined}
      data-pending={isPending ? "" : undefined}
      aria-current={active ? "page" : props["aria-current"]}
      onClick={handleClick}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        prefetch();
        onPointerEnter?.(event);
      }}
      className={className}
    />
  );
}
