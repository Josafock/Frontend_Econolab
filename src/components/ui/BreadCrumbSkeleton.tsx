const BreadcrumbSkeleton = () => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-4 w-12 rounded bg-gray-200 animate-pulse" />
      <span className="text-gray-300">›</span>
      <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
    </div>
  );
};

export default BreadcrumbSkeleton;
