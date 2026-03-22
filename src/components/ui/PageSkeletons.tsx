"use client";

type CollectionContentSkeletonProps = {
  statCards?: number;
  rows?: number;
};

type DetailPageSkeletonProps = {
  sections?: number;
};

export function CollectionContentSkeleton({
  statCards = 4,
  rows = 5,
}: CollectionContentSkeletonProps) {
  const statGridClass =
    statCards >= 5
      ? "grid gap-4 md:grid-cols-2 xl:grid-cols-5"
      : statCards === 4
        ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        : "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="space-y-6">
      <div className={statGridClass}>
        {Array.from({ length: statCards }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="animate-pulse">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="mt-4 h-8 w-24 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm xl:block">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-4 rounded bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 px-6 py-5">
              {Array.from({ length: 5 }).map((__, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`animate-pulse rounded ${
                    cellIndex === 0 ? "h-5 w-20 bg-gray-200" : "h-4 bg-gray-100"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 xl:hidden">
        {Array.from({ length: Math.min(rows, 3) }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="animate-pulse space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-6 w-20 rounded-full bg-gray-200" />
              </div>
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 rounded-2xl bg-gray-100" />
                <div className="h-16 rounded-2xl bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton({ sections = 3 }: DetailPageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-9 w-72 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {Array.from({ length: sections }).map((_, index) => (
          <div
            key={index}
            className={`rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-6 ${
              index === 0 ? "" : index === 1 ? "" : "lg:col-span-2"
            }`}
          >
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-44 rounded bg-gray-200" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
