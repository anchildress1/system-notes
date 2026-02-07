import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@algolia/sitesearch'],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
