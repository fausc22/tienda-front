import { IoMdArrowBack, IoMdArrowForward } from 'react-icons/io';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  loading = false 
}) => {
  // No mostrar paginador si hay una página o menos
  if (totalPages <= 1) return null;

  // Calcular rango de páginas a mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Máximo de páginas visibles en desktop
    const maxVisiblePagesMobile = 3; // Máximo en móvil
    
    // Determinar si estamos en móvil (esto es una aproximación, idealmente usarías un hook)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxVisible = isMobile ? maxVisiblePagesMobile : maxVisiblePages;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Ajustar si no hay suficientes páginas al final
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Agregar primera página y puntos suspensivos si es necesario
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Agregar páginas visibles
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Agregar puntos suspensivos y última página si es necesario
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== currentPage && page !== '...' && !loading) {
      onPageChange(page);
      // Scroll suave hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pages = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center space-y-4 mt-8 mb-6">
      
      {/* Información de resultados */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando <span className="font-medium text-gray-900">{startItem}</span> a{' '}
        <span className="font-medium text-gray-900">{endItem}</span> de{' '}
        <span className="font-medium text-gray-900">{totalItems}</span> resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        
        {/* Botón Anterior */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={`
            flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border transition-all duration-200
            ${currentPage === 1 || loading
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
            }
          `}
          aria-label="Página anterior"
        >
          <IoMdArrowBack className="text-sm sm:text-base" />
        </button>

        {/* Números de página */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page)}
              disabled={loading}
              className={`
                flex items-center justify-center min-w-[2rem] h-8 sm:min-w-[2.5rem] sm:h-10 px-2 sm:px-3 rounded-lg border transition-all duration-200 text-sm sm:text-base
                ${page === '...'
                  ? 'bg-white text-gray-400 border-gray-200 cursor-default'
                  : page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : loading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                }
              `}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className={`
            flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border transition-all duration-200
            ${currentPage === totalPages || loading
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
            }
          `}
          aria-label="Página siguiente"
        >
          <IoMdArrowForward className="text-sm sm:text-base" />
        </button>
      </div>

      {/* Información adicional solo en desktop */}
      <div className="hidden sm:block text-xs text-gray-500 text-center">
        Página {currentPage} de {totalPages}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default Pagination;