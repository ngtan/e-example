// src/app/products/[id]/components/ProductImage.tsx
// Server Component
import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
}

export function ProductImage({ src, alt }: ProductImageProps) {
  return (
    <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
      {/* <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
      /> */}
    </div>
  );
}
