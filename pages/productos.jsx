import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@heroui/button';
import { IoMdClose, IoMdMenu, IoMdFunnel } from 'react-icons/io';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/search/SearchBar';
import { useInstantSearch } from '../hooks/useProductSearch';
import apiClient from '../config/api';

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
  useEffect(() => {
    if (!hasSearched && !selectedCategory) {
      fetchMainProducts(currentPage);
    }
  }, [currentPage, hasSearched, selectedCategory]);

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
  const displayProducts = () => {
    if (hasSearched) return searchResults;
    if (selectedCategory) return categoryProducts;
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
    setSelectedCategory(null);
    setCategoryProducts([]);
    setCurrentPage(1);
    executeFullSearch(searchTerm, 1);
  };

  // 🆕 Función para limpiar búsqueda
  const handleReset = () => {
    clearSearch();
    setSelectedCategory(null);
    setCategoryProducts([]);
    setCurrentPage(1);
    fetchMainProducts(1);
  };

  // Función para seleccionar categoría
  const handleSelectCategory = async (categoryName, page = 1) => {
    console.log('🏷️ Seleccionando categoría:', {
      categoryName: categoryName,
      page: page
    });
    
    setIsLoadingCategoryProducts(true);
    setSelectedCategory(categoryName);
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

  // Función para mostrar todos los productos
  const handleShowAll = () => {
    setSelectedCategory(null);
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
        <link rel="icon" href="https://vps-5234411-x.dattaweb.com/api/images/favicon-tienda.ico" />
        <meta name="description" content="Explora nuestro catálogo de productos" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          
          {/* Sidebar de Categorías - Desktop */}
          <aside className="hidden lg:block w-64 bg-white shadow-lg fixed left-0 top-16 h-full overflow-y-auto z-30">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Categorías</h3>
              
              {/* Botón "Todos los productos" */}
              <button
                onClick={handleShowAll}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors duration-200 ${
                  !selectedCategory && !hasSearched
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos los productos
              </button>

              {/* Lista de categorías */}
              {loadingCategories ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.NOM_CLASIF}
                      onClick={() => handleSelectCategory(category.NOM_CLASIF, 1)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                        selectedCategory === category.NOM_CLASIF
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.NOM_CLASIF}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Contenido Principal */}
          <main className="flex-1 lg:ml-64">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              
              {/* Header */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center lg:text-left">
                  Productos
                </h1>
                <div className="w-16 sm:w-20 md:w-24 h-0.5 bg-blue-600 mx-auto lg:mx-0 mb-6"></div>

                {/* 🆕 Controles de búsqueda y filtros con nuevo SearchBar */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  
                  {/* Botón de categorías - Solo móvil */}
                  <button
                    onClick={() => setShowCategoriesMenu(true)}
                    className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <IoMdFunnel className="text-lg" />
                    Categorías
                    {selectedCategory && (
                      <span className="text-xs bg-blue-800 px-2 py-1 rounded-full">
                        {selectedCategory.length > 15 ? `${selectedCategory.substring(0, 15)}...` : selectedCategory}
                      </span>
                    )}
                  </button>

                  {/* 🆕 Nuevo componente SearchBar con sugerencias */}
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
                </div>

                {/* Indicador de filtro activo */}
                {/* Indicador de filtro activo */}
{(hasSearched || selectedCategory) && (
  <div className="mt-4 flex flex-wrap items-center gap-2">
    {/* Badge de búsqueda + Botón cerrar */}
    {hasSearched && (
      <div className="inline-flex items-center gap-2">
        {/* Badge de búsqueda (sin botón) */}
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
          <span className="font-medium">
            Búsqueda: &quot;{searchTerm}&quot;
          </span>
        </span>

        {/* Botón X separado */}
        <button
          onClick={() => {
            clearSearch();
            if (selectedCategory) {
              handleSelectCategory(selectedCategory, 1);
            } else {
              fetchMainProducts(1);
            }
          }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors group"
          aria-label="Quitar búsqueda"
        >
          <IoMdClose className="text-lg group-hover:scale-110 transition-transform" />
        </button>
      </div>
    )}

    {/* Badge de categoría + Botón cerrar */}
    {selectedCategory && (
      <div className="inline-flex items-center gap-2">
        {/* Badge de categoría (sin botón) */}
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
          <span className="font-medium">
            Categoría: {selectedCategory}
          </span>
        </span>

        {/* Botón X separado */}
        <button
          onClick={() => {
            setSelectedCategory(null);
            setCategoryProducts([]);
            setCurrentPage(1);
            if (hasSearched) {
              executeFullSearch(searchTerm, 1);
            } else {
              fetchMainProducts(1);
            }
          }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors group"
          aria-label="Quitar categoría"
        >
          <IoMdClose className="text-lg group-hover:scale-110 transition-transform" />
        </button>
      </div>
    )}

    {/* Botón "Limpiar todo" (solo si hay más de un filtro) */}
    {hasSearched && selectedCategory && (
      <button
        onClick={handleReset}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 border border-red-600 transition-colors shadow-sm"
      >
        <IoMdClose className="text-base" />
        <span>Limpiar todo</span>
      </button>
    )}
  </div>
)}
              </div>

              {/* Grid de Productos */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {isSearching ? 'Buscando productos...' : 
                     isLoadingCategoryProducts ? 'Cargando categoría...' : 
                     'Cargando productos...'}
                  </p>
                </div>
              ) : currentProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
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
                  <Button onClick={handleReset} variant="bordered">
                    {hasSearched || selectedCategory ? 'Ver todos los productos' : 'Recargar'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Grid de productos */}
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                    {currentProducts.map((producto, index) => (
                      <CardProduct
                        key={`${producto.CODIGO_BARRA}-${index}`}
                        name={producto.art_desc_vta}
                        price={producto.PRECIO}
                        imageUrl={producto.CODIGO_BARRA}
                        cod_interno={producto.COD_INTERNO}
                      />
                    ))}
                  </div>

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
            </div>
          </main>
        </div>

        {/* Overlay para menú móvil */}
        {showCategoriesMenu && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCategoriesMenu(false)}>
            {/* Menú de categorías móvil */}
            <div 
              className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del menú */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Categorías</h3>
                <button
                  onClick={() => setShowCategoriesMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <IoMdClose className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Contenido del menú */}
              <div className="p-4">
                {/* Botón "Todos los productos" */}
                <button
                  onClick={handleShowAll}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-3 transition-colors duration-200 ${
                    !selectedCategory && !hasSearched
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Todos los productos
                </button>

                {/* Lista de categorías */}
                {loadingCategories ? (
                  <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.NOM_CLASIF}
                        onClick={() => handleSelectCategory(category.NOM_CLASIF, 1)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                          selectedCategory === category.NOM_CLASIF
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category.NOM_CLASIF}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        

        <WhatsAppButton />
      </div>
    </>
  );
};

export default Products;