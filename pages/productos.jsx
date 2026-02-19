import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@heroui/button';
import { IoMdClose, IoMdMenu, IoMdFunnel } from 'react-icons/io';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/search/SearchBar';
import { useInstantSearch } from '../hooks/useProductSearch';
import apiClient, { getFaviconURL } from '../config/api';

const Products = () => {
  // 🆕 Hook de búsqueda instantánea
  const {
    searchTerm,
    setSearchTerm,
    suggestions,
    results: searchResults,
    loading: isSearching,
    showSuggestions,
    setShowSuggestions,
    pagination: searchPagination,
    hasSearched,
    handleSelectSuggestion,
    executeFullSearch,
    clearSearch
  } = useInstantSearch();

  // Estados de productos principales
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de categorías
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isLoadingCategoryProducts, setIsLoadingCategoryProducts] = useState(false);
  
  // Estados de rubros
  const [rubros, setRubros] = useState([]);
  const [selectedRubro, setSelectedRubro] = useState(null);
  const [loadingRubros, setLoadingRubros] = useState(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 30,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Estados de UI móvil
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  
  const { config } = useConfig();

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/store/categorias');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Cargar productos principales al montar y cuando cambie la página
  // IMPORTANTE: No recargar cuando solo hay sugerencias (pre-resultados) o cuando se está escribiendo
  useEffect(() => {
    // Solo recargar si:
    // 1. NO hay búsqueda completa activa (hasSearched es false)
    // 2. NO hay categoría seleccionada
    // 3. NO hay término de búsqueda activo (solo sugerencias, no búsqueda completa)
    // 4. El término de búsqueda está vacío o tiene menos de 2 caracteres (para evitar recargas al escribir)
    const shouldReload = !hasSearched && !selectedCategory && (!searchTerm || searchTerm.trim().length < 2);
    
    if (shouldReload) {
      fetchMainProducts(currentPage);
    }
  }, [currentPage, hasSearched, selectedCategory, searchTerm]);

  // Función para obtener productos principales
  const fetchMainProducts = async (page = 1) => {
    setLoading(true);
    try {
      console.log('📦 Obteniendo productos principales - página:', page);
      
      const url = `/store/productosMAIN/${page}/30`;
      console.log('🌐 URL productos principales:', url);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Respuesta productos principales:', {
        status: response.status,
        dataLength: response.data?.data?.length || 0,
        pagination: response.data?.pagination
      });
      
      setAllProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('❌ Error obteniendo productos principales:', error);
      setAllProducts([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  // Determinar qué productos mostrar
  // IMPORTANTE: Solo mostrar resultados de búsqueda completa si hasSearched es true
  // Si solo hay sugerencias (pre-resultados), NO cambiar los productos mostrados
  const displayProducts = () => {
    // Solo mostrar resultados de búsqueda si se ejecutó una búsqueda completa
    if (hasSearched) return searchResults;
    if (selectedCategory || selectedRubro) return categoryProducts;
    return allProducts;
  };

  // Determinar qué información de paginación usar
  const getCurrentPagination = () => {
    if (hasSearched) return searchPagination;
    if (selectedCategory) return pagination;
    return pagination;
  };

  // 🆕 Función de búsqueda completa
  const handleSearch = () => {
    if (searchTerm.trim().length < 2) return;
    // No limpiar categoría, pero ocultar rubros durante búsqueda
    setSelectedRubro(null);
    setCurrentPage(1);
    executeFullSearch(searchTerm, 1);
  };

  // 🆕 Función para limpiar TODOS los filtros (búsqueda, categoría, rubro)
  const handleReset = () => {
    clearSearch();
    setSelectedCategory(null);
    setSelectedRubro(null); // ✅ Limpiar rubro
    setRubros([]); // ✅ Limpiar lista de rubros
    setCategoryProducts([]);
    setShowCategoriesMenu(false); // ✅ Cerrar menú móvil si está abierto
    setCurrentPage(1);
    fetchMainProducts(1);
  };

  // Función para cargar rubros de un depto
  const fetchRubros = async (deptoName) => {
    if (!deptoName) {
      setRubros([]);
      return;
    }
    
    setLoadingRubros(true);
    try {
      const encodedDeptoName = encodeURIComponent(deptoName);
      const response = await apiClient.get(`/store/rubros/${encodedDeptoName}`);
      setRubros(response.data || []);
    } catch (error) {
      console.error('Error obteniendo rubros:', error);
      setRubros([]);
    } finally {
      setLoadingRubros(false);
    }
  };

  // Función para seleccionar categoría
  const handleSelectCategory = async (categoryName, page = 1) => {
    console.log('🏷️ Seleccionando categoría:', {
      categoryName: categoryName,
      page: page
    });
    
    setIsLoadingCategoryProducts(true);
    setSelectedCategory(categoryName);
    setSelectedRubro(null); // Limpiar rubro seleccionado
    clearSearch(); // 🆕 Limpiar búsqueda al seleccionar categoría
    setShowCategoriesMenu(false);
    setCurrentPage(page);

    try {
      const encodedCategoryName = encodeURIComponent(categoryName);
      const url = `/store/articulos/${encodedCategoryName}/${page}/30`;
      
      console.log('🌐 URL de categoría (path params):', url);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Respuesta de categoría:', {
        status: response.status,
        dataLength: response.data?.data?.length || 0,
        pagination: response.data?.pagination,
        currentPage: response.data?.pagination?.currentPage,
        totalPages: response.data?.pagination?.totalPages
      });
      
      setCategoryProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
      
      // Cargar rubros del depto seleccionado
      await fetchRubros(categoryName);
      
    } catch (error) {
      console.error('❌ Error obteniendo categoría:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        categoryName: categoryName,
        page: page,
        url: `/store/articulos/${encodeURIComponent(categoryName)}/${page}/30`
      });
      
      // Fallback con query parameters
      try {
        console.log('🔄 Intentando con query parameters como fallback...');
        const fallbackUrl = `/store/articulos/${encodeURIComponent(categoryName)}`;
        const fallbackResponse = await apiClient.get(fallbackUrl, { 
          params: { page: page.toString(), limit: '30' } 
        });
        
        console.log('✅ Fallback exitoso:', fallbackResponse.data);
        setCategoryProducts(fallbackResponse.data.data || []);
        setPagination(fallbackResponse.data.pagination || {});
        
      } catch (fallbackError) {
        console.error('❌ Error en fallback también:', fallbackError);
        setCategoryProducts([]);
        setPagination({});
      }
    } finally {
      setIsLoadingCategoryProducts(false);
    }
  };

  // Función para seleccionar rubro
  const handleSelectRubro = async (rubroName, page = 1) => {
    console.log('🏷️ Seleccionando rubro:', {
      rubroName: rubroName,
      page: page
    });
    
    setIsLoadingCategoryProducts(true);
    setSelectedRubro(rubroName);
    clearSearch();
    setCurrentPage(page);

    try {
      const encodedRubroName = encodeURIComponent(rubroName);
      const url = `/store/rubro/${encodedRubroName}/${page}/30`;
      
      const response = await apiClient.get(url);
      
      setCategoryProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
      
    } catch (error) {
      console.error('❌ Error obteniendo rubro:', error);
      setCategoryProducts([]);
      setPagination({});
    } finally {
      setIsLoadingCategoryProducts(false);
    }
  };

  // Función para mostrar todos los productos
  const handleShowAll = () => {
    setSelectedCategory(null);
    setSelectedRubro(null);
    setRubros([]);
    setCategoryProducts([]);
    clearSearch(); // 🆕 Limpiar búsqueda
    setShowCategoriesMenu(false);
    setCurrentPage(1);
    fetchMainProducts(1);
  };

  // 🆕 Manejar cambio de página actualizado
  const handlePageChange = (page) => {
    console.log('📄 Cambiando a página:', {
      currentPage: currentPage,
      newPage: page,
      hasSearched: hasSearched,
      selectedCategory: selectedCategory,
      searchTerm: searchTerm?.trim()
    });
    
    setCurrentPage(page);
    
    if (hasSearched && searchTerm?.trim()) {
      console.log('🔍 Paginación de búsqueda');
      executeFullSearch(searchTerm, page);
    } else if (selectedRubro) {
      console.log('🏷️ Paginación de rubro:', selectedRubro);
      handleSelectRubro(selectedRubro, page);
    } else if (selectedCategory) {
      console.log('🏷️ Paginación de categoría:', selectedCategory);
      handleSelectCategory(selectedCategory, page);
    } else {
      console.log('📦 Paginación de productos principales');
      fetchMainProducts(page);
    }
  };

  const currentProducts = displayProducts();
  const currentPagination = getCurrentPagination();
  const isLoading = loading || isSearching || isLoadingCategoryProducts;

  return (
    <>
      <Head>
        <title>{config?.storeName ? `PRODUCTOS - ${config.storeName}` : 'PRODUCTOS - TIENDA'}</title>
        <link rel="icon" type="image/x-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <link rel="shortcut icon" type="image/x-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <link rel="apple-touch-icon" href="https://mycarrito.com.ar/api/images/favicon-tienda.ico?v=1" />
        <meta name="description" content="Explora nuestro catálogo de productos" />
      </Head>

      <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
        <div className="flex min-w-0">
          
          {/* Sidebar de Categorías - Desktop con animación */}
          <aside className="hidden lg:block w-64 bg-white shadow-lg fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-30 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-bold text-gray-900 mb-4"
              >
                CATEGORIAS
              </motion.h3>
              
              {/* Botón "Todos los productos" */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleShowAll}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors duration-200 ${
                  !selectedCategory && !hasSearched
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                Todos los productos
              </motion.button>

              {/* Lista de categorías */}
              {loadingCategories ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-10 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.NOM_CLASIF}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (index * 0.05), duration: 0.3 }}
                      onClick={() => handleSelectCategory(category.NOM_CLASIF, 1)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                        selectedCategory === category.NOM_CLASIF
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {category.NOM_CLASIF}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Lista de Rubros con Tabs (desktop, cuando hay categoría seleccionada) */}
              {selectedCategory && (
                <div className="mt-6 pt-6 border-t border-gray-200 w-full max-w-full overflow-hidden">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Rubros de {selectedCategory}</h4>
                  {loadingRubros ? (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 w-24 bg-gray-200 rounded-t-lg animate-pulse flex-shrink-0"></div>
                      ))}
                    </div>
                  ) : rubros.length > 0 ? (
                    <div className="w-full overflow-hidden">
                      <div className="border-b border-gray-200">
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide scroll-horizontal pb-1 -mb-px">
                          <button
                            onClick={() => {
                              setSelectedRubro(null);
                              handleSelectCategory(selectedCategory, 1);
                            }}
                            className={`px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border-b-2 ${
                              !selectedRubro
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-300'
                            }`}
                          >
                            Todos
                          </button>
                          {rubros.map((rubro) => (
                            <button
                              key={rubro.NOM_CLASIF}
                              onClick={() => handleSelectRubro(rubro.NOM_CLASIF, 1)}
                              className={`px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border-b-2 ${
                                selectedRubro === rubro.NOM_CLASIF
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-300'
                              }`}
                            >
                              {rubro.NOM_CLASIF}
                              <span className="ml-1.5 text-xs opacity-75">
                                ({rubro.cantidad_productos || 0})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay rubros disponibles</p>
                  )}
                </div>
              )}
            </motion.div>
          </aside>

          {/* Contenido Principal */}
          <main className="flex-1 lg:ml-64 min-w-0 overflow-x-hidden relative z-0">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
              
              {/* Header */}
              <div className="mb-4 sm:mb-6 lg:mb-8 w-full max-w-full overflow-hidden">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-center lg:text-left">
                  Productos
                </h1>
                <div className="w-12 sm:w-16 md:w-20 lg:w-24 h-0.5 bg-blue-600 mx-auto lg:mx-0 mb-4 sm:mb-6"></div>

                {/* 🎯 SECCIÓN DE BÚSQUEDA - PRIORIDAD MÁXIMA - PERO DEBAJO DEL MENÚ MÓVIL */}
                <div className={`mb-6 sm:mb-8 w-full relative ${showCategoriesMenu ? 'z-40' : 'z-[9998]'}`}>
                  {/* Botón de categorías - Solo móvil */}
                  <div className="mb-3 sm:mb-4 relative">
                    <motion.button
                      onClick={() => setShowCategoriesMenu(true)}
                      className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IoMdFunnel className="text-lg" />
                      <span>CATEGORIAS</span>
                      {selectedCategory && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs bg-blue-800 px-2 py-1 rounded-full"
                        >
                          {selectedCategory.length > 12 ? `${selectedCategory.substring(0, 12)}...` : selectedCategory}
                        </motion.span>
                      )}
                    </motion.button>
                  </div>

                  {/* 🆕 Componente SearchBar con sugerencias - HERRAMIENTA PRINCIPAL */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <SearchBar
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      suggestions={suggestions}
                      loading={isSearching}
                      showSuggestions={showSuggestions}
                      setShowSuggestions={setShowSuggestions}
                      onSelectSuggestion={handleSelectSuggestion}
                      onSearch={handleSearch}
                      onClear={handleReset}
                    />
                  </motion.div>
                </div>

                {/* Sección de Rubros con Tabs - SECUNDARIA (solo cuando hay categoría seleccionada y NO hay búsqueda activa) */}
                <AnimatePresence>
                  {selectedCategory && !hasSearched && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 sm:mb-8 w-full max-w-full overflow-hidden"
                    >
                      <div className="border-b border-gray-200 w-full overflow-hidden">
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide scroll-horizontal pb-1 -mb-px" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {loadingRubros ? (
                          <div className="flex gap-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-10 w-32 bg-gray-200 rounded-t-lg animate-pulse flex-shrink-0"></div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <motion.button
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                setSelectedRubro(null);
                                handleSelectCategory(selectedCategory, 1);
                              }}
                              className={`px-3 sm:px-4 py-2 rounded-t-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 ${
                                !selectedRubro
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-300'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Todos
                            </motion.button>
                            {rubros.map((rubro, index) => (
                              <motion.button
                                key={rubro.NOM_CLASIF}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectRubro(rubro.NOM_CLASIF, 1)}
                                className={`px-3 sm:px-4 py-2 rounded-t-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 ${
                                  selectedRubro === rubro.NOM_CLASIF
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-300'
                                }`}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {rubro.NOM_CLASIF}
                                <span className="ml-1.5 text-xs opacity-75">
                                  ({rubro.cantidad_productos || 0})
                                </span>
                              </motion.button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* Indicadores de filtro activo con animación */}
                <AnimatePresence>
                  {(hasSearched || selectedCategory || selectedRubro) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2"
                    >
                      {/* Badge de búsqueda + Botón cerrar - PRIORIDAD MÁXIMA */}
                      {hasSearched && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="inline-flex items-center gap-2"
                        >
                          {/* Badge de búsqueda (sin botón) */}
                          <motion.span
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            <span className="font-medium">
                              Búsqueda: &quot;{searchTerm}&quot;
                            </span>
                          </motion.span>

                          {/* Botón X separado */}
                          <motion.button
                            onClick={() => {
                              clearSearch();
                              // Si hay categoría seleccionada, mantenerla pero recargar productos
                              if (selectedCategory) {
                                handleSelectCategory(selectedCategory, 1);
                              } else {
                                // Si no hay categoría, limpiar todo y mostrar todos los productos
                                setSelectedRubro(null);
                                setRubros([]);
                                setCategoryProducts([]);
                                setCurrentPage(1);
                                fetchMainProducts(1);
                              }
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors group"
                            aria-label="Quitar búsqueda"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IoMdClose className="text-lg" />
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Badge de categoría + Botón cerrar */}
                      {selectedCategory && !hasSearched && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="inline-flex items-center gap-2"
                        >
                          {/* Badge de categoría (sin botón) */}
                          <motion.span
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
                          >
                            <span className="font-medium">
                              Categoría: {selectedCategory}
                            </span>
                          </motion.span>

                          {/* Botón X separado */}
                          <motion.button
                            onClick={() => {
                              setSelectedCategory(null);
                              setSelectedRubro(null);
                              setRubros([]);
                              setCategoryProducts([]);
                              setCurrentPage(1);
                              // Si hay búsqueda activa, mantenerla; si no, mostrar todos los productos
                              if (hasSearched && searchTerm.trim().length >= 2) {
                                executeFullSearch(searchTerm, 1);
                              } else {
                                clearSearch(); // Limpiar también la búsqueda si no hay término válido
                                fetchMainProducts(1);
                              }
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors group"
                            aria-label="Quitar categoría"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IoMdClose className="text-lg" />
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Badge de rubro + Botón cerrar */}
                      {selectedRubro && !hasSearched && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="inline-flex items-center gap-2"
                        >
                          {/* Badge de rubro */}
                          <motion.span
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            <span className="font-medium">
                              Rubro: {selectedRubro}
                            </span>
                          </motion.span>

                          {/* Botón X separado */}
                          <motion.button
                            onClick={() => {
                              setSelectedRubro(null);
                              // Si hay categoría seleccionada, recargar productos de esa categoría
                              if (selectedCategory) {
                                handleSelectCategory(selectedCategory, 1);
                              } else {
                                // Si no hay categoría, limpiar todo y mostrar todos los productos
                                setCategoryProducts([]);
                                clearSearch();
                                setCurrentPage(1);
                                fetchMainProducts(1);
                              }
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors group"
                            aria-label="Quitar rubro"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IoMdClose className="text-lg" />
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Botón "Limpiar todo" (solo si hay más de un filtro) */}
                      {((hasSearched && selectedCategory) || (hasSearched && selectedRubro) || (selectedCategory && selectedRubro)) && (
                        <motion.button
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={handleReset}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 border border-red-600 transition-colors shadow-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IoMdClose className="text-base" />
                          <span>Limpiar todo</span>
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Grid de Productos */}
              <AnimatePresence mode="wait" key="productos">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                    />
                    <p className="text-gray-600">
                      {isSearching ? 'Buscando productos...' : 
                       isLoadingCategoryProducts ? 'Cargando categoría...' : 
                       'Cargando productos...'}
                    </p>
                  </motion.div>
                ) : currentProducts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="mb-4"
                    >
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {hasSearched ? 'No se encontraron productos' : 
                       selectedCategory ? 'No hay productos en esta categoría' : 
                       'No hay productos disponibles'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {hasSearched 
                        ? 'Intenta con otro término de búsqueda' 
                        : selectedCategory
                        ? 'Prueba con otra categoría'
                        : 'Vuelve más tarde para ver nuestros productos'
                      }
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={handleReset} variant="bordered">
                        {hasSearched || selectedCategory ? 'Ver todos los productos' : 'Recargar'}
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                <>
                  {/* Grid de productos con animación */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 relative z-0"
                  >
                    {currentProducts.map((producto, index) => (
                      <motion.div
                        key={`${producto.CODIGO_BARRA}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <CardProduct
                          name={producto.art_desc_vta}
                          price={producto.PRECIO}
                          imageUrl={producto.CODIGO_BARRA}
                          cod_interno={producto.COD_INTERNO}
                          stock={producto.STOCK}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Componente de Paginación */}
                  <Pagination
                    currentPage={currentPagination.currentPage || 1}
                    totalPages={currentPagination.totalPages || 1}
                    totalItems={currentPagination.totalItems || 0}
                    itemsPerPage={currentPagination.itemsPerPage || 30}
                    onPageChange={handlePageChange}
                    loading={isLoading}
                  />
                </>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Overlay para menú móvil con animación */}
        <AnimatePresence>
          {showCategoriesMenu && (
            <>
              {/* Overlay con fade */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[55]"
                onClick={() => setShowCategoriesMenu(false)}
              />
              
              {/* Menú de categorías móvil con animación de deslizamiento */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto z-[60]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del menú */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10"
                >
                  <h3 className="text-lg font-bold text-gray-900">CATEGORIAS</h3>
                  <motion.button
                    onClick={() => setShowCategoriesMenu(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IoMdClose className="text-xl text-gray-600" />
                  </motion.button>
                </motion.div>

                {/* Contenido del menú */}
                <div className="p-4">
                  {/* Botón "Todos los productos" */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={handleShowAll}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-3 transition-colors duration-200 ${
                      !selectedCategory && !hasSearched
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Todos los productos
                  </motion.button>

                  {/* Lista de categorías */}
                  {loadingCategories ? (
                    <div className="space-y-2">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="h-12 bg-gray-200 rounded animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category, index) => (
                        <motion.button
                          key={category.NOM_CLASIF}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + (index * 0.05), duration: 0.3 }}
                          onClick={() => handleSelectCategory(category.NOM_CLASIF, 1)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                            selectedCategory === category.NOM_CLASIF
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          whileHover={{ x: 4, backgroundColor: selectedCategory === category.NOM_CLASIF ? '#2563eb' : '#f3f4f6' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {category.NOM_CLASIF}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        

        <WhatsAppButton />
      </div>
    </>
  );
};

export default Products;