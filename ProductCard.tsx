// /components/products/ProductCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image"; // Using Next.js Image for optimization
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const placeholderImage = "/placeholder-image.png"; // Add a placeholder image to /public
  const displayImage = product.images?.[0]?.image_url || placeholderImage;

  return (
    <div className="border rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white">
      <Link href={`/app/(main)/products/${product.id}`} className="block">
        <div className="w-full h-48 relative">
          <Image 
            src={displayImage} 
            alt={product.name}
            layout="fill"
            objectFit="cover"
            onError={(e) => {
              // In case the product image URL is broken or Supabase Storage URL is invalid
              e.currentTarget.srcset = placeholderImage;
              e.currentTarget.src = placeholderImage;
            }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate" title={product.name}>
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 truncate" title={product.description || ""}>
            {product.description || "No description available."}
          </p>
          <p className="text-xl font-bold text-indigo-600 mt-2">
            ${product.price.toFixed(2)}
          </p>
          {product.stock_quantity !== undefined && product.stock_quantity <= 0 && (
            <p className="text-sm text-red-500 mt-1">Out of Stock</p>
          )}
           {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 10 && (
            <p className="text-sm text-yellow-500 mt-1">Low Stock ({product.stock_quantity} left)</p>
          )}
        </div>
      </Link>
      {/* Add to cart button can be added here if needed directly on card */}
      {/* <div className="px-4 pb-4">
        <button 
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition-colors disabled:bg-gray-300"
          disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
        >
          Add to Cart
        </button>
      </div> */}
    </div>
  );
};

export default ProductCard;

