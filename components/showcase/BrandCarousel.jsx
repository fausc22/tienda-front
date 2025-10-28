import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronBack, IoChevronForward, IoPlayCircle, IoPauseCircle } from 'react-icons/io5';
import apiClient, { getApiBaseURL } from '../../config/api';

const BrandCarousel = () => {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);

  const AUTOPLAY_INTERVAL_IMAGES = 5000; // 5 segundos para imágenes

  // ✅ Función para detectar si es video
  const esVideo = (url) => {
    return /\.(mp4|webm|mov)$/i.test(url);
  };

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('🎨 BrandCarousel: Cargando media destacado...');
        }

        const response = await apiClient.get('/store/getShowcase');
        
        if (response.data && response.data.length > 0) {
          const mediaUrls = response.data.map(url => {
            const tipoDetectado = esVideo(url) ? 'video' : 'imagen';
            
            return {
              url: `${getApiBaseURL()}${url}`,
              tipo: tipoDetectado
            };
          });
          
          setMedia(mediaUrls);

          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('✅ BrandCarousel: Media cargado:', mediaUrls);
          }
        } else {
          console.warn('⚠️ No hay media en la respuesta');
          setMedia([]);
        }
        
      } catch (error) {
        console.error('❌ BrandCarousel: Error al cargar media:', error);
        setMedia([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  // ✅ NUEVO: Control de autoplay que respeta la duración de videos
  const startAutoplay = useCallback(() => {
    if (media.length <= 1) return;
    
    // Limpiar cualquier intervalo previo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const currentMedia = media[currentIndex];
    
    // Si es un video, NO iniciar timer automático
    // El video manejará su propia transición con onEnded
    if (currentMedia?.tipo === 'video') {
      console.log('🎬 Video actual, esperando a que termine...');
      return;
    }
    
    // Si es imagen, usar timer normal
    console.log(`🖼️ Imagen actual, timer: ${AUTOPLAY_INTERVAL_IMAGES}ms`);
    intervalRef.current = setInterval(() => {
      goToNext();
    }, AUTOPLAY_INTERVAL_IMAGES);
    
  }, [media, currentIndex]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ✅ MEJORADO: Cuando un video termina, avanza automáticamente
  const handleVideoEnded = () => {
    console.log('🎬 Video terminado, avanzando automáticamente...');
    goToNext();
  };

  // Pausar/reproducir video manualmente
  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  // ✅ MEJORADO: Gestión inteligente del autoplay
  useEffect(() => {
    if (media.length <= 1) {
      stopAutoplay();
      return;
    }

    const currentMedia = media[currentIndex];
    
    if (currentMedia?.tipo === 'video') {
      // Para videos: detener timer y dejar que el video maneje su reproducción
      stopAutoplay();
      
      // Intentar reproducir el video
      if (videoRef.current) {
        videoRef.current.play()
          .then(() => {
            console.log('▶️ Video reproduciéndose');
            setIsVideoPlaying(true);
          })
          .catch(err => {
            console.warn('⚠️ No se pudo reproducir automáticamente:', err);
            setIsVideoPlaying(false);
          });
      }
    } else {
      // Para imágenes: iniciar timer con delay pequeño
      const timeoutId = setTimeout(() => {
        startAutoplay();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentIndex, media, startAutoplay, stopAutoplay]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopAutoplay();
    };
  }, [stopAutoplay]);

  const goToSlide = (index) => {
    if (index >= 0 && index < media.length) {
      stopAutoplay();
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    stopAutoplay();
    const newIndex = currentIndex === 0 ? media.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    stopAutoplay();
    const newIndex = currentIndex === media.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // Touch handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    stopAutoplay();
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const TOUCH_MIN_SWIPE_DISTANCE = 50;
    
    if (distance > TOUCH_MIN_SWIPE_DISTANCE) {
      goToNext();
    } else if (distance < -TOUCH_MIN_SWIPE_DISTANCE) {
      goToPrevious();
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

  if (media.length === 0) {
    return null;
  }

  const currentMedia = media[currentIndex];

  return (
    <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div 
          className="relative bg-white rounded-xl shadow-xl overflow-hidden group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          
          {/* Contenedor principal de media */}
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
                {currentMedia.tipo === 'video' ? (
                  <video
                  ref={videoRef}
                  src={currentMedia.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"  // ← AGREGAR ESTO
                  onEnded={handleVideoEnded}
                  onError={(e) => {
                    console.error('❌ Error loading video:', currentMedia.url);
                    console.error('❌ Error event:', e);  // ← AGREGAR ESTO
                  }}
  
                />
                ) : (
                  <img
                    src={currentMedia.url}
                    alt={`Contenido destacado ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('❌ Error loading image:', e.target.src);
                    }}
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>

            {/* Botón de play/pause para videos */}
            {currentMedia.tipo === 'video' && (
              <button
                onClick={toggleVideoPlayback}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg z-10"
                aria-label={isVideoPlaying ? "Pausar video" : "Reproducir video"}
              >
                {isVideoPlaying ? (
                  <IoPauseCircle className="w-6 h-6" />
                ) : (
                  <IoPlayCircle className="w-6 h-6" />
                )}
              </button>
            )}
          </div>

          {/* Controles de navegación */}
          {media.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg opacity-80 hover:opacity-100"
                aria-label="Anterior"
              >
                <IoChevronBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg opacity-80 hover:opacity-100"
                aria-label="Siguiente"
              >
                <IoChevronForward className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Indicadores de posición */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {media.map((item, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? 'bg-white scale-125 shadow-lg w-3 h-3 sm:w-4 sm:h-4'
                      : 'bg-white/50 hover:bg-white/75 w-2 h-2 sm:w-3 sm:h-3'
                  }`}
                  aria-label={`Ir a ${item.tipo} ${index + 1}`}
                  title={item.tipo === 'video' ? '📹 Video' : '🖼️ Imagen'}
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