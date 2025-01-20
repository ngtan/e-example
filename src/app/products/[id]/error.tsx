// src/app/products/[id]/error.tsx
'use client';

import { useEffect } from 'react';
import { useService } from '@/app/providers';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const monitor = useService('monitor');

  useEffect(() => {
    // monitor.track('product_page_error', {
    //   error: error.message,
    //   digest: error.digest
    // });
  }, [error, monitor]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-red-700 text-lg font-semibold mb-2">
            Something went wrong!
          </h2>
          <p className="text-red-600 mb-4">
            {error.message}
          </p>
          <button
            onClick={reset}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
