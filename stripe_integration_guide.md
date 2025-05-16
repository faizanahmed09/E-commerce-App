# Stripe Payment Gateway Integration Guide for Next.js & Supabase E-commerce App

This document provides a comprehensive guide on integrating Stripe into your Next.js frontend and Supabase backend for secure payment processing.

## 1. Overview

Stripe is a popular payment processing platform that allows businesses to accept payments online. Integration typically involves:

1.  **Frontend (Next.js):** Using Stripe.js and Stripe Elements to securely collect card details from the user. Card details are sent directly to Stripe, not your server, enhancing PCI compliance.
2.  **Backend (Supabase Edge Function):** Creating a PaymentIntent on the server-side to initiate a payment. This PaymentIntent includes the amount and currency.
3.  **Frontend:** Using the client secret from the PaymentIntent to confirm the card payment with Stripe.js.
4.  **Backend:** Handling Stripe webhooks to listen for payment events (e.g., `payment_intent.succeeded`, `payment_intent.payment_failed`) and update order status, manage inventory, etc., in your Supabase database.

## 2. Prerequisites

*   A Stripe account: Sign up at [https://stripe.com/](https://stripe.com/)
*   Stripe API Keys: You will need your Publishable Key (for the frontend) and Secret Key (for the backend). Find these in your Stripe Dashboard under Developers > API Keys.
*   Supabase project with Edge Functions enabled.
*   Next.js application setup.

## 3. Setup

### 3.1. Environment Variables

Store your Stripe keys securely. For local development with Next.js, you can use a `.env.local` file:

```env
# .env.local (Frontend - Next.js)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

For your Supabase Edge Function, set environment variables in the Supabase Dashboard (Project Settings > Edge Functions > Add new secret):

```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SIGNING_SECRET
```

**Important:** Never expose your Stripe Secret Key or Webhook Secret on the client-side.

### 3.2. Install Stripe Libraries

**Frontend (Next.js):**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
# or
yarn add @stripe/stripe-js @stripe/react-stripe-js
# or
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

**Backend (Supabase Edge Function):**

When deploying your Edge Function, Stripe's Node.js library will be a dependency.

```bash
# In your supabase/functions/your-function directory
npm install stripe
# or
yarn add stripe
# or
pnpm add stripe
```

## 4. Frontend Integration (Next.js)

### 4.1. Load Stripe.js

Wrap your checkout form or relevant part of your application with `Elements` provider from `@stripe/react-stripe-js`.

```tsx
// Example: /app/(checkout)/payment/page.tsx or a specific payment component

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm from "@/components/payment/StripeCheckoutForm"; // We will create this

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PaymentPageWithStripe = () => {
  // ... (fetch clientSecret for an existing PaymentIntent or create one on page load)
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Example: Create a PaymentIntent when the component mounts or when amount is known
    // This should ideally be done when the user is ready to pay
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/stripe/create-payment-intent", { // Your backend endpoint
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 1000, currency: "usd" }), // Example amount
        });
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        console.error("Error creating payment intent:", error);
      }
    };
    // createPaymentIntent(); // Call this appropriately
  }, []);

  const options = {
    clientSecret,
    // appearance, etc.
  };

  return (
    <div>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <StripeCheckoutForm />
        </Elements>
      )}
      {!clientSecret && <p>Loading payment options...</p>}
    </div>
  );
};

export default PaymentPageWithStripe;
```

### 4.2. Create Checkout Form (`StripeCheckoutForm.tsx`)

This component will use Stripe Elements like `CardElement` or individual elements (`CardNumberElement`, `CardExpiryElement`, `CardCvcElement`) to collect payment details.

*(Conceptual code for this component will be provided in `/components/payment/StripeCheckoutForm.tsx`)*

## 5. Backend Integration (Supabase Edge Function)

### 5.1. Create PaymentIntent Function

Create a Supabase Edge Function (e.g., `stripe-create-payment-intent`) to create a PaymentIntent.

**Path:** `supabase/functions/stripe-create-payment-intent/index.ts`

*(Conceptual code for this function will be provided in `/supabase/functions/stripe-payment/index.ts_conceptual` - specifically the PaymentIntent creation part)*

This function will:
1.  Initialize the Stripe Node.js library with your secret key.
2.  Receive the amount and currency (and potentially other details like `customer_id` if you manage Stripe customers) from the frontend request.
3.  Create a `PaymentIntent` using `stripe.paymentIntents.create()`.
4.  Return the `client_secret` of the PaymentIntent to the frontend.

### 5.2. Handle Webhooks Function

Create another Supabase Edge Function (e.g., `stripe-webhook-handler`) to listen to Stripe webhooks.

**Path:** `supabase/functions/stripe-webhook-handler/index.ts`

*(Conceptual code for this function will be provided in `/supabase/functions/stripe-payment/index.ts_conceptual` - specifically the webhook handling part)*

This function will:
1.  Verify the webhook signature using your `STRIPE_WEBHOOK_SECRET` to ensure the request is from Stripe.
2.  Parse the event object.
3.  Handle specific event types:
    *   `payment_intent.succeeded`: Payment was successful. Update the order status in your Supabase `orders` table to "processing" or "paid". Fulfill the order (e.g., send confirmation email, decrement stock).
    *   `payment_intent.payment_failed`: Payment failed. Update order status accordingly, notify the user.
    *   Other events as needed (e.g., `charge.refunded`).
4.  Return a `200 OK` response to Stripe to acknowledge receipt of the event.

**Webhook Endpoint Configuration:**

In your Stripe Dashboard (Developers > Webhooks), add an endpoint:
*   **Endpoint URL:** Your deployed Supabase Edge Function URL (e.g., `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook-handler`).
*   **Events to send:** Select the events you want to listen to (e.g., `payment_intent.succeeded`, `payment_intent.payment_failed`).
*   Note down the **Signing secret** generated by Stripe for this endpoint and add it to your Supabase Edge Function environment variables as `STRIPE_WEBHOOK_SECRET`.

## 6. Security Considerations

*   **PCI Compliance:** Using Stripe Elements helps in achieving PCI compliance as sensitive card data is sent directly to Stripe servers.
*   **Secret Management:** Never expose your Stripe Secret Key or Webhook Secret in client-side code. Use environment variables for your backend functions.
*   **Webhook Security:** Always verify webhook signatures to prevent malicious requests.
*   **Idempotency:** Design your webhook handler to be idempotent. Stripe may send the same webhook event multiple times.
*   **Error Handling:** Implement robust error handling on both frontend and backend.

## 7. Testing

*   Use Stripe's test card numbers for testing payments in test mode.
*   Use the Stripe CLI or the Dashboard to trigger test webhook events.
*   Thoroughly test different payment scenarios, including successful payments, failed payments, and different card types.

## 8. Going Live

1.  Switch from Stripe test API keys to live API keys in your environment variables.
2.  Ensure your webhook endpoint is configured with the live mode signing secret.
3.  Thoroughly test the live integration before making it available to all users.

This guide provides a foundational approach. Depending on your specific requirements (e.g., subscriptions, saving payment methods, SCA regulations), further customization and features might be necessary.

