# Next.js & Supabase E-commerce Application: Setup and Deployment Guide

This guide provides comprehensive instructions for setting up the development environment, running the application locally, and deploying it to a production environment.

## 1. Overview

This application consists of:

*   **Frontend:** A Next.js application.
*   **Backend & Database:** Supabase (PostgreSQL database, Auth, Storage, Edge Functions).
*   **Payment Integration:** Stripe and PayPal (conceptual integration provided, requires live keys and further backend implementation for full functionality).

## 2. Prerequisites

Before you begin, ensure you have the following installed:

*   Node.js (v18 or later recommended)
*   npm, yarn, or pnpm (pnpm is used in some examples, adjust as needed)
*   Supabase CLI: `npm install -g supabase`
*   Git

And accounts for:

*   Supabase: [https://supabase.com/](https://supabase.com/)
*   Stripe: [https://stripe.com/](https://stripe.com/) (for payment processing)
*   PayPal Developer: [https://developer.paypal.com/](https://developer.paypal.com/) (for payment processing)
*   A hosting provider for Next.js (e.g., Vercel, Netlify, AWS Amplify, or self-hosting).

## 3. Environment Setup

### 3.1. Clone the Repository (Conceptual)

If this project were in a Git repository, you would start by cloning it:

```bash
# git clone <repository_url>
# cd <project_directory>
```

For now, you have received the code files directly.

### 3.2. Supabase Project Setup

1.  **Create a New Supabase Project:**
    *   Go to [app.supabase.com](https://app.supabase.com/) and create a new project.
    *   Choose a region close to your users.
    *   Note down your Project URL and `anon` key (public API key). You will also need the `service_role` key for admin operations from a secure backend (like Edge Functions or a separate backend server).

2.  **Database Schema:**
    *   Navigate to the SQL Editor in your Supabase project dashboard (Database > SQL Editor).
    *   Open the `database_schema.sql` file provided with this project.
    *   Copy its content and paste it into a new query in the SQL Editor.
    *   Run the query to create all necessary tables, enums, and relationships.
    *   **Important:** Review the schema, especially foreign key constraints and default values.

3.  **Row Level Security (RLS) Policies:**
    *   Open the `rls_policies.md` file. This file contains conceptual SQL for RLS policies.
    *   You need to translate these concepts into actual RLS policies for each table in the Supabase dashboard (Authentication > Policies).
    *   **Enable RLS for each table** before adding policies.
    *   Example for `products` table (allowing public read):
        ```sql
        CREATE POLICY "Allow public read access to products" 
        ON products FOR SELECT 
        USING (true);
        ```
    *   Refer to `rls_policies.md` and Supabase documentation to implement appropriate policies for all tables based on user roles and authentication status.

4.  **User Roles & Authentication:**
    *   The `database_schema.sql` includes a `profiles` table with a `role` column (e.g., `customer`, `admin`).
    *   The `user_roles_and_auth.md` file provides guidance on how user roles are intended to work with Supabase Auth.
    *   You will need to manually set a user to `admin` in the `profiles` table after they sign up to access admin functionalities. This can be done directly in the Supabase table editor or via a server-side function for initial admin setup.
    *   Configure Supabase Auth settings (e.g., email templates, third-party providers if desired) in your Supabase project dashboard (Authentication > Configuration).

### 3.3. Next.js Frontend Setup

1.  **Navigate to the Frontend Directory:**
    The Next.js application code is within the `my-ecommerce-app` directory.

2.  **Install Dependencies:**
    ```bash
    cd my-ecommerce-app
    pnpm install # or npm install / yarn install
    ```

3.  **Environment Variables for Next.js:**
    Create a `.env.local` file in the root of your `my-ecommerce-app` directory (`my-ecommerce-app/.env.local`). Add the following variables:

    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

    # Stripe (Publishable Key for frontend)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY # Use your actual test key

    # PayPal (Client ID for frontend SDK)
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PAYPAL_SANDBOX_CLIENT_ID # Use your actual Sandbox client ID
    ```
    *   Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with the values from your Supabase project settings (Project Settings > API).
    *   Replace with your actual test keys from Stripe and PayPal developer dashboards.

### 3.4. Supabase Edge Functions Setup

The conceptual code for Edge Functions (`stripe-payment` and `paypal-payment`) is provided in the `my-ecommerce-app/supabase/functions/` directory.

1.  **Link Supabase Project (if using CLI locally for functions):**
    ```bash
    cd my-ecommerce-app # (or the root where your supabase folder is)
    supabase login
    supabase link --project-ref YOUR_PROJECT_REF
    ```
    Replace `YOUR_PROJECT_REF` with your Supabase project ID.

2.  **Environment Variables for Edge Functions:**
    Set these secrets in your Supabase project dashboard (Project Settings > Edge Functions > Add new secret):

    *   **For Stripe:**
        *   `STRIPE_SECRET_KEY`: Your Stripe Secret Key (e.g., `sk_test_YOUR_STRIPE_SECRET_KEY`).
        *   `STRIPE_WEBHOOK_SECRET`: Your Stripe Webhook Signing Secret (e.g., `whsec_...`).
    *   **For PayPal:**
        *   `PAYPAL_CLIENT_ID`: Your PayPal App Client ID.
        *   `PAYPAL_CLIENT_SECRET`: Your PayPal App Client Secret.
        *   `PAYPAL_WEBHOOK_ID`: Your PayPal Webhook ID (from PayPal Developer Dashboard after creating a webhook).
        *   `PAYPAL_MODE`: `sandbox` or `live`.
    *   **For Supabase Admin Access (if functions modify DB):**
        *   `SUPABASE_URL`: Your project URL.
        *   `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key.

3.  **Review and Implement Edge Functions:**
    *   The provided files (`.../stripe-payment/index.ts_conceptual` and `.../paypal-payment/index.ts_conceptual`) contain **conceptual outlines**. You need to:
        *   Rename them to `index.ts`.
        *   Install necessary Deno dependencies within each function's directory (e.g., `cd supabase/functions/stripe-payment && pnpm add stripe` - adjust for Deno/ESM imports).
        *   Uncomment and adapt the Deno/TypeScript code, ensuring it aligns with the latest SDKs and your specific logic.
        *   Pay close attention to comments regarding Supabase client initialization, error handling, and security.

4.  **Deploy Edge Functions:**
    Once implemented, deploy them using the Supabase CLI:
    ```bash
    supabase functions deploy stripe-payment --project-ref YOUR_PROJECT_REF --no-verify-jwt
    supabase functions deploy paypal-payment --project-ref YOUR_PROJECT_REF --no-verify-jwt
    ```
    *   `--no-verify-jwt` is used if the function is called by external services like webhooks or if you handle auth differently. For client-invoked functions needing auth, configure JWT verification.

## 4. Running Locally

1.  **Start Supabase Local Development (Optional but Recommended for Full Local Workflow):**
    If you want to run Supabase services locally (requires Docker):
    ```bash
    supabase init # Run once in your project root
    supabase start
    ```
    This will provide local Supabase URLs and keys. Update your `.env.local` and Edge Function environment accordingly if testing against local Supabase.

2.  **Start Next.js Development Server:**
    From the `my-ecommerce-app` directory:
    ```bash
    pnpm dev # or npm run dev / yarn dev
    ```
    The application should be accessible at `http://localhost:3000` (or another port if 3000 is busy).

3.  **Test Edge Functions Locally (if Supabase local dev is running):**
    ```bash
    supabase functions serve stripe-payment --project-ref YOUR_PROJECT_REF --no-verify-jwt
    ```
    You can then use tools like Stripe CLI or ngrok to forward webhooks to your local function endpoints.

## 5. Building for Production (Next.js)

From the `my-ecommerce-app` directory:

```bash
pnpm build # or npm run build / yarn build
```
This command creates an optimized production build of your Next.js application in the `.next` folder.

## 6. Deployment

### 6.1. Deploying Supabase Backend

*   Your Supabase project hosted on [supabase.com](https://supabase.com/) is already your production backend.
*   Ensure all database schema changes, RLS policies, and Edge Functions are deployed and configured in your live Supabase project.
*   **Switch API Keys for Payment Gateways:** In your Stripe and PayPal developer dashboards, switch from Sandbox/Test mode to Live mode. Update the corresponding environment variables/secrets in your Supabase Edge Functions (`STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE="live"`, etc.) and obtain live Webhook Secrets/IDs.

### 6.2. Deploying Next.js Frontend

Popular choices for deploying Next.js applications include Vercel (by the creators of Next.js), Netlify, AWS Amplify, or deploying to your own server/container platform.

**Using Vercel (Recommended for Ease of Use):**

1.  Push your `my-ecommerce-app` code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Sign up or log in to [Vercel](https://vercel.com/).
3.  Import your Git repository.
4.  Vercel typically auto-detects Next.js settings.
5.  **Configure Environment Variables in Vercel:**
    *   Go to your Vercel project settings > Environment Variables.
    *   Add the same variables as in your `.env.local` file, but use your **production/live** Supabase URL/anon key and **live** Stripe Publishable Key & PayPal Client ID.
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_LIVE_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_LIVE_SUPABASE_ANON_KEY
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_PAYPAL_LIVE_CLIENT_ID
    ```
6.  Deploy. Vercel will build and deploy your application.

**General Deployment Considerations:**

*   **Environment Variables:** Ensure all necessary environment variables are correctly set in your hosting provider's settings for the production environment.
*   **Custom Domain:** Configure your custom domain through your hosting provider.
*   **HTTPS:** Ensure HTTPS is enabled (usually handled automatically by platforms like Vercel/Netlify).
*   **API Routes/Edge Functions (Next.js):** If you have any API routes within Next.js (e.g., `/api/*`) that are intended to be serverless functions, your hosting provider should handle their deployment.

### 6.3. Configuring Payment Gateway Webhooks for Production

*   **Stripe:** In your Stripe Dashboard (Live mode), update your webhook endpoint URL to point to your deployed `stripe-webhook-handler` Supabase Edge Function (e.g., `https://<your-supabase-project-ref>.supabase.co/functions/v1/stripe-payment/webhook`). Use the live webhook signing secret.
*   **PayPal:** In your PayPal Developer Dashboard (Live mode), update your webhook endpoint URL to point to your deployed `paypal-webhook-handler` Supabase Edge Function. Use the live Webhook ID.

## 7. Post-Deployment Checklist & Maintenance

*   **Thorough Testing:** Test all functionalities in the production environment, especially user registration, login, product browsing, cart, checkout (with live but small test payments if possible, then refund), and admin panel operations.
*   **Monitoring:** Set up monitoring and logging for your Next.js application and Supabase backend (Supabase provides logs for Edge Functions and database queries).
*   **Database Backups:** Supabase handles automated backups, but understand the backup policy and consider your own backup strategy for critical data if needed.
*   **Security Updates:** Keep dependencies (Node.js, Next.js, Supabase CLI, Stripe/PayPal SDKs) updated.
*   **Supabase Quotas:** Monitor your Supabase project usage against the free/paid tier limits.

This guide provides a comprehensive path to setting up, running, and deploying your e-commerce application. Remember that the payment gateway Edge Functions are conceptual and require careful implementation and testing before going live with real transactions.

