/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// Extraer hostname de NEXT_PUBLIC_API_URL si está disponible
const getApiHostname = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.warn('⚠️ NEXT_PUBLIC_API_URL no está definida. Usando hostname por defecto.');
    return null;
  }
  
  try {
    const url = new URL(apiUrl);
    return url.hostname;
  } catch (error) {
    console.warn('⚠️ Error al parsear NEXT_PUBLIC_API_URL:', error);
    return null;
  }
};

const apiHostname = getApiHostname();

// Construir remotePatterns dinámicamente
const remotePatterns = [
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
];

// Agregar hostname de API si está disponible
if (apiHostname) {
  remotePatterns.push({
    protocol: 'https',
    hostname: apiHostname,
    pathname: '/**',
  });
}

const nextConfig = {
  // CONFIGURACIÓN PARA SUBDIRECTORIO SOLO EN PRODUCCIÓN
  ...(isProd && {
    basePath: '/puntosur',
    assetPrefix: '/puntosur',
  }),

  // CONFIGURACIÓN PARA EXPORTACIÓN ESTÁTICA
  output: 'export',
  trailingSlash: true,
  
  // ✅ CONFIGURACIÓN MEJORADA DE IMÁGENES
  images: {
    unoptimized: true, // CRÍTICO: Las imágenes optimizadas no funcionan con export
    remotePatterns,
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

    return config;
  },
  
  // ❌ REMOVER REWRITES - No funcionan con export estático
  // async rewrites() {
  //   return {
  //     beforeFiles: [],
  //     afterFiles: [],
  //     fallback: [],
  //   };
  // },

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