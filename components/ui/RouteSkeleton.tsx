type RouteSkeletonProps = {
  variant?: "home" | "catalog" | "article" | "page";
};

const rows = Array.from({ length: 6 }, (_, index) => index);

export function RouteSkeleton({ variant = "page" }: RouteSkeletonProps) {
  if (variant === "catalog") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-12 lg:px-24">
        <div className="mx-auto mb-10 max-w-3xl">
          <div className="skeleton mx-auto h-8 w-2/3 sm:h-12" />
          <div className="skeleton mx-auto mt-5 h-14 w-full rounded-full" />
          <div className="mt-5 flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton h-9 w-24 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          {rows.map((item) => (
            <div key={item} className="flex min-h-[150px] overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest">
              <div className="skeleton h-auto w-32 shrink-0 rounded-none sm:w-44" />
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton mt-4 h-5 w-11/12" />
                  <div className="skeleton mt-2 h-5 w-2/3" />
                  <div className="skeleton mt-4 h-3 w-full" />
                </div>
                <div className="skeleton mt-5 h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "article") {
    return (
      <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 md:py-20">
        <div className="skeleton mx-auto h-9 w-36 rounded-full" />
        <div className="skeleton mx-auto mt-8 h-12 w-11/12 sm:h-16" />
        <div className="skeleton mx-auto mt-4 h-12 w-3/4 sm:h-16" />
        <div className="mx-auto mt-8 flex max-w-md gap-4">
          <div className="skeleton h-4 flex-1" />
          <div className="skeleton h-4 flex-1" />
        </div>
        <div className="mt-16 space-y-5">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className={`skeleton h-4 ${item % 3 === 0 ? "w-10/12" : "w-full"}`} />
          ))}
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:px-12 lg:px-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="skeleton h-4 w-48" />
          <div className="skeleton mt-7 h-16 w-full sm:h-24" />
          <div className="skeleton mt-4 h-16 w-5/6 sm:h-24" />
          <div className="skeleton mt-8 h-14 max-w-2xl rounded-full" />
        </div>
        <div className="skeleton min-h-64 rounded-lg" />
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4">
            <div className="skeleton aspect-16/10 w-full" />
            <div className="skeleton mt-5 h-4 w-20" />
            <div className="skeleton mt-4 h-5 w-full" />
            <div className="skeleton mt-2 h-5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
