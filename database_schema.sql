-- Supabase PostgreSQL Schema for E-commerce Application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories Table
-- Stores product categories and subcategories.
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- For subcategories
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for categories updated_at
CREATE TRIGGER handle_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 2. Products Table
-- Stores product information.
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    sku TEXT UNIQUE, -- Stock Keeping Unit
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for faster lookups by name and category
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Trigger for products updated_at
CREATE TRIGGER handle_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 3. Product Images Table
-- Stores multiple images for each product, linked to Supabase Storage.
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- URL from Supabase Storage
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for faster lookups by product_id
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- 4. User Profiles Table
-- Extends Supabase auth.users table to store additional user information and roles.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth.users table
    full_name TEXT,
    avatar_url TEXT, -- URL from Supabase Storage
    role TEXT DEFAULT 'customer' NOT NULL CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'customer'); -- Default role is 'customer'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user creation in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Addresses Table
-- Stores shipping and billing addresses for users.
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state_province_region TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    address_type TEXT CHECK (address_type IN ('shipping', 'billing')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for faster lookups by user_id
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- Trigger for addresses updated_at
CREATE TRIGGER handle_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 6. Orders Table
-- Stores order information.
CREATE TYPE public.order_status AS ENUM (
    'pending_payment',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status public.order_status DEFAULT 'pending_payment' NOT NULL,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    billing_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL, -- Optional, can be same as shipping
    payment_gateway TEXT, -- e.g., 'stripe', 'paypal'
    payment_intent_id TEXT UNIQUE, -- For Stripe or similar gateway transaction ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for faster lookups by user_id and status
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Trigger for orders updated_at
CREATE TRIGGER handle_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 7. Order Items Table
-- Stores individual items within an order (junction table for products and orders).
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT, -- Prevent product deletion if in an order
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase >= 0), -- Price of the product at the time of order
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for faster lookups by order_id and product_id
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- 8. Shopping Cart Table (Optional: for persistent carts for logged-in users)
-- If using client-side cart primarily, this might be simpler or not needed.
-- This example assumes a server-side persistent cart for logged-in users.
CREATE TABLE public.shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Each user has one cart
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger for shopping_carts updated_at
CREATE TRIGGER handle_shopping_carts_updated_at BEFORE UPDATE ON public.shopping_carts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 9. Shopping Cart Items Table
CREATE TABLE public.shopping_cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (cart_id, product_id) -- Ensure a product appears only once per cart, update quantity instead
);

-- Index for faster lookups by cart_id
CREATE INDEX idx_shopping_cart_items_cart_id ON public.shopping_cart_items(cart_id);

-- Initial Data (Optional examples)
-- Example Category
-- INSERT INTO public.categories (name, description) VALUES ('Electronics', 'Gadgets and devices');

-- Example Product
-- INSERT INTO public.products (name, description, price, sku, stock_quantity, category_id)
-- VALUES ('Awesome Laptop', 'A very powerful and sleek laptop.', 1200.00, 'LPTP-001', 50, (SELECT id from categories WHERE name = 'Electronics'));

-- Note on RLS (Row Level Security):
-- RLS policies should be defined for each table to control data access.
-- For example, users should only be able to see their own orders, profiles, and cart items.
-- Admins would have broader access.
-- These will be detailed in a separate rls_policies.md file.

-- Make sure to enable RLS for tables in Supabase dashboard after creating them.
-- Example: ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- End of Schema

