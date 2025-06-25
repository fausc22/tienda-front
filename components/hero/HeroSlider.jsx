import { useState, useEffect } from 'react';
import apiClient from '../../config/api';

const HeroSlider = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await apiClient.get('/store/getImagenesPublicidad');
        const imageUrls = response.data.map(url => 
          `${process.env.NEXT_PUBLIC_API_URL}${url}`
        );
        setImages(imageUrls);
      } catch (error) {
        console.error('Error al obtener imágenes de publicidad:', error);
        // Fallback con imágenes de ejemplo
        const fallbackImages = [
          'https://picsum.photos/800/400?random=1',
          'https://picsum.photos/800/400?random=2',
          'https://picsum.photos/800/400?random=3'
        ];
        setImages(fallbackImages);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-200 h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg animate-pulse flex items-center justify-center">
            <p className="text-gray-500 text-sm sm:text-base">Cargando publicidades...</p>
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Slider Container */}
          <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100">
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('Error loading image:', e.target.src);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-600 scale-110'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows - Solo en pantallas medianas y grandes */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => goToSlide(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
                className="hidden sm:block absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 transition-all duration-300"
                aria-label="Imagen anterior"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => goToSlide(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
                className="hidden sm:block absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 transition-all duration-300"
                aria-label="Imagen siguiente"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Touch/Swipe indicators para móvil */}
          <div className="sm:hidden absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs">
            Desliza para cambiar
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;