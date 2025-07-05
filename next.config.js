/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // CONFIGURACIÓN CRUCIAL PARA SUBDIRECTORIO
  basePath: '/tienda',
  assetPrefix: '/tienda',
  
  // Configuración para export estático 
  output: 'export',
  trailingSlash: true,
  
  // Deshabilitar optimización de imágenes para export estático
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '45.58.127.47',
        port: '3001',
        pathname: '/**',
      },
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

  // Configuración específica para export
  distDir: '.next',
  
  // Asegurar compatibilidad con hosting estático
  poweredByHeader: false,
  
  // Optimizaciones para producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // Configuración para webpack
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

module.exports = nextConfig