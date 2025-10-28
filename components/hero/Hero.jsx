import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConfig } from '../../context/ConfigContext';
import Image from 'next/image';

const Hero = () => {
  const { config } = useConfig();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Imágenes del slider - usando las imágenes del cliente
  const slides = [
    {
      image: '/home_banner.jpg',
      title: 'PUNTO SUR',
      subtitle: 'Estamos y Tenemos',
      cta: 'Ver Productos'
    },
    {
      image: '/home_banner2.jpg',
      title: 'Envíos a domicilio',
      subtitle: config?.storeDescription || 'Bienvenido a nuestra tienda online. Encuentra los mejores productos con la mejor calidad.',
      cta: 'Comprar ahora'
    }
  ];

  // Auto-cambiar slides cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Imagen de fondo - stretched para ver completa */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-contain transition-opacity duration-1000"
                priority={index === 0}
                unoptimized
              />
            </div>

            {/* Overlay con gradiente dinámico */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

            {/* Contenido del slide */}
            <div className="relative h-full flex items-center px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 z-20">
              <div className="max-w-2xl text-white animate-fadeIn">

                {/* Título */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight drop-shadow-2xl">
                  {slide.title}
                </h1>

                {/* Subtítulo */}
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 leading-relaxed max-w-xl drop-shadow-lg">
                  {slide.subtitle}
                </p>

                {/* Botón CTA */}
                <Link href="/productos">
                  <button className="group relative inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-sm sm:text-base md:text-lg overflow-hidden">
                    <span className="relative z-10">{slide.cta}</span>
                    <svg
                      className="relative z-10 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {/* Efecto de hover brillante */}
                    <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </button>
                </Link>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores de slides (dots) */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-green-500'
                : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-4 left-4 sm:left-8 text-white/80 animate-bounce hidden md:block z-30">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* Estilos adicionales para animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>

    </section>
  );
};

export default Hero;
