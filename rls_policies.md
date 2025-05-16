# Supabase Row Level Security (RLS) Policies

This document outlines the Row Level Security (RLS) policies for the e-commerce application using Supabase. RLS is crucial for ensuring that users can only access and modify data they are permitted to, based on their authentication status and role.

**Prerequisites:**

1.  All tables mentioned below must have RLS enabled in the Supabase dashboard. This can be done via SQL: `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`
2.  The `public.profiles` table should have a `role` column (e.g., 'customer', 'admin') and be linked to `auth.users(id)`.
3.  A helper function `auth.uid()` returns the ID of the currently authenticated user.
4.  A helper function `get_user_role()` can be created to fetch the role of the current user (though often it's easier to join with `profiles` table in the policy itself or use `auth.jwt() ->> 'user_metadata' ->> 'role'` if roles are stored in JWT metadata, or query the profiles table directly using `auth.uid()`). For simplicity in policy definitions, we will assume a way to check the role, often by checking `(SELECT role FROM public.profiles WHERE id = auth.uid())`.

## 1. `categories` Table

*   **Public Read Access:** Anyone should be able to view categories.
*   **Admin Write Access:** Only users with the 'admin' role should be able to create, update, or delete categories.

```sql
-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to categories" ON public.categories
  FOR SELECT USING (true);

-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access to categories" ON public.categories
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 2. `products` Table

*   **Public Read Access:** Anyone should be able to view products.
*   **Admin Write Access:** Only 'admin' users can create, update, or delete products.

```sql
-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to products" ON public.products
  FOR SELECT USING (true);

-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access to products" ON public.products
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 3. `product_images` Table

*   **Public Read Access:** Anyone should be able to view product images.
*   **Admin Write Access:** Only 'admin' users can add, update, or delete product images (linked to products they can manage).

```sql
-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to product_images" ON public.product_images
  FOR SELECT USING (true);

-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access to product_images" ON public.product_images
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 4. `profiles` Table

*   **User Own Data Access:** Users can view and update their own profile.
*   **Admin Read Access:** Admins can view all profiles.
*   **Admin Write Access (Limited):** Admins might be able to update certain fields like 'role' but generally shouldn't modify all user data directly without cause. The `handle_new_user` trigger handles profile creation.

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view and update their own profile
CREATE POLICY "Allow users to manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Allow admins to view all profiles" ON public.profiles
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- (Optional) Allow admins to update user roles (be cautious with this)
CREATE POLICY "Allow admins to update user roles" ON public.profiles
  FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 5. `addresses` Table

*   **User Own Data Access:** Users can manage (create, read, update, delete) their own addresses.
*   **Admin Read Access (Limited):** Admins might need to view addresses in the context of an order, but not browse all addresses freely. This can be handled by joining with orders they can access.

```sql
-- Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own addresses
CREATE POLICY "Allow users to manage their own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (Optional) Allow admins to view addresses linked to orders they can manage (complex policy, often handled at query time)
-- For simplicity, admins might be granted select access if necessary for order fulfillment.
CREATE POLICY "Allow admins to view addresses for order management" ON public.addresses
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 6. `orders` Table

*   **User Own Data Access:** Users can view their own orders.
*   **User Create Access:** Authenticated users can create orders for themselves.
*   **Admin Full Access:** Admins can view all orders and update order statuses.

```sql
-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own orders
CREATE POLICY "Allow users to view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to create orders for themselves
CREATE POLICY "Allow users to create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all orders (view, update status)
CREATE POLICY "Allow admins to manage all orders" ON public.orders
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 7. `order_items` Table

*   **User Own Data Access:** Users can view items belonging to their own orders.
*   **User Create Access:** When an order is created, associated items are created. This is implicitly handled by the order creation policy if items are inserted in the same transaction or by a trusted function.
*   **Admin Full Access:** Admins can view all order items.

```sql
-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow users to view items of their own orders
CREATE POLICY "Allow users to view their own order_items" ON public.order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Allow users to insert order items for their own new orders (typically done via a function or backend logic)
-- This policy assumes insertion happens in a context where order_id is for the current user.
CREATE POLICY "Allow users to insert items for their own orders" ON public.order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Allow admins to manage all order_items
CREATE POLICY "Allow admins to manage all order_items" ON public.order_items
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

## 8. `shopping_carts` Table

*   **User Own Data Access:** Users can manage their own shopping cart.

```sql
-- Enable RLS
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own shopping cart
CREATE POLICY "Allow users to manage their own shopping_cart" ON public.shopping_carts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 9. `shopping_cart_items` Table

*   **User Own Data Access:** Users can manage items in their own shopping cart.

```sql
-- Enable RLS
ALTER TABLE public.shopping_cart_items ENABLE ROW LEVEL SECURITY;

-- Allow users to manage items in their own shopping cart
CREATE POLICY "Allow users to manage items in their own shopping_cart" ON public.shopping_cart_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.shopping_carts
    WHERE shopping_carts.id = shopping_cart_items.cart_id AND shopping_carts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_carts
    WHERE shopping_carts.id = shopping_cart_items.cart_id AND shopping_carts.user_id = auth.uid()
  ));
```

## Supabase Storage RLS

RLS policies should also be applied to Supabase Storage buckets.

*   **Product Images Bucket (`product_images`):**
    *   Public read access for all images.
    *   Admin write access (upload, delete, update) for users with the 'admin' role.
*   **User Avatars Bucket (`avatars`):**
    *   Public read access (if avatars are public).
    *   Authenticated users can upload/update their own avatar.
    *   Admins might have broader access if needed.

Example policies for a `product_images` bucket (configured in Supabase Dashboard -> Storage -> Policies):

**Policy: Allow public read access to product images**
*   Allowed operation: `SELECT`
*   Target roles: `anon`, `authenticated`
*   USING expression: `TRUE`

**Policy: Allow admins to upload product images**
*   Allowed operation: `INSERT`
*   Target roles: `authenticated`
*   USING expression: `(bucket_id = 'product_images') AND ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`
*   WITH CHECK expression: `(bucket_id = 'product_images') AND ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`

**Policy: Allow admins to delete/update product images**
*   Allowed operations: `UPDATE`, `DELETE`
*   Target roles: `authenticated`
*   USING expression: `(bucket_id = 'product_images') AND ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`

Similar policies would be defined for the `avatars` bucket, ensuring users can only manage their own avatar file (e.g., by checking if the file path contains `auth.uid()`).

## Important Notes:

*   **Test Thoroughly:** RLS policies are critical for security. Test them extensively with different user roles and scenarios.
*   **Security Definer Functions:** For complex operations or when RLS makes direct queries too cumbersome, consider using `SECURITY DEFINER` functions in PostgreSQL. These functions execute with the privileges of the user who defined the function, bypassing RLS for the operations within the function. Use them judiciously and ensure they are secure.
*   **Default Deny:** If no policy allows an operation, it is denied by default once RLS is enabled on a table.
*   **Supabase Dashboard:** RLS policies can be created and managed directly in the Supabase SQL editor or through the Authentication -> Policies section for each table in the Supabase dashboard.

This RLS setup provides a strong foundation for securing the e-commerce application's data.
