/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet ke liye strict mode off (fine)
  reactStrictMode: false,

  // Packages to transpile
  transpilePackages: ["@studio-freight/lenis"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "cdn.builder.io" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // You knowingly disabled assumptions — fine for MVP
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
