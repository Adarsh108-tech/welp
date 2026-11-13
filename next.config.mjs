/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["fontkit", "pdf-lib", "mongoose", "bcryptjs"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
