// hooks/useOfertas.js - Hook para gestionar productos en oferta en la tienda
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../config/api';

export const useOfertas = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener ofertas desde el backend
  const fetchOfertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🔄 Obteniendo productos en oferta...');
      }

      const response = await apiClient.get('/store/articulosOF');
      
      if (response.data && Array.isArray(response.data)) {
        // Transformar datos para el componente CardProductOferta
        const ofertasFormateadas = response.data.map(item => {
  const precioOriginal = parseFloat(item.PRECIO) || 0;
  const precioOferta = parseFloat(item.PRECIO_DESC) || 0;
  
  return {
    name: item.art_desc_vta,
    codigoBarra: item.CODIGO_BARRA,
    originalPrice: precioOriginal,
    offerPrice: precioOferta,
    imageUrl: item.CODIGO_BARRA,
    stock: parseInt(item.STOCK) || 0,
    pesable: item.PESABLE === 'S',
    cod_interno: item.COD_INTERNO,
    
    // ✅ Calcular descuento solo si hay diferencia
    discountPercentage: precioOriginal > precioOferta && precioOriginal > 0
      ? Math.round(((precioOriginal - precioOferta) / precioOriginal) * 100)
      : 0
  };
});

// ✅ Mostrar todas las ofertas activas
const ofertasValidas = ofertasFormateadas.filter(oferta => 
  oferta.offerPrice > 0
);

        setOfertas(ofertasValidas);

        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log(`✅ ${ofertasValidas.length} ofertas válidas obtenidas de ${response.data.length} total`);
        }
      } else {
        console.warn('⚠️ Respuesta inesperada del servidor para ofertas:', response.data);
        setOfertas([]);
      }

    } catch (err) {
      console.error('❌ Error obteniendo ofertas:', err);
      setError(err.message || 'Error al cargar ofertas');
      setOfertas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar ofertas al montar el componente
  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  // Función para obtener las mejores ofertas (mayor descuento)
  const getMejoresOfertas = useCallback((limite = 6) => {
    return ofertas
      .filter(oferta => oferta.discountPercentage > 0)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, limite);
  }, [ofertas]);

  // Función para obtener ofertas por rango de descuento
  const getOfertasPorDescuento = useCallback((minDescuento = 0, maxDescuento = 100) => {
    return ofertas.filter(oferta => 
      oferta.discountPercentage >= minDescuento && 
      oferta.discountPercentage <= maxDescuento
    );
  }, [ofertas]);

  // Función para obtener ofertas con stock disponible
  const getOfertasConStock = useCallback(() => {
    return ofertas.filter(oferta => oferta.stock > 0);
  }, [ofertas]);

  // Función para buscar ofertas por nombre
  const buscarOfertas = useCallback((termino) => {
    if (!termino || termino.trim().length === 0) {
      return ofertas;
    }

    const terminoBusqueda = termino.toLowerCase().trim();
    return ofertas.filter(oferta => 
      oferta.name.toLowerCase().includes(terminoBusqueda) ||
      oferta.codigoBarra.includes(terminoBusqueda)
    );
  }, [ofertas]);

  // Estadísticas de ofertas
  const estadisticas = {
    total: ofertas.length,
    conStock: ofertas.filter(o => o.stock > 0).length,
    sinStock: ofertas.filter(o => o.stock === 0).length,
    descuentoPromedio: ofertas.length > 0 
      ? Math.round(ofertas.reduce((acc, o) => acc + o.discountPercentage, 0) / ofertas.length)
      : 0,
    mayorDescuento: ofertas.length > 0 
      ? Math.max(...ofertas.map(o => o.discountPercentage))
      : 0,
    ahorroTotal: ofertas.reduce((acc, o) => acc + (o.originalPrice - o.offerPrice), 0)
  };

  return {
    // Estados
    ofertas,
    loading,
    error,

    // Funciones
    fetchOfertas,
    getMejoresOfertas,
    getOfertasPorDescuento,
    getOfertasConStock,
    buscarOfertas,

    // Estadísticas
    estadisticas
  };
};