/** @type {import('next').NextConfig} */
const nextConfig = {
  // CONFIGURACIÓN CRÍTICA PARA SUBDIRECTORIO
  basePath: '/tienda',
  assetPrefix: '/tienda',
  
  // CONFIGURACIÓN PARA EXPORTACIÓN ESTÁTICA
  output: 'export',
  trailingSlash: true,
  
  // DESACTIVAR OPTIMIZACIONES QUE NO FUNCIONAN CON EXPORT
  images: {
    unoptimized: true, // CRÍTICO: Las imágenes optimizadas no funcionan con export
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
      },
      {
        protocol: 'https',
        hostname: 'vps-5234411-x.dattaweb.com',
        pathname: '/**',
      }
    ],
  },

  // DESACTIVAR CARACTERÍSTICAS NO COMPATIBLES CON EXPORT
  poweredByHeader: false,
  
  // OPTIMIZACIONES PARA PRODUCCIÓN
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // CONFIGURACIÓN DE WEBPACK
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  // CONFIGURACIÓN PARA MANEJO DE RUTAS EN SUBDIRECTORIO
  async rewrites() {
    return {
      beforeFiles: [
        // Reescribir rutas para que funcionen en subdirectorio
        {
          source: '/:path*',
          destination: '/:path*',
        },
      ],
    };
  },
}

module.exports = nextConfig;