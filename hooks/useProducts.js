import { useState, useEffect } from 'react';
import apiClient from '../config/api';

// Función helper para redondear y formatear precios
const formatPrice = (price) => {
  if (!price) return '0.00';
  // Redondear a entero y formatear con .00
  return Math.round(parseFloat(price)).toFixed(2);
};

// Función para procesar productos y redondear precios
const processProductPrices = (products) => {
  if (!Array.isArray(products)) return products;
  
  return products.map(product => ({
    ...product,
    PRECIO: formatPrice(product.PRECIO),
    COSTO: product.COSTO ? formatPrice(product.COSTO) : product.COSTO,
    PRECIO_DESC: product.PRECIO_DESC ? formatPrice(product.PRECIO_DESC) : product.PRECIO_DESC,
    // También formatear price si existe (para compatibilidad)
    price: product.price ? formatPrice(product.price) : (product.PRECIO ? formatPrice(product.PRECIO) : undefined)
  }));
};

export const useProducts = (endpoint, options = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Opciones por defecto
  const {
    page = 1,
    limit = 30,
    enablePagination = false,
    dependencies = []
  } = options;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir URL con parámetros de paginación si está habilitada
      let url = endpoint;
      if (enablePagination) {
        const separator = endpoint.includes('?') ? '&' : '?';
        url = `${endpoint}${separator}page=${page}&limit=${limit}`;
      }
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔍 useProducts fetching:', url);
      }
      
      const response = await apiClient.get(url);
      
      if (enablePagination && response.data.data) {
        // Respuesta paginada - aplicar formateo de precios
        const formattedProducts = processProductPrices(response.data.data);
        setProducts(formattedProducts);
        setPagination(response.data.pagination);
      } else {
        // Respuesta simple (para ofertas, destacados, etc.) - aplicar formateo de precios
        const formattedProducts = processProductPrices(response.data);
        setProducts(formattedProducts);
        setPagination(null);
      }
    } catch (err) {
      console.error(`Error fetching products from ${endpoint}:`, err);
      setError(err.message);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [endpoint, page, limit, enablePagination, ...dependencies]);

  // Función para refrescar los datos
  const refetch = async () => {
    await fetchProducts();
  };

  return { 
    products, 
    loading, 
    error, 
    pagination,
    refetch
  };
};

// Hook específico para productos con paginación
export const usePaginatedProducts = (endpoint, page = 1, limit = 30, dependencies = []) => {
  return useProducts(endpoint, {
    page,
    limit,
    enablePagination: true,
    dependencies
  });
};

// Hook específico para búsqueda con paginación
export const useProductSearch = (searchTerm, page = 1, limit = 30) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const search = async (term = searchTerm, searchPage = page) => {
    if (!term || term.trim().length < 2) {
      setProducts([]);
      setPagination(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `/store/buscar?q=${encodeURIComponent(term)}&page=${searchPage}&limit=${limit}`;
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔍 useProductSearch:', url);
      }
      
      const response = await apiClient.get(url);
      
      // Aplicar formateo de precios a los resultados de búsqueda
      const formattedProducts = processProductPrices(response.data.data || []);
      setProducts(formattedProducts);
      setPagination(response.data.pagination || null);
    } catch (err) {
      console.error('Error searching products:', err);
      setError(err.message);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    pagination,
    search
  };
};

// Hook específico para productos por categoría con paginación
export const useCategoryProducts = (categoryName, page = 1, limit = 30) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchCategoryProducts = async (category = categoryName, categoryPage = page) => {
    if (!category) {
      setProducts([]);
      setPagination(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `/store/articulos/${encodeURIComponent(category)}?page=${categoryPage}&limit=${limit}`;
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔍 useCategoryProducts:', url);
      }
      
      const response = await apiClient.get(url);
      
      // Aplicar formateo de precios a los productos de categoría
      const formattedProducts = processProductPrices(response.data.data || []);
      setProducts(formattedProducts);
      setPagination(response.data.pagination || null);
    } catch (err) {
      console.error('Error fetching category products:', err);
      setError(err.message);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    pagination,
    fetchCategoryProducts
  };
};

// Hook para productos relacionados en checkout
export const useRelatedProducts = (cartItems = []) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Extraer códigos de barra del carrito
        const cartCodes = cartItems
          .map(item => item.imageUrl || item.codigo_barra)
          .filter(Boolean);
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('📤 useRelatedProducts - códigos enviados:', cartCodes);
        }
        
        // Construir URL con query parameters
        let url = '/store/articulosCheckout';
        if (cartCodes.length > 0) {
          url += `?cartCodes=${cartCodes.join(',')}`;
        }
        
        const response = await apiClient.get(url);
        
        // Procesar y formatear precios
        const formattedProducts = processProductPrices(response.data);
        setProducts(formattedProducts);
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('📦 useRelatedProducts - productos recibidos:', formattedProducts.length);
        }
      } catch (err) {
        console.error('❌ Error fetching related products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [JSON.stringify(cartItems)]); // Dependencia del carrito

  return { products, loading, error };
};

// UTILIDAD ADICIONAL: Hook para formatear precios individuales
export const useFormattedPrice = (price) => {
  return formatPrice(price);
};

// UTILIDAD ADICIONAL: Función que puedes importar y usar en componentes
export { formatPrice };