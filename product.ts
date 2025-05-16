// /types/product.ts
export interface Category {
  id: string; // UUID
  name: string;
  description?: string | null;
  parent_category_id?: string | null; // UUID
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface ProductImage {
  id: string; // UUID
  product_id: string; // UUID
  image_url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  created_at: string; // TIMESTAMPTZ
}

export interface Product {
  id: string; // UUID
  name: string;
  description?: string | null;
  price: number; // DECIMAL(10, 2)
  sku?: string | null;
  stock_quantity: number;
  category_id?: string | null; // UUID
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  // Optional: populated from related tables
  category?: Category | null;
  images?: ProductImage[] | null;
}

