import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@heroui/button';
import { IoMdSearch, IoMdClose, IoMdMenu, IoMdFunnel } from 'react-icons/io';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import Pagination from '../components/common/Pagination';
import apiClient from '../config/api';

const Products = () => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
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
      const response = await apiClient.get(`/store/productosMAIN?page=${page}&limit=30`);
      setAllProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching main products:', error);
      setAllProducts([]);
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
    // Para búsquedas y categorías, usar su propia paginación
    // Para productos principales, usar el estado de paginación principal
    return pagination;
  };

  // Función de búsqueda
  const handleSearch = async (e, page = 1) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSelectedCategory(null);
    setCurrentPage(page);

    try {
      const response = await apiClient.get(`/store/buscar?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=30`);
      setSearchResults(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
      setPagination({});
    } finally {
      setIsSearching(false);
    }
  };

  // Función para limpiar búsqueda
  const handleReset = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedCategory(null);
    setCategoryProducts([]);
    setCurrentPage(1);
    fetchMainProducts(1); // Recargar productos principales
  };

  // Función para seleccionar categoría
  const handleSelectCategory = async (categoryName, page = 1) => {
    setIsLoadingCategoryProducts(true);
    setSelectedCategory(categoryName);
    setHasSearched(false);
    setShowCategoriesMenu(false);
    setCurrentPage(page);

    try {
      const response = await apiClient.get(`/store/articulos/${encodeURIComponent(categoryName)}?page=${page}&limit=30`);
      setCategoryProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProducts([]);
      setPagination({});
    } finally {
      setIsLoadingCategoryProducts(false);
    }
  };

  // Función para mostrar todos los productos
  const handleShowAll = () => {
    setSelectedCategory(null);
    setCategoryProducts([]);
    setHasSearched(false);
    setSearchResults([]);
    setShowCategoriesMenu(false);
    setCurrentPage(1);
    fetchMainProducts(1);
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    if (hasSearched) {
      handleSearch(null, page);
    } else if (selectedCategory) {
      handleSelectCategory(selectedCategory, page);
    } else {
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
                  !selectedCategory 
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

                {/* Controles de búsqueda y filtros */}
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

                  {/* Formulario de búsqueda */}
                  <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                      />
                      <IoMdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                    </div>
                    
                    <Button
                      type="submit"
                      color="primary"
                      disabled={!searchTerm.trim() || isSearching}
                      isLoading={isSearching}
                      className="px-6 py-3 font-medium"
                    >
                      Buscar
                    </Button>
                    
                    {(hasSearched || selectedCategory) && (
                      <Button
                        type="button"
                        variant="flat"
                        color="danger"
                        onClick={handleReset}
                        className="px-4 py-3"
                      >
                        <IoMdClose className="text-xl" />
                      </Button>
                    )}
                  </form>
                </div>

                {/* Indicador de filtro activo */}
                {(hasSearched || selectedCategory) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hasSearched && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Búsqueda: "{searchTerm}"
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        Categoría: {selectedCategory}
                      </span>
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
                    !selectedCategory 
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