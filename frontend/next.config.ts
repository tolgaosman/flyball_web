import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Dev only: in production nginx routes /api/* and /health straight to Laravel.
const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Grounded Gemini searches can take well over the 30 s default.
    proxyTimeout: 200_000,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/health', destination: `${backendUrl}/health` },
    ];
  },
};

export default createNextIntlPlugin()(nextConfig);
