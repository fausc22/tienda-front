// components/search/SearchBar.jsx - Barra de búsqueda con sugerencias
import { useRef, useEffect } from 'react';
import { Button } from '@heroui/button';
import { IoMdSearch, IoMdClose } from 'react-icons/io';

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
    <form onSubmit={handleSubmit} className="relative flex-1">
      <div className="flex gap-2">
        {/* Input de búsqueda */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
          />
          <IoMdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl pointer-events-none" />
          
          {/* Dropdown de sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              {/* Header del dropdown */}
              <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-600">
                  {loading ? 'Buscando...' : `${suggestions.length} sugerencias`}
                </span>
              </div>

              {/* Lista de sugerencias */}
              {suggestions.map((product, index) => (
                <div
                  key={`${product.CODIGO_BARRA}-${index}`}
                  onClick={() => onSelectSuggestion(product)}
                  className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                >
                  {/* Imagen del producto */}
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={`https://vps-5234411-x.dattaweb.com/api/images/products/${product.CODIGO_BARRA}.png`}
                      alt={product.art_desc_vta}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';
                      }}
                    />
                  </div>

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                      {product.art_desc_vta}
                    </h4>
                    <p className="text-sm font-semibold text-blue-600">
                      ${parseFloat(product.PRECIO).toFixed(2)}
                    </p>
                  </div>

                 
                </div>
              ))}

              {/* Footer con acción */}
              <div className="sticky bottom-0 bg-gray-50 px-4 py-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    onSearch();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos los resultados →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botón buscar */}
        <Button
          type="submit"
          color="primary"
          disabled={!searchTerm.trim() || searchTerm.length < 2 || loading}
          isLoading={loading}
          className="px-6 py-3 font-medium"
        >
          <span className="hidden sm:inline">Buscar</span>
          <IoMdSearch className="sm:hidden text-xl" />
        </Button>

        {/* Botón limpiar */}
        {searchTerm && (
          <Button
            type="button"
            variant="flat"
            color="danger"
            onClick={onClear}
            className="px-4 py-3"
          >
            <IoMdClose className="text-xl" />
          </Button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;