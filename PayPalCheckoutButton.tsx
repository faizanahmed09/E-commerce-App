// /components/payment/PayPalCheckoutButton.tsx
"use client";

import React, { useState } from "react";
import { PayPalButtons, usePayPalScriptReducer, PayPalButtonsComponentProps } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation"; // If needed for redirect
// import { useCart } from "@/hooks/useCart"; // To get cart details

interface PayPalCheckoutButtonProps {
  currency?: string;
  amount: string; // Amount as a string, e.g., "10.99"
  onPaymentSuccess: (details: any) => void; // Callback for successful payment
  onPaymentError: (error: any) => void; // Callback for payment error
  onPaymentCancel?: () => void; // Optional: Callback for payment cancellation
  disabled?: boolean;
}

const PayPalCheckoutButton: React.FC<PayPalCheckoutButtonProps> = ({ 
    currency = "USD", 
    amount,
    onPaymentSuccess,
    onPaymentError,
    onPaymentCancel,
    disabled = false 
}) => {
  const [{ options, isPending, isRejected, isResolved }, dispatch] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // const { cart, clearCart } = useCart(); // Example: if cart details are needed

  // Function to call your backend to create a PayPal order
  const createOrder: PayPalButtonsComponentProps["createOrder"] = async (data, actions) => {
    setError(null);
    console.log("Attempting to create PayPal order with amount:", amount, "currency:", currency);
    // This should call your Supabase Edge Function
    try {
      const response = await fetch("/api/paypal/create-order", { // Replace with your actual API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: { /* Send cart details if needed by backend to calculate amount/items */ 
            // items: cart.items.map(item => ({ sku: item.product?.sku, quantity: item.quantity, name: item.product?.name, unit_amount: { currency_code: currency, value: item.product?.price.toFixed(2) }})),
            totalAmount: amount, // Ensure this amount is validated server-side
            currencyCode: currency,
          },
        }),
      });

      const orderData = await response.json();

      if (!response.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to create PayPal order.");
      }
      
      console.log("PayPal order created successfully:", orderData.id);
      return orderData.id; // Return the PayPal Order ID
    } catch (err: any) {
      console.error("Error creating PayPal order:", err);
      setError(err.message || "Could not initiate PayPal payment.");
      onPaymentError(err);
      return ""; // Must return a string, even on error
    }
  };

  // Function to call your backend to capture the PayPal order
  const onApprove: PayPalButtonsComponentProps["onApprove"] = async (data, actions) => {
    setError(null);
    console.log("PayPal order approved by user. Order ID:", data.orderID);
    // This should call your Supabase Edge Function to capture the payment
    try {
      const response = await fetch(`/api/paypal/capture-order`, { // Replace with your actual API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      const captureData = await response.json();

      if (!response.ok || captureData.error) {
        throw new Error(captureData.error || "Failed to capture PayPal payment.");
      }

      console.log("PayPal payment captured successfully:", captureData);
      // captureData should contain details of the captured payment, like transaction ID
      // Example: captureData.purchase_units[0].payments.captures[0].id
      onPaymentSuccess(captureData);
      // clearCart(); // Example: Clear cart on successful payment
      // router.push(`/order-confirmation?paypal_order_id=${data.orderID}`); // Redirect to confirmation
      return Promise.resolve(); // Ensure a promise is returned
    } catch (err: any) {
      console.error("Error capturing PayPal payment:", err);
      setError(err.message || "Payment capture failed. Please contact support.");
      onPaymentError(err);
      // Potentially redirect to a payment failed page or show error to user
      return Promise.reject(err); // Ensure a promise is returned on error
    }
  };

  const onError: PayPalButtonsComponentProps["onError"] = (err) => {
    console.error("PayPal Checkout Error:", err);
    setError("An error occurred with the PayPal payment. Please try again.");
    onPaymentError(err);
  };

  const onCancel: PayPalButtonsComponentProps["onCancel"] = (data, actions) => {
    console.log("PayPal payment cancelled by user. Order ID:", data.orderID);
    setError("Payment was cancelled.");
    if (onPaymentCancel) {
        onPaymentCancel();
    }
  };

  if (isPending) {
    return <div className="flex justify-center items-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>;
  }
  if (isRejected) {
    return <div className="text-red-500 p-4 text-center">Error loading PayPal SDK. Please check your Client ID and network connection.</div>
  }
  // isResolved means the SDK is loaded

  return (
    <div className="w-full">
      {error && <p className="text-red-500 text-sm text-center mb-2">Error: {error}</p>}
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", tagline: false }}
        disabled={disabled || isPending || parseFloat(amount) <= 0}
        forceReRender={[amount, currency]} // Re-render buttons if amount or currency changes
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
      />
      <p className="text-xs text-gray-500 mt-2 text-center">Secure payments by PayPal.</p>
    </div>
  );
};

export default PayPalCheckoutButton;

