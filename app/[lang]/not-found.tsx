import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[62vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-lg bg-secondary/10 text-secondary">
        <span className="material-symbols-outlined text-[32px]">search_off</span>
      </div>
      <h1 className="mt-6 font-headline text-3xl font-black tracking-tight text-primary sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-on-surface-variant/75 sm:text-base">
        The work may have moved, or the link may no longer be available.
      </p>
      <Link
        href="/en/explore"
        className="tap-target mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-on-primary transition hover:bg-tertiary"
      >
        Explore works
        <span className="material-symbols-outlined text-[18px]">east</span>
      </Link>
    </section>
  );
}
