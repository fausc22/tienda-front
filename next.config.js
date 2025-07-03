/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  
  // Configuración para export estático 
  output: 'export',
  trailingSlash: true,
  
  
  // Configuración de imágenes para export
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

}