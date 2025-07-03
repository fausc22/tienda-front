/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración para hosting estático
  output: 'export',
  trailingSlash: true,
  
  // Configuración de imágenes para export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.rsoftware.com.ar',
        port: '8090',
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

  // Configuración del assetPrefix para el preview
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://www.rsoftware.com.ar:8090/preview/tienda.rsoftware.com.ar'
    : '',

  // Configuración de paths públicos
  basePath: process.env.NODE_ENV === 'production' 
    ? '/preview/tienda.rsoftware.com.ar'
    : '',

  // Optimizaciones
  poweredByHeader: false,
  
  // Variables de entorno que estarán disponibles en el cliente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Configuración de webpack si necesitas alguna customización
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Aquí puedes agregar configuraciones personalizadas de webpack
    return config;
  },
}

module.exports = nextConfig;