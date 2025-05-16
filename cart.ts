// /types/cart.ts
import { Product } from "./product";

export interface CartItem {
  id: string; // Could be product_id if items are unique by product in cart, or a separate UUID
  product_id: string; // UUID of the product
  quantity: number;
  added_at: string; // TIMESTAMPTZ
  // Optional: populated product details for display in cart
  product?: Product | null;
  // price_at_addition?: number; // If prices can change and you want to lock it at time of adding to cart
}

export interface Cart {
  id?: string; // UUID, if using server-side persistent carts
  user_id?: string | null; // UUID, if linked to a user
  items: CartItem[];
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
  // Calculated fields, typically not stored in DB but useful in context
  total_items?: number;
  subtotal?: number;
}

