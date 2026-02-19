// components/search/SearchBar.jsx - Barra de búsqueda con sugerencias
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/button';
import { IoMdSearch, IoMdClose } from 'react-icons/io';
import { getProductImageURL, getPlaceholderImageURL } from '../../config/api';

const SearchBar = ({ 
  searchTerm, 
  setSearchTerm, 
  suggestions, 
  loading, 
  showSuggestions, 
  setShowSuggestions,
  onSelectSuggestion,
  onSearch,
  onClear 
}) => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 400 });

  // Cerrar dropdown cuando el input sale del viewport (pero permitir scroll dentro del dropdown)
  useEffect(() => {
    if (!showSuggestions) return;

    let scrollTimeout;
    const handleScroll = () => {
      // Debounce para evitar cerrar mientras se scrollea dentro del dropdown
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (inputRef.current && dropdownRef.current) {
          const inputRect = inputRef.current.getBoundingClientRect();
          const dropdownRect = dropdownRef.current.getBoundingClientRect();
          
          // Solo cerrar si el input está completamente fuera del viewport
          // y el dropdown también está fuera
          const isInputOutOfView = inputRect.bottom < 0 || inputRect.top > window.innerHeight;
          const isDropdownOutOfView = dropdownRect.bottom < 0 || dropdownRect.top > window.innerHeight;
          
          if (isInputOutOfView && isDropdownOutOfView) {
            setShowSuggestions(false);
          }
        }
      }, 150); // 150ms de debounce
    };

    // Solo escuchar scrolls en la ventana principal, no en elementos internos
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showSuggestions, setShowSuggestions]);

  // Actualizar posición del dropdown cuando se muestra - con ajustes para evitar cortes
  useEffect(() => {
    const updatePosition = () => {
      if (inputRef.current && showSuggestions) {
        const rect = inputRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Altura máxima del dropdown (ajustada para mobile y desktop)
        const maxDropdownHeight = Math.min(400, viewportHeight * 0.6); // 60% de la altura de la ventana o 400px, lo que sea menor
        
        // Calcular posición vertical
        let top = rect.bottom + window.scrollY;
        let maxHeight = maxDropdownHeight;
        
        // Si no hay suficiente espacio abajo, mostrar arriba
        if (spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow) {
          top = rect.top + window.scrollY - maxDropdownHeight;
          maxHeight = Math.min(maxDropdownHeight, spaceAbove - 20); // 20px de margen
        } else {
          maxHeight = Math.min(maxDropdownHeight, spaceBelow - 20); // 20px de margen
        }
        
        // Ajustar ancho para mobile (con márgenes)
        let left = rect.left + window.scrollX;
        let width = rect.width;
        const margin = 16; // 16px de margen en mobile
        
        // En mobile, asegurar que no se salga de la pantalla
        if (viewportWidth < 640) {
          if (left < margin) {
            left = margin;
            width = viewportWidth - (margin * 2);
          } else if (left + width > viewportWidth - margin) {
            width = viewportWidth - left - margin;
          }
        }
        
        setDropdownPosition({
          top,
          left,
          width,
          maxHeight
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showSuggestions]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      setShowSuggestions(false);
      onSearch();
    }
  };

  return (
    <>
      <form ref={containerRef} onSubmit={handleSubmit} className="relative flex-1 w-full min-w-0">
        <div className="flex gap-2 w-full">
          {/* Input de búsqueda */}
          <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              // Mostrar sugerencias SIEMPRE si hay término de búsqueda válido (>= 2 caracteres)
              // Esto funciona independientemente de si hay categoría seleccionada o sugerencias cargadas
              if (searchTerm.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 pr-10 sm:pr-12 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base md:text-lg font-medium shadow-sm focus:shadow-md"
          />
          <IoMdSearch className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg sm:text-xl pointer-events-none" />
        </div>

        {/* Botón buscar */}
        <Button
          type="submit"
          color="primary"
          disabled={!searchTerm.trim() || searchTerm.length < 2 || loading}
          isLoading={loading}
          className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 font-medium text-sm sm:text-base min-w-[44px] sm:min-w-auto"
        >
          <span className="hidden sm:inline">Buscar</span>
          <IoMdSearch className="sm:hidden text-lg" />
        </Button>

        {/* Botón limpiar */}
        {searchTerm && (
          <Button
            type="button"
            variant="flat"
            color="danger"
            onClick={onClear}
            className="px-2.5 sm:px-3 md:px-4 py-2.5 sm:py-3 min-w-[44px] sm:min-w-auto"
            aria-label="Limpiar búsqueda"
          >
            <IoMdClose className="text-lg sm:text-xl" />
          </Button>
        )}
        </div>
      </form>

      {/* Dropdown de sugerencias - FUERA del form para mejor posicionamiento */}
      <AnimatePresence>
        {showSuggestions && searchTerm.length >= 2 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[9999] bg-white border-2 border-t-0 border-blue-200 rounded-b-lg shadow-2xl overflow-hidden flex flex-col"
            style={{ 
              maxHeight: `${dropdownPosition.maxHeight || 400}px`,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del dropdown */}
            <div className="sticky top-0 bg-blue-50 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 border-b-2 border-blue-200 z-10 flex items-center justify-between flex-shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-blue-700 truncate flex-1 min-w-0">
                {loading ? 'Buscando...' : suggestions.length > 0 
                  ? `${suggestions.length} sugerencia${suggestions.length !== 1 ? 's' : ''} encontrada${suggestions.length !== 1 ? 's' : ''}`
                  : 'No se encontraron sugerencias'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  onClear();
                }}
                className="ml-2 p-1.5 sm:p-2 rounded-full hover:bg-red-100 active:bg-red-200 transition-colors duration-200 flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Limpiar búsqueda"
              >
                <IoMdClose className="text-red-600 text-base sm:text-lg font-bold" />
              </button>
            </div>

            {/* Lista de sugerencias - con scroll interno */}
            <div className="overflow-y-auto overflow-x-hidden flex-1" style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}>
              {suggestions.length > 0 ? suggestions.map((product, index) => (
                <motion.div
                  key={`${product.CODIGO_BARRA}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => onSelectSuggestion(product)}
                  className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 touch-manipulation"
                  whileHover={{ backgroundColor: '#eff6ff' }}
                  whileTap={{ scale: 0.98, backgroundColor: '#dbeafe' }}
                >
                  {/* Imagen del producto */}
                  <motion.div
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                  >
                    <img
                      src={getProductImageURL(product.CODIGO_BARRA)}
                      alt={product.art_desc_vta || 'Producto'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = getPlaceholderImageURL();
                      }}
                    />
                  </motion.div>

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                    <h4 className="text-xs sm:text-sm md:text-base font-medium text-gray-900 mb-1 sm:mb-1.5 line-clamp-2 break-words">
                      {product.art_desc_vta || 'Producto sin nombre'}
                    </h4>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-blue-600 truncate">
                      ${typeof product.PRECIO === 'number' 
                        ? product.PRECIO.toFixed(2) 
                        : parseFloat(product.PRECIO || 0).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )) : (
                <div className="px-3 sm:px-4 py-6 sm:py-8 text-center">
                  <p className="text-xs sm:text-sm text-gray-500 break-words px-2">
                    No se encontraron productos con &quot;{searchTerm}&quot;
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </div>

            {/* Footer con acción - Solo si hay sugerencias */}
            {suggestions.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 border-t border-gray-200 z-10 flex-shrink-0">
              <motion.button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  onSearch();
                }}
                className="text-xs sm:text-sm md:text-base text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium w-full text-left py-1 sm:py-1.5 touch-manipulation"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                Ver todos los resultados →
              </motion.button>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchBar;