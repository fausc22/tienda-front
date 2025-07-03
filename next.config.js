/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración para export estático 
  output: 'export',
  trailingSlash: true,
  
  // Deshabilitar optimización de imágenes para export estático
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
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

  // Configuración para assets estáticos
  assetPrefix: '',
  
  // Configuración para rutas
  basePath: '',
  
  // Deshabilitar funciones que no son compatibles con export estático
  poweredByHeader: false,
  
  // Configuración específica para export
  distDir: '.next',
  
  // Asegurar compatibilidad con hosting estático
  experimental: {
    // Deshabilitar características que requieren servidor
  }
}

module.exports = nextConfig