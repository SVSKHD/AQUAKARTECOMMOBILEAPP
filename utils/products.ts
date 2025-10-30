export type ProductImageVariant = {
  secure_url?: string;
  url?: string;
  image_url?: string;
  [key: string]: unknown;
};

export type Product = {
  id?: string | number;
  productId?: string | number;
  product_id?: string | number;
  sku?: string;
  name?: string;
  productName?: string;
  title?: string;
  price?: number;
  sellingPrice?: number;
  mrp?: number;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  description?: string;
  shortDescription?: string;
  photos?: Array<ProductImageVariant | null | undefined>;
  [key: string]: unknown;
};

export const getProductKey = (
  product: Product,
  fallback?: number | string
): string => {
  return String(
    product.id ??
      product.productId ??
      product.product_id ??
      product.sku ??
      fallback ??
      `product-${Date.now()}`
  );
};

export const getProductTitle = (product: Product, index = 0): string => {
  return (
    product.name ??
    product.productName ??
    product.title ??
    `Product ${index + 1}`
  );
};

export const getProductPrice = (product: Product): number | null => {
  if (typeof product.price === 'number') return product.price;
  if (typeof product.sellingPrice === 'number') return product.sellingPrice;
  if (typeof product.mrp === 'number') return product.mrp;
  return null;
};

export const getProductDescription = (product: Product): string => {
  return (
    (typeof product.description === 'string' && product.description.trim()) ||
    (typeof product.shortDescription === 'string' &&
      product.shortDescription.trim()) ||
    'No description provided.'
  );
};

export const getPrimaryProductImage = (product: Product): string | null => {
  return product.imageUrl ?? product.image ?? product.thumbnail ?? null;
};

export const getProductImages = (product: Product): string[] => {
  const urls: string[] = [];

  if (Array.isArray(product.photos)) {
    for (const entry of product.photos) {
      if (!entry) continue;
      const candidate =
        entry.secure_url ??
        entry.url ??
        (entry as { image_url?: string }).image_url;
      if (candidate) {
        urls.push(candidate);
      }
    }
  }

  const fallback = getPrimaryProductImage(product);
  if (urls.length === 0 && fallback) {
    urls.push(fallback);
  }

  return urls;
};
