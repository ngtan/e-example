// src/lib/api/products.ts
import { container } from '@/app/providers';

export async function getProduct(id: string) {
  const productService = container.get('productService');
  
  return productService.execute({
    key: `product-${id}`,
    operation: async () => {
      const response = await productService.http.get(`/products/${id}`, {
        next: {
          revalidate: 60, // Cache for 60 seconds
          tags: [`product-${id}`],
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      return response.data;
    },
    validationRules: [
      {
        validate: (data) => !!data.id,
        message: 'Invalid product data'
      }
    ]
  });
}
