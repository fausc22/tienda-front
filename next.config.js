/** @type {import('next').NextConfig} */
const nextConfig = {
  // CONFIGURACIÓN CRÍTICA PARA SUBDIRECTORIO
  basePath: '/tienda',
  assetPrefix: '/tienda',

  // CONFIGURACIÓN PARA EXPORTACIÓN ESTÁTICA
  output: 'export',
  trailingSlash: true,
  
  // ✅ CONFIGURACIÓN MEJORADA DE IMÁGENES
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
    // ✅ FORMATOS ADICIONALES
    formats: ['image/avif', 'image/webp'],
  },
  
  // DESACTIVAR CARACTERÍSTICAS NO COMPATIBLES CON EXPORT
  poweredByHeader: false,
  
  // OPTIMIZACIONES PARA PRODUCCIÓN
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // ✅ CONFIGURACIÓN DE WEBPACK MEJORADA
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // ✅ CONFIGURACIÓN PARA VIDEOS Y ARCHIVOS MULTIMEDIA
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac|mov|avi)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });

    // ✅ OPTIMIZACIÓN DE ARCHIVOS ESTÁTICOS
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Crear chunk separado para vendors grandes
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Chunk común para código compartido
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    };

    return config;
  },
  
  // ✅ CONFIGURACIÓN PARA MANEJO DE RUTAS EN SUBDIRECTORIO
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // ✅ HEADERS ADICIONALES (aunque con export estático dependen del servidor web)
  async headers() {
    return [
      {
        // Headers para todos los archivos
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // ✅ CONFIGURACIÓN DE GENERACIÓN ESTÁTICA
  generateBuildId: async () => {
    // Usar timestamp para cache busting
    return `build-${Date.now()}`;
  },
}

module.exports = nextConfig;