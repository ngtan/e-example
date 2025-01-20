// src/app/products/[id]/page.tsx
import { Suspense } from 'react';
// import { getProduct } from '@/lib/api/products';
import { ProductDetails } from './components/ProductDetails';
import { ProductSkeleton } from './components/ProductSkeleton';
// import { container } from '@/app/providers';
import { getContainer } from '@/app/container';

export async function generateMetadata({ params }: { params: { id: string } }) {
  // const product = await getProduct(params.id);
  const product = {
    name: 'hello name',
    description: 'hello description',
  };
  
  return {
    title: `${product.name} | E-Commerce Store`,
    description: product.description,
  };
}

export default async function ProductPage({
  params
}: {
  params: { id: string }
}) {
  // const monitor = container.resolve('monitor');
  // const product = await getProduct(params.id);

  // // Server-side tracking
  // monitor.track('product_view', {
  //   productId: params.id,
  //   timestamp: Date.now()
  // });

  // return (
  //   <main className="min-h-screen py-8">
  //     <Suspense fallback={<ProductSkeleton />}>
  //       <ProductDetails product={product} />
  //     </Suspense>
  //   </main>
  // );

  // Get services from container
  // const monitor = container.get('monitor');
  // console.log({ monitor });
  // const productService = container.get('productService');
  
  try {
    // const product = await getProduct(params.id);

    const container = getContainer();
    // const monitor = container.get('monitor');
    const productService = container.get('productService');
    // console.log({ container, monitor, productService });

    const product = await productService.getProduct(1);

    console.log({ product, productService: productService });

    // const product = {
    //   name: 'hello name',
    //   description: 'hello description',
    // };

    // Server-side tracking
    // monitor.track('product_view', {
    //   productId: params.id,
    //   timestamp: Date.now(),
    //   success: true
    // });

    return (
      <main className="min-h-screen py-8">
        <Suspense fallback={<ProductSkeleton />}>
          <ProductDetails product={product.data} />
        </Suspense>
      </main>
    );
  } catch (error) {
    // monitor.track('product_view_error', {
    //   productId: params.id,
    //   error: error instanceof Error ? error.message : 'Unknown error',
    //   timestamp: Date.now()
    // });
    throw error; // This will be caught by the error boundary
  }
}
