// /components/layout/Header.tsx
"use client";

import Link from "next/link";
import React from "react";
// import { useAuth } from "@/hooks/useAuth"; // To be implemented
// import { useCart } from "@/hooks/useCart"; // To be implemented

const Header: React.FC = () => {
  // const { user, signOut } = useAuth(); // To be implemented
  // const { cart } = useCart(); // To be implemented
  const user = null; // Placeholder
  const cart = { items: [] }; // Placeholder

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          MyShop
        </Link>
        <nav className="space-x-4 flex items-center">
          <Link href="/products" className="hover:text-gray-300">
            Products
          </Link>
          {/* <Link href="/categories" className="hover:text-gray-300">
            Categories
          </Link> */} {/* Placeholder - categories page might be part of products page or separate */}
          <Link href="/search" className="hover:text-gray-300">
            Search
          </Link>
          <Link href="/app/(checkout)/cart" className="hover:text-gray-300 relative">
            Cart 
            {/* <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full px-1.5 py-0.5">
              {cart?.items?.length || 0}
            </span> */}
             ({cart?.items?.length || 0})
          </Link>
          {user ? (
            <>
              <Link href="/app/(user)/profile" className="hover:text-gray-300">
                Profile
              </Link>
              <Link href="/app/(user)/orders" className="hover:text-gray-300">
                Orders
              </Link>
              {/* {user.profile?.role === "admin" && (
                <Link href="/admin" className="hover:text-gray-300">
                  Admin
                </Link>
              )} */}
              {/* <button onClick={() => signOut()} className="hover:text-gray-300">
                Logout
              </button> */}
              <span className="text-sm">Welcome!</span> {/* Placeholder for user name */}
              <button className="hover:text-gray-300">Logout</button> {/* Placeholder */}
            </>
          ) : (
            <>
              <Link href="/app/(auth)/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link href="/app/(auth)/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

