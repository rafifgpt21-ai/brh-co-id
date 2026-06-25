type SectionSkeletonProps = {
  variant?: "cards" | "media" | "compact" | "article";
};

export function SectionSkeleton({ variant = "cards" }: SectionSkeletonProps) {
  if (variant === "media") {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 border-y border-outline-variant/35 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="skeleton aspect-square rounded-lg" />
        <div className="py-2">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton mt-6 h-10 w-3/4 sm:h-14" />
          <div className="skeleton mt-3 h-10 w-1/2 sm:h-14" />
          <div className="skeleton mt-7 h-4 w-full" />
          <div className="skeleton mt-3 h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="skeleton h-20 rounded-lg" />
      </div>
    );
  }

  if (variant === "article") {
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={`skeleton h-4 ${item === 0 ? "w-10/12" : "w-full"}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="flex-1">
          <div className="skeleton h-3 w-36" />
          <div className="skeleton mt-5 h-9 w-2/3 sm:h-12" />
        </div>
        <div className="skeleton hidden h-11 w-32 rounded-full sm:block" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
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
