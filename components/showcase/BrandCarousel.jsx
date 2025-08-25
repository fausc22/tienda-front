import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import apiClient, { getApiBaseURL } from '../../config/api';

const BrandCarousel = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const intervalRef = useRef(null);

  // Configuración del carrusel
  const AUTOPLAY_INTERVAL = 5000; // 5 segundos
  const TOUCH_MIN_SWIPE_DISTANCE = 50;

  useEffect(() => {
    const fetchBrandImages = async () => {
      try {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('🎨 BrandCarousel: Cargando imágenes destacadas...');
        }

        // Cambio de endpoint para evitar AdBlock
        const response = await apiClient.get('/store/getShowcase');
        
        if (response.data && response.data.length > 0) {
          // Si usas middleware estático, las URLs ya vienen completas desde el backend
          const imageUrls = response.data.map(url => `${getApiBaseURL()}${url}`);
          setImages(imageUrls);

          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('✅ BrandCarousel: Imágenes cargadas:', imageUrls);
          }
        } else {
          // Fallback con imágenes de demostración
          const demoImages = [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80',
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop&q=80',
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop&q=80'
          ];
          setImages(demoImages);
        }
        
      } catch (error) {
        console.error('❌ BrandCarousel: Error al cargar imágenes:', error);
        
        // Fallback images
        const fallbackImages = [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop&q=80'
        ];
        setImages(fallbackImages);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandImages();
  }, []);

  // Control de autoplay mejorado
  const startAutoplay = useCallback(() => {
    if (images.length <= 1) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex >= images.length - 1 ? 0 : prevIndex + 1;
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log(`🎠 Autoplay: ${prevIndex} → ${nextIndex} (total: ${images.length})`);
        }
        
        return nextIndex;
      });
    }, AUTOPLAY_INTERVAL);
  }, [images.length]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manejar autoplay - Con cleanup mejorado
  useEffect(() => {
    if (images.length > 1) {
      // Pequeño delay para evitar conflictos
      const timeoutId = setTimeout(() => {
        startAutoplay();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        stopAutoplay();
      };
    } else {
      stopAutoplay();
    }
  }, [images.length, startAutoplay, stopAutoplay]);

  // Cleanup cuando el componente se desmonte
  useEffect(() => {
    return () => {
      stopAutoplay();
    };
  }, [stopAutoplay]);

  // Navegación mejorada
  const goToSlide = (index) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      // Reiniciar autoplay después de navegación manual
      if (images.length > 1) {
        setTimeout(() => {
          startAutoplay();
        }, 100);
      }
    }
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    // Reiniciar autoplay
    if (images.length > 1) {
      setTimeout(() => {
        startAutoplay();
      }, 100);
    }
  };

  const goToNext = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    // Reiniciar autoplay
    if (images.length > 1) {
      setTimeout(() => {
        startAutoplay();
      }, 100);
    }
  };

  // Touch handlers para swipe - Con reinicio de autoplay
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    // Pausar autoplay durante swipe
    stopAutoplay();
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      // Reiniciar autoplay si no hubo swipe
      if (images.length > 1) {
        setTimeout(() => {
          startAutoplay();
        }, 100);
      }
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > TOUCH_MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -TOUCH_MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    } else {
      // No fue un swipe válido, reiniciar autoplay
      if (images.length > 1) {
        setTimeout(() => {
          startAutoplay();
        }, 100);
      }
    }
  };

  if (loading) {
    return (
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl animate-pulse flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base font-medium">Cargando contenido destacado...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div 
          className="relative bg-white rounded-xl shadow-xl overflow-hidden group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          
          {/* Contenedor principal de imágenes */}
          <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-blue-50 to-gray-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <img
                  src={images[currentIndex]}
                  alt={`Imagen destacada ${currentIndex + 1}`}
                  className="w-full h-full"
                  style={{
                    // Para móviles y tablets - asegurar que la imagen llene el espacio
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    // Forzar que siempre llene el contenedor
                    minWidth: '100%',
                    minHeight: '100%',
                    // En caso de imágenes muy anchas o altas, aplicar límites
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  loading="lazy"
                  onLoad={(e) => {
                    // Opcional: ajuste dinámico basado en la relación de aspecto
                    const img = e.target;
                    const containerAspectRatio = img.parentElement.offsetWidth / img.parentElement.offsetHeight;
                    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                    
                    if (imgAspectRatio > containerAspectRatio) {
                      // Imagen más ancha que el contenedor
                      img.style.objectFit = 'cover';
                      img.style.objectPosition = 'center center';
                    } else {
                      // Imagen más alta que el contenedor
                      img.style.objectFit = 'cover';
                      img.style.objectPosition = 'center top';
                    }
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('❌ BrandCarousel: Error loading image:', e.target.src);
                  }}
                />
                
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controles de navegación - Solo flechas */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg opacity-80 hover:opacity-100"
                aria-label="Imagen anterior"
              >
                <IoChevronBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg opacity-80 hover:opacity-100"
                aria-label="Imagen siguiente"
              >
                <IoChevronForward className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Indicadores de posición - Solo puntos */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-white scale-125 shadow-lg'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          )}
          
        </div>
      </div>
    </section>
  );
};

export default BrandCarousel;