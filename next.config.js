/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Type-checking (tsc) is the source of truth; don't block builds on lint.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
