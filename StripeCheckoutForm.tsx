// /components/payment/StripeCheckoutForm.tsx
"use client";

import React, { useState, FormEvent } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  // Or use individual elements:
  // CardNumberElement,
  // CardExpiryElement,
  // CardCvcElement,
} from "@stripe/react-stripe-js";

interface StripeCheckoutFormProps {
  // clientSecret: string; // Passed via Elements options usually
  onSuccessfulPayment: (paymentIntentId: string) => void;
  onFailedPayment: (error: any) => void;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({ onSuccessfulPayment, onFailedPayment }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      setMessage("Stripe.js has not loaded yet. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Option 1: Using PaymentElement (Recommended for most cases)
    // The PaymentElement dynamically displays relevant payment methods based on your Stripe Dashboard settings and the customer's location.
    // It also handles various payment flows like 3D Secure authentication.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/app/(user)/orders/payment-status`, // Or your order confirmation page
        // receipt_email: customerEmail, // Optional: if you have customer email
      },
      // If you want to handle the redirect manually instead of relying on `return_url`,
      // you can set `redirect: "if_required"` and then check `paymentIntent.status`.
      // redirect: "if_required", 
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
      onFailedPayment(error);
    } else {
      // This block is typically not reached if `redirect: "if_required"` is not used,
      // as the user is redirected. If `redirect: "if_required"` is used, check paymentIntent.status.
      if (paymentIntent) {
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("Payment succeeded!");
            onSuccessfulPayment(paymentIntent.id);
            break;
          case "processing":
            setMessage("Your payment is processing.");
            break;
          case "requires_payment_method":
            setMessage("Your payment was not successful, please try again.");
            break;
          default:
            setMessage("Something went wrong.");
            break;
        }
      } else {
        // Fallback, should ideally not happen if error is also null
        setMessage("Payment confirmation status unknown.");
      }
    }

    setIsLoading(false);
  };

  // Option 2: Using individual Card Elements (CardElement or CardNumberElement, etc.)
  // This gives more control over the form layout but requires more manual setup.
  // const handleSubmitWithCardElement = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (!stripe || !elements) return;
  //   const cardElement = elements.getElement(CardElement); // Or CardNumberElement
  //   if (!cardElement) return;

  //   setIsLoading(true);
  //   setMessage(null);

  //   const { error, paymentMethod } = await stripe.createPaymentMethod({
  //     type: "card",
  //     card: cardElement,
  //     // billing_details: { name: "Jenny Rosen" }, // Optional
  //   });

  //   if (error) {
  //     setMessage(error.message || "An error occurred.");
  //     setIsLoading(false);
  //     return;
  //   }

  //   // Now you have a paymentMethod.id. Send this to your backend to confirm the PaymentIntent.
  //   // const response = await fetch("/api/stripe/confirm-payment", {
  //   //   method: "POST",
  //   //   headers: { "Content-Type": "application/json" },
  //   //   body: JSON.stringify({ paymentMethodId: paymentMethod.id, paymentIntentId: clientSecretFromSomewhere }),
  //   // });
  //   // const paymentResult = await response.json();
  //   // Handle paymentResult.error or paymentResult.success
  //   // ... then call onSuccessfulPayment or onFailedPayment

  //   setIsLoading(false);
  // };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      {/* PaymentElement will render the dynamic payment form */}
      <PaymentElement id="payment-element" />
      
      {/* Or, if using individual elements:
      <div>
        <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
        <CardNumberElement id="card-number" className="mt-1 p-3 border border-gray-300 rounded-md w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          <CardExpiryElement id="card-expiry" className="mt-1 p-3 border border-gray-300 rounded-md w-full" />
        </div>
        <div>
          <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700">CVC</label>
          <CardCvcElement id="card-cvc" className="mt-1 p-3 border border-gray-300 rounded-md w-full" />
        </div>
      </div>
      */}

      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner-sm" role="status"></div> : "Pay now"}
        </span>
      </button>
      
      {/* Show any error or success messages */}
      {message && <div id="payment-message" className={`mt-4 text-sm ${message.includes("succeeded") || message.includes("processing") ? "text-green-600" : "text-red-600"}`}>{message}</div>}
      <style jsx>{`
        .spinner-sm {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          vertical-align: text-bottom;
          border: .2em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border .75s linear infinite;
        }
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default StripeCheckoutForm;

