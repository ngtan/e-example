// src/app/products/[id]/components/AddToCartButton.tsx
'use client';

import React from 'react';
import { useService } from '@/app/providers';

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const productService = useService('productService');
  // const monitor = useService('monitor');

  const handleAddToCart = async () => {
    console.log(123123123, productService);
    setLoading(true);
    try {

      await productService.getProduct('1');

      // await productService.execute({
      //   key: `add-to-cart-${productId}`,
      //   operation: async () => {
      //     const response = await fetch('/api/cart', {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //       body: JSON.stringify({
      //         productId,
      //         quantity: 1,
      //       }),
      //     });

      //     if (!response.ok) {
      //       throw new Error('Failed to add to cart');
      //     }

      //     return response.json();
      //   }
      // });

      // monitor.track('add_to_cart_success', {
      //   productId
      // });
    } catch (error) {
      // monitor.track('add_to_cart_error', {
      //   productId,
      //   error: error instanceof Error ? error.message : 'Unknown error'
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Adding...
        </span>
      ) : (
        'Add to Cart'
      )}
    </button>
  );
}
