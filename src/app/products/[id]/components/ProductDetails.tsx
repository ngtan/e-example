// src/app/products/[id]/components/ProductDetails.tsx
// Now a Server Component
import { AddToCartButton } from './AddToCartButton';
import { ProductImage } from './ProductImage';
// import { ProductPrice } from './ProductPrice';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  // Add other product fields
}

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
        />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            {/* <ProductPrice price={product.price} /> */}
          </div>

          <div className="prose prose-gray max-w-none">
            <p>{product.description}</p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
