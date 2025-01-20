// src/app/products/[id]/components/ProductSkeleton.tsx
export function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
          <div className="pt-6 border-t border-gray-200">
            <div className="h-12 bg-gray-200 rounded-lg w-full md:w-1/3 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
