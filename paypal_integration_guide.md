# PayPal Payment Gateway Integration Guide for Next.js & Supabase E-commerce App

This document provides a comprehensive guide on integrating PayPal into your Next.js frontend and Supabase backend for secure payment processing.

## 1. Overview

PayPal is a widely used payment platform. Integrating PayPal typically involves:

1.  **Frontend (Next.js):** Using the PayPal JavaScript SDK to render PayPal buttons (Smart Payment Buttons). When a user clicks a button, the SDK handles the payment flow, often opening a PayPal pop-up or redirecting to the PayPal site.
2.  **Backend (Supabase Edge Function - Optional but Recommended for Server-Side Operations):**
    *   **Order Creation:** Your server can create an order with PayPal, specifying the amount and currency. PayPal returns an Order ID.
    *   **Payment Capture:** After the user approves the payment on the frontend, your server can capture the payment for the given PayPal Order ID.
3.  **Frontend:** The PayPal SDK on the client-side calls your backend endpoints to create and capture the order, or can handle some of these steps directly (client-side integration).
4.  **Backend (Webhooks):** Handling PayPal webhooks to listen for payment events (e.g., `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`) and update order status, manage inventory, etc., in your Supabase database.

There are two main integration approaches with the PayPal JS SDK:
*   **Client-Side Integration:** The frontend handles most of the interaction with PayPal (creating orders, capturing payments). Simpler to set up but might be less flexible for complex server-side logic immediately tied to payment steps.
*   **Server-Side Integration:** The frontend triggers backend endpoints to create orders and capture payments with PayPal. This offers more control and is generally recommended for robust e-commerce applications, especially for order validation and inventory management before payment capture.

This guide will focus on a **Server-Side Integration** approach using Supabase Edge Functions.

## 2. Prerequisites

*   A PayPal Business account: Sign up at [https://www.paypal.com/](https://www.paypal.com/)
*   PayPal Developer Dashboard access: Create an app in the PayPal Developer Dashboard to get your Client ID and Secret. You will use Sandbox credentials for testing and Live credentials for production.
*   Supabase project with Edge Functions enabled.
*   Next.js application setup.

## 3. Setup

### 3.1. Environment Variables

Store your PayPal API credentials securely.

For local development with Next.js (Client ID is public, Secret is not used client-side):

```env
# .env.local (Frontend - Next.js)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID
```

For your Supabase Edge Function (both Client ID and Secret are needed):

```
# Supabase Dashboard -> Project Settings -> Edge Functions -> Add new secret
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_CLIENT_SECRET
PAYPAL_WEBHOOK_ID=YOUR_SANDBOX_WEBHOOK_ID 
// (Get this after creating a webhook in PayPal Developer Dashboard)
```

**Important:** Never expose your PayPal Client Secret on the client-side.

### 3.2. Install PayPal SDK (Frontend)

The PayPal JS SDK is typically loaded via a script tag. `@paypal/react-paypal-js` provides a React wrapper for easier integration.

```bash
npm install @paypal/react-paypal-js
# or
yarn add @paypal/react-paypal-js
# or
pnpm add @paypal/react-paypal-js
```

For the backend (Supabase Edge Function), you might make direct HTTP requests to the PayPal API or use a Node.js SDK if available and compatible with Deno (or use `fetch`). PayPal provides official Node.js SDK (`@paypal/checkout-server-sdk`), but direct `fetch` calls are also common in Deno environments.

## 4. Frontend Integration (Next.js)

### 4.1. PayPalScriptProvider

Wrap your application or checkout component with `PayPalScriptProvider` from `@paypal/react-paypal-js`.

```tsx
// Example: /app/(checkout)/payment/page.tsx or a specific payment component

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import PayPalCheckoutButton from "@/components/payment/PayPalCheckoutButton"; // We will create this

const PaymentPageWithPayPal = () => {
  const initialOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD", // Or your desired currency
    intent: "capture", // Or "authorize"
    // "data-sdk-integration-source": "integrationbuilder_sc", // Optional tracking
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalCheckoutButton />
    </PayPalScriptProvider>
  );
};

export default PaymentPageWithPayPal;
```

### 4.2. Create PayPal Checkout Button (`PayPalCheckoutButton.tsx`)

This component will use `PayPalButtons` from `@paypal/react-paypal-js` to render the PayPal payment buttons.

*(Conceptual code for this component will be provided in `/components/payment/PayPalCheckoutButton.tsx`)*

This component will handle:
*   `createOrder`: A function that calls your backend (Supabase Edge Function) to create a PayPal order and returns the PayPal Order ID.
*   `onApprove`: A function called when the user approves the payment in the PayPal flow. This function will then call your backend to capture the payment for the Order ID.
*   `onError`: Handles errors during the PayPal flow.

## 5. Backend Integration (Supabase Edge Function)

Create Supabase Edge Functions to interact with the PayPal Orders API v2.

### 5.1. Get PayPal Access Token

PayPal APIs use OAuth 2.0 Bearer Tokens. You need a function or utility to get an access token using your Client ID and Secret.

*(This logic will be part of the conceptual code in `/supabase/functions/paypal-payment/index.ts_conceptual`)*

### 5.2. Create PayPal Order Function

Create a Supabase Edge Function (e.g., `paypal-create-order`) to create an order with PayPal.

**Path:** `supabase/functions/paypal-create-order/index.ts` (or part of a larger `paypal-payment` function)

*(Conceptual code for this function will be provided in `/supabase/functions/paypal-payment/index.ts_conceptual`)*

This function will:
1.  Get a PayPal access token.
2.  Receive the cart/order details (amount, currency, items) from the frontend request.
3.  Make a POST request to PayPal's `/v2/checkout/orders` endpoint to create the order.
4.  Return the PayPal Order ID (`id` from the response) to the frontend.

### 5.3. Capture PayPal Order Function

Create a Supabase Edge Function (e.g., `paypal-capture-order`) to capture the payment for an approved order.

**Path:** `supabase/functions/paypal-capture-order/index.ts` (or part of `paypal-payment`)

*(Conceptual code for this function will be provided in `/supabase/functions/paypal-payment/index.ts_conceptual`)*

This function will:
1.  Get a PayPal access token.
2.  Receive the PayPal Order ID from the frontend.
3.  Make a POST request to PayPal's `/v2/checkout/orders/${orderID}/capture` endpoint.
4.  Handle the response. If successful, update your order status in Supabase, manage inventory, etc.

### 5.4. Handle PayPal Webhooks Function

Create a Supabase Edge Function (e.g., `paypal-webhook-handler`) to listen to PayPal webhooks.

**Path:** `supabase/functions/paypal-webhook-handler/index.ts` (or part of `paypal-payment`)

*(Conceptual code for this function will be provided in `/supabase/functions/paypal-payment/index.ts_conceptual`)*

This function will:
1.  **Verify the webhook signature:** PayPal sends headers that you must use along with your Webhook ID from the PayPal Developer Dashboard to verify the event.
2.  Parse the event object.
3.  Handle specific event types:
    *   `CHECKOUT.ORDER.APPROVED`: User has approved the payment. You might update your internal order status.
    *   `PAYMENT.CAPTURE.COMPLETED`: Payment capture was successful. This is a critical event to confirm payment and fulfill the order.
    *   `PAYMENT.CAPTURE.DENIED`: Payment capture was denied.
    *   `PAYMENT.CAPTURE.REFUNDED`: A refund was processed.
    *   Other events as needed.
4.  Return a `200 OK` response to PayPal to acknowledge receipt.

**Webhook Endpoint Configuration:**

In your PayPal Developer Dashboard (My Apps & Credentials > Select your App > Webhooks):
*   Add a webhook endpoint URL: Your deployed Supabase Edge Function URL (e.g., `https://<your-project-ref>.supabase.co/functions/v1/paypal-webhook-handler`).
*   Subscribe to the relevant events (e.g., `Checkout order approved`, `Payment capture completed`, `Payment capture denied`, `Payment capture refunded`).
*   Note down the **Webhook ID** provided by PayPal and store it as `PAYPAL_WEBHOOK_ID` in your Supabase Edge Function environment variables for signature verification.

## 6. Security Considerations

*   **Secret Management:** Never expose your PayPal Client Secret or Webhook ID in client-side code.
*   **Webhook Security:** Always verify webhook signatures.
*   **Server-Side Validation:** Validate amounts and order details on your server before creating/capturing PayPal orders.
*   **Idempotency:** Design your webhook handler and payment capture logic to be idempotent.
*   **Error Handling:** Implement robust error handling on both frontend and backend.

## 7. Testing

*   Use your PayPal Sandbox account and Sandbox API credentials.
*   Create Sandbox buyer and seller accounts in the PayPal Developer Dashboard to simulate transactions.
*   Use the PayPal Sandbox Webhook Simulator to test your webhook handler.

## 8. Going Live

1.  Switch from PayPal Sandbox credentials (Client ID, Secret, Webhook ID) to Live credentials in your environment variables.
2.  Update your webhook endpoint in the PayPal Developer Dashboard to use your Live Webhook ID and subscribe to events for your Live app.
3.  Thoroughly test the live integration.

This guide outlines a server-centric approach for PayPal integration. Adjustments may be needed based on the complexity of your e-commerce application and specific PayPal features you intend to use.

