import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Optimize image sizes for mobile-first
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    imageSizes: [40, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
