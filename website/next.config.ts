import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  output: 'export',
  env: { NEXT_PUBLIC_BUILD_SHA: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'development' },
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
