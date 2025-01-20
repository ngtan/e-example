// src/lib/config/types.ts
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableCart: boolean;
    enableWishlist: boolean;
  };
  pages: {
    product: ProductPageConfig;
    cart: CartPageConfig;
  };
}

export interface ProductPageConfig {
  layout: {
    maxWidth: string;
    padding: string;
  };
  components: ComponentConfig[];
}

export interface ComponentConfig {
  id: string;
  type: string;
  props: Record<string, any>;
}
