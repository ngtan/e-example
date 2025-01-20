// src/lib/config/default.ts
export const defaultConfig: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 5000,
  },
  features: {
    enableCart: true,
    enableWishlist: true,
  },
  pages: {
    product: {
      layout: {
        maxWidth: '7xl',
        padding: '8',
      },
      components: [
        {
          id: 'product-gallery',
          type: 'ProductGallery',
          props: {
            aspectRatio: 1,
          },
        },
        {
          id: 'product-info',
          type: 'ProductInfo',
          props: {
            showPrice: true,
            showStock: true,
          },
        },
        // ... more component configs
      ],
    },
    // ... more page configs
  },
};
