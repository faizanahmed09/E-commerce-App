/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  // Optional: Add other Next.js configurations here if needed
  // For static export, ensure features like Image Optimization (default loader) and Internationalized Routing
  // are compatible or configured appropriately.
  // If using next/image, you might need a custom loader for static export if not deploying to Vercel.
  // For this deployment, we assume default image handling is acceptable or images are externally hosted.
  images: {
    unoptimized: true, // Necessary for `next export` if not using a cloud provider's image optimization
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. It's recommended to fix these errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors. It's recommended to fix these errors.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;

