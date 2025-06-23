import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@heroui/button';
import { useProducts } from '../hooks/useProducts';
import { useConfig } from '../context/ConfigContext';
import CardProduct from '../components/product/CardProduct';
import WhatsAppButton from '../components/cart/WhatsAppButton';
import apiClient from '../config/api';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { config } = useConfig();
  const { products: allProducts, loading } = useProducts('/store/productosMAIN');

  const displayProducts = hasSearched ? searchResults : allProducts;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await apiClient.get(`/store/buscar?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <>
      <Head>
        <title>{config?.storeName ? `PRODUCTOS - ${config.storeName}` : 'PRODUCTOS - TIENDA'}</title>
        <meta name="description" content="Explora nuestro catálogo de productos" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Productos
            </h1>
            <div className="w-24 h-0.5 bg-blue-600 mx-auto mb-8"></div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="submit"
                  color="primary"
                  disabled={!searchTerm.trim() || isSearching}
                  isLoading={isSearching}
                >
                  Buscar
                </Button>
                {hasSearched && (
                  <Button
                    type="button"
                    variant="flat"
                    color="danger"
                    onClick={handleReset}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Products Grid */}
          {loading && !hasSearched ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasSearched ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </h3>
              <p className="text-gray-600 mb-6">
                {hasSearched 
                  ? 'Intenta con otro término de búsqueda' 
                  : 'Vuelve más tarde para ver nuestros productos'
                }
              </p>
              {hasSearched && (
                <Button onClick={handleReset} variant="bordered">
                  Ver todos los productos
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="mb-6">
                <p className="text-gray-600">
                  {hasSearched 
                    ? `${displayProducts.length} resultado${displayProducts.length !== 1 ? 's' : ''} para "${searchTerm}"`
                    : `${displayProducts.length} producto${displayProducts.length !== 1 ? 's' : ''} disponible${displayProducts.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {displayProducts.map((producto, index) => (
                  <CardProduct
                    key={`${producto.CODIGO_BARRA}-${index}`}
                    name={producto.art_desc_vta}
                    price={producto.PRECIO}
                    imageUrl={producto.CODIGO_BARRA}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <WhatsAppButton />
      </div>
    </>
  );
};

export default Products;