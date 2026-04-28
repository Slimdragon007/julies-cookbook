import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow any HTTPS host so source recipe images render when Cloudinary
    // isn't available (TASK-010). Cloudinary remains the optimization path
    // when env is configured; this is the rendering fallback.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Optimize image sizes for mobile-first
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    imageSizes: [40, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
