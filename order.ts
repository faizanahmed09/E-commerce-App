// /types/order.ts
import { Address } from "./user";
import { Product } from "./product";

export type OrderStatus = 
  | "pending_payment"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: string; // UUID
  order_id: string; // UUID
  product_id: string; // UUID
  quantity: number;
  price_at_purchase: number; // DECIMAL(10, 2)
  created_at: string; // TIMESTAMPTZ
  // Optional: populated product details
  product?: Product | null;
}

export interface Order {
  id: string; // UUID
  user_id: string; // UUID
  total_amount: number; // DECIMAL(10, 2)
  status: OrderStatus;
  shipping_address_id?: string | null; // UUID
  billing_address_id?: string | null; // UUID
  payment_gateway?: string | null;
  payment_intent_id?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  // Optional: populated from related tables
  order_items?: OrderItem[] | null;
  shipping_address?: Address | null;
  billing_address?: Address | null;
}

