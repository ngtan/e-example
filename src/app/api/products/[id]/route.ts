// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { container } from '@/app/providers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // const productService = container.get('productService');
  // // const monitor = container.get('monitor');

  try {
  //   const product = await productService.execute({
  //     key: `product-${params.id}`,
  //     operation: async () => {
  //       // Your actual API call here
  //       const response = await fetch(
  //         `${process.env.API_URL}/products/${params.id}`,
  //         {
  //           next: {
  //             revalidate: 60,
  //             tags: [`product-${params.id}`],
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error('Product API error');
  //       }

  //       return response.json();
  //     },
  //     validationRules: [
  //       {
  //         validate: (data) => !!data.id,
  //         message: 'Invalid product data'
  //       }
  //     ]
  //   });

    // monitor.track('api_product_fetch', {
    //   productId: params.id,
    //   success: true
    // });

    return NextResponse.json(
      { success: true, data: {id: 1, imageUrl: '', name: 'product name', description: 'product description' } },
      { status: 200, }
    );
  } catch (error) {
    // monitor.track('api_product_error', {
    //   productId: params.id,
    //   error: error instanceof Error ? error.message : 'Unknown error'
    // });

    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
