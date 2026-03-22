// app/estudios/loading.tsx
export default function EstudiosLoading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="h-9 w-48 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-12 w-40 bg-gray-200 rounded-lg mt-4 lg:mt-0" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-20 bg-gray-50 border border-gray-200 rounded-lg mb-6" />

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 border border-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Table Skeleton (Desktop) */}
      <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 h-20 bg-white" />
          ))}
        </div>
      </div>

      {/* Cards Skeleton (Mobile) */}
      <div className="lg:hidden space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}