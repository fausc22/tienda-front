/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  trailingSlash: true,

  images: {
    unoptimized: false, // Vercel optimiza imágenes por defecto
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.rsoftware.com.ar',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rsoftware.com.ar',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      }
    ],
  },

  poweredByHeader: false,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig;
