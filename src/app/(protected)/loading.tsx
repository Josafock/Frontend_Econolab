import { CollectionContentSkeleton } from "@/components/ui/PageSkeletons";

export default function ProtectedLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-10 w-72 max-w-full rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
      </div>

      <CollectionContentSkeleton statCards={4} rows={5} />
    </div>
  );
}
