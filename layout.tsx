// /app/admin/layout.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HomeIcon, ShoppingBagIcon, TagIcon, UsersIcon, ClipboardListIcon, CogIcon, SignOutIcon } from "@heroicons/react/24/outline"; // Using Heroicons

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/app/admin", icon: HomeIcon },
    { name: "Products", href: "/app/admin/products", icon: ShoppingBagIcon },
    { name: "Categories", href: "/app/admin/categories", icon: TagIcon },
    { name: "Orders", href: "/app/admin/orders", icon: ClipboardListIcon },
    { name: "Users", href: "/app/admin/users", icon: UsersIcon },
    // { name: "Settings", href: "/app/admin/settings", icon: CogIcon }, // Placeholder
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/"); // Redirect to homepage after sign out
  };

  return (
    <div className="flex flex-col h-0 flex-1 bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Link href="/" className="text-2xl font-bold text-white">
            MyShop <span className="text-sm font-normal text-indigo-400">Admin</span>
          </Link>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                ${pathname === item.href || (item.href !== "/app/admin" && pathname.startsWith(item.href)) 
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"}
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
              `}
            >
              <item.icon
                className={`
                  ${pathname === item.href || (item.href !== "/app/admin" && pathname.startsWith(item.href)) 
                    ? "text-gray-300"
                    : "text-gray-400 group-hover:text-gray-300"}
                  mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150
                `}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex bg-gray-700 p-4 border-t border-gray-600">
        <button
          onClick={handleSignOut}
          className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-colors duration-150"
        >
          <SignOutIcon className="text-gray-400 group-hover:text-gray-300 mr-3 h-6 w-6" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/app/(auth)/login?redirect=/app/admin");
      } else if (profile && profile.role !== "admin") {
        router.push("/"); // Redirect non-admins to homepage
        alert("Access Denied: You do not have permission to view this page.");
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || !profile || profile.role !== "admin") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <AdminSidebar />
        </div>
      </div>
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* TODO: Add mobile menu button here if needed */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {/* Main content goes here */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

