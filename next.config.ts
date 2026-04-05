import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require("next-pwa");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // API routes — network first
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 }, // 1 hour
        networkTimeoutSeconds: 10,
      },
    },
    // Static assets — cache first
    {
      urlPattern: /\.(?:js|css|woff2?|ttf|otf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
      },
    },
    // Images — cache first
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Pages — network first with offline fallback
    {
      urlPattern: /^https?:\/\/.*\/(dashboard|login|signup|pricing).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // next-pwa uses webpack; tell Next.js 16 to use webpack for builds
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
