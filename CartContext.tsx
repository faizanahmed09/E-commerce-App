// /contexts/CartContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Cart, CartItem, Product } from "@/types";
// import { supabase } from "@/lib/supabaseClient"; // If using server-side cart for logged-in users
// import { useAuth } from "./AuthContext"; // To sync with user state

interface CartContextType {
  cart: Cart;
  loading: boolean;
  error: Error | null;
  addItemToCart: (product: Product, quantity: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItemFromCart: (productId: string) => void;
  clearCart: () => void;
  // getCartTotal: () => number; // Derived property, can be calculated directly
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const LOCAL_STORAGE_CART_KEY = "myShopCart";

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(true); // For initial load from localStorage or backend
  const [error, setError] = useState<Error | null>(null);
  // const { user } = useAuth(); // To be implemented for server-side cart logic

  // Load cart from localStorage on initial render (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLoading(true);
      try {
        const storedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
        if (storedCart) {
          const parsedCart: Cart = JSON.parse(storedCart);
          // Basic validation, could be more thorough
          if (parsedCart && Array.isArray(parsedCart.items)) {
            setCart(parsedCart);
          }
        }
      } catch (e: any) {
        console.error("Error loading cart from localStorage:", e);
        setError(new Error("Failed to load cart from storage."));
        localStorage.removeItem(LOCAL_STORAGE_CART_KEY); // Clear corrupted cart
      }
      setLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) { // Avoid saving during initial load
      try {
        localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cart));
      } catch (e: any) {
        console.error("Error saving cart to localStorage:", e);
        setError(new Error("Failed to save cart changes."));
      }
    }
  }, [cart, loading]);

  // TODO: Implement server-side cart synchronization if user is logged in
  // useEffect(() => {
  //   if (user) {
  //     // Fetch cart from Supabase and merge/replace localStorage cart
  //     // Or, if localStorage cart is newer, push to Supabase
  //   } else {
  //     // User logged out, rely on localStorage or clear server cart if it was user-specific
  //   }
  // }, [user]);

  const addItemToCart = useCallback((product: Product, quantity: number) => {
    if (quantity <= 0) return;
    if (product.stock_quantity !== undefined && quantity > product.stock_quantity) {
        alert(`Cannot add more than available stock (${product.stock_quantity})`);
        return;
    }

    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.product_id === product.id
      );
      let newItems: CartItem[];

      if (existingItemIndex > -1) {
        newItems = prevCart.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              quantity: product.stock_quantity !== undefined ? Math.min(newQuantity, product.stock_quantity) : newQuantity,
            };
          }
          return item;
        });
      } else {
        newItems = [
          ...prevCart.items,
          {
            id: product.id, // Using product.id as cart item id for simplicity here
            product_id: product.id,
            quantity: product.stock_quantity !== undefined ? Math.min(quantity, product.stock_quantity) : quantity,
            added_at: new Date().toISOString(),
            product: { // Store essential product info for cart display
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images, // Or just the primary image URL
                stock_quantity: product.stock_quantity,
                // Do not store full description or other large fields unless necessary
            } as Product, 
          },
        ];
      }
      return { ...prevCart, items: newItems };
    });
  }, []);

  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 0) return; // Quantity cannot be negative

    setCart((prevCart) => {
      const itemToUpdate = prevCart.items.find(item => item.product_id === productId);
      if (itemToUpdate && itemToUpdate.product?.stock_quantity !== undefined && quantity > itemToUpdate.product.stock_quantity) {
        alert(`Cannot set quantity above available stock (${itemToUpdate.product.stock_quantity})`);
        return prevCart; // Do not update if new quantity exceeds stock
      }

      if (quantity === 0) {
        // If quantity is 0, remove the item
        return {
          ...prevCart,
          items: prevCart.items.filter((item) => item.product_id !== productId),
        };
      }
      
      return {
        ...prevCart,
        items: prevCart.items.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        ),
      };
    });
  }, []);

  const removeItemFromCart = useCallback((productId: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.filter((item) => item.product_id !== productId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({ items: [] });
  }, []);

  const value = {
    cart,
    loading,
    error,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

