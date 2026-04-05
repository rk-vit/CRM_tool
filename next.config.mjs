/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

    serverActions: {
      allowedOrigins: ['192.168.0.101:3000', 'localhost:3000'],
    },
};

export default nextConfig;