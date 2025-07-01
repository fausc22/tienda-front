import Link from 'next/link';
import { useConfig } from '../../context/ConfigContext';
import Image from 'next/image';

const Hero = () => {
  const { config } = useConfig();

  return (
    <section className="relative w-full h-screen min-h-[400px] max-h-[600px] overflow-hidden">
      
      {/* Imagen de fondo usando img tag - MÁS CONFIABLE */}
      <Image
        src="/images/hero-image.png"
        alt="Hero background"
        fill
        className="object-cover"
        style={{ zIndex: 1 }}
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
        }}
        priority
      />

      
      {/* Overlay oscuro para mejorar legibilidad */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50"
        style={{ zIndex: 2 }}
      />
      
      {/* Contenido principal */}
      <div 
        className="relative w-full h-full flex items-center justify-start px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24"
        style={{ zIndex: 3 }}
      >
        <div className="w-full max-w-2xl text-white">
          
          {/* Nombre del comercio */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            {config?.storeName || 'TIENDA'}
          </h1>
          
          {/* Descripción del comercio */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 leading-relaxed max-w-xl">
            {config?.storeDescription || 'Bienvenido a nuestra tienda online. Encuentra los mejores productos con la mejor calidad.'}
          </p>
          
          {/* Botón de acción */}
          <Link href="/productos">
            <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base md:text-lg">
              Ver Productos
            </button>
          </Link>
          
        </div>
      </div>
      
      {/* Indicador de scroll (opcional) */}
      <div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white animate-bounce hidden sm:block"
        style={{ zIndex: 3 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
      
    </section>
  );
};

export default Hero;