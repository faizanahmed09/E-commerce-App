# User Roles and Supabase Authentication Integration

This document details the user roles within the e-commerce application and how they integrate with Supabase Authentication and the `profiles` table.

## 1. User Roles

The application will primarily define two user roles:

*   **Customer:** This is the default role for any new user who registers on the platform. Customers can browse products, manage their profiles, place orders, view their order history, and manage their shopping cart.
*   **Admin:** Users with this role have elevated privileges. Admins can manage products, categories, orders (including updating statuses), and potentially view all users. They have access to the admin dashboard.

## 2. Supabase Authentication Integration

Supabase Auth is used for all core authentication functionalities:

*   **User Registration:** New users sign up using email/password or social providers (if configured). Upon successful registration with `auth.users` table, a trigger (`on_auth_user_created` calling `handle_new_user` function, as defined in `database_schema.sql`) automatically creates a corresponding entry in the `public.profiles` table.
*   **Profile Creation:** The `handle_new_user` function in PostgreSQL (see `database_schema.sql`) is responsible for:
    *   Taking the `id` from the newly created `auth.users` record.
    *   Inserting a new row into `public.profiles` with this `id`.
    *   Assigning the default role of `'customer'` to the new profile.
    *   Optionally, populating other default profile fields if necessary.
*   **Login:** Users log in using their credentials. Supabase Auth handles session management and provides JWTs.
*   **Session Management:** The Supabase client library (`supabase-js`) manages user sessions on the frontend. The user's authentication state and JWT can be used to make authenticated requests and determine UI elements to display.
*   **Role Management:**
    *   The `role` for each user is stored in the `public.profiles` table (linked one-to-one with `auth.users`).
    *   Role assignment for new users is `'customer'` by default.
    *   Changing a user's role (e.g., promoting a customer to an admin) must be done by an existing admin. This would involve updating the `role` field in the `public.profiles` table for the target user. This operation itself is protected by RLS policies, ensuring only admins can modify roles (as outlined in `rls_policies.md`).

## 3. Accessing User Role in the Application

Once a user is logged in, their role needs to be accessible to the Next.js application to control UI elements and access to certain functionalities (e.g., admin dashboard).

There are several ways to achieve this:

1.  **Fetching from `profiles` Table:** After login, or when the user session is loaded, the application can make a query to the `public.profiles` table using the `auth.uid()` to fetch the user's profile, including their role.
    ```javascript
    // Example in Next.js using supabase-js
    import { supabase } from "@/lib/supabaseClient"; // Your Supabase client instance

    async function getUserProfile(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    }
    ```
2.  **Custom JWT Claims (Advanced):** Supabase allows adding custom claims to JWTs. The user's role could be embedded directly into the JWT. This can reduce the need for an extra database query to get the role on every session load. This is typically set up using PostgreSQL functions that modify the JWT during login or token refresh. This is a more advanced setup and requires careful consideration of JWT size and security.
    *   For this project, we will primarily rely on fetching the role from the `profiles` table as it's simpler to implement and manage initially.

## 4. Enforcing Role-Based Access Control (RBAC)

RBAC is enforced at two main levels:

1.  **Database Level (RLS):** As detailed in `rls_policies.md`, Row Level Security policies on Supabase tables use the `role` from the `profiles` table (queried via `auth.uid()`) to grant or deny access to data.
2.  **Application Level (Frontend/Backend API):**
    *   **Frontend:** The Next.js application will conditionally render UI components or redirect users based on their role. For example, the link to the admin dashboard will only be visible if the user's role is `'admin'`. Protected routes (e.g., `/admin/*`) will check the user's role before rendering.
    *   **API Routes/Edge Functions (if used):** If custom Next.js API routes or Supabase Edge Functions are created, they must also validate the user's role before performing sensitive operations.

By combining Supabase Auth, the `profiles` table for role storage, RLS policies, and application-level checks, we can implement a robust system for user authentication and authorization.
