/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  // Extend serverless/route timeout for long generations (self-hosted)
  serverRuntimeConfig: {
    maxDuration: 300,
  },
};

export default nextConfig;
