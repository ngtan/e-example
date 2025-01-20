// src/app/products/[id]/components/ProductPrice.tsx
// Server Component
export function ProductPrice({ price }: { price: number }) {
  return (
    <p className="mt-2 text-xl font-semibold text-blue-600">
      ${price.toFixed(2)}
    </p>
  );
}
