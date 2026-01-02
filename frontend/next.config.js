/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ STRICT MODE OFF — REQUIRED FOR LEAFLET
  reactStrictMode: false,

  // Packages you want Next to transpile
  transpilePackages: ["@studio-freight/lenis"],

  compiler: {
    swcMinify: true,
  },

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

  // keep as-is if you already rely on this
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
