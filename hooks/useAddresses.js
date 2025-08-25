// hooks/useAddresses.js - Hook personalizado para manejo de direcciones
import { useState, useCallback, useRef } from 'react';
import apiClient from '../config/api';

export const useAddresses = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  
  // Función para buscar direcciones con debounce
  const searchAddresses = useCallback(async (query, options = {}) => {
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Validaciones básicas
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setError(null);
      return [];
    }

    return new Promise((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        setError(null);

        try {
          console.log('🔍 Buscando direcciones:', query);
          
          const searchOptions = {
            query: query.trim(),
            country: 'ar',
            limit: 8,
            ...options
          };

          const response = await apiClient.post('/store/searchAddresses', searchOptions);
          
          if (response.data.success && response.data.results) {
            const processedResults = response.data.results.map((result, index) => ({
              ...result,
              id: `addr_${index}_${Date.now()}`,
              isComplete: !!(result.components?.house_number && result.components?.road),
              quality: calculateAddressQuality(result)
            }));

            // Ordenar por calidad y completitud
            processedResults.sort((a, b) => {
              if (a.isComplete !== b.isComplete) return b.isComplete - a.isComplete;
              if (Math.abs(a.quality - b.quality) > 0.1) return b.quality - a.quality;
              return a.distance - b.distance;
            });

            setSuggestions(processedResults);
            console.log('✅ Direcciones encontradas:', processedResults.length);
            resolve(processedResults);
          } else {
            setSuggestions([]);
            setError('No se encontraron direcciones');
            resolve([]);
          }
        } catch (err) {
          console.error('❌ Error buscando direcciones:', err);
          setSuggestions([]);
          setError('Error al buscar direcciones');
          resolve([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    });
  }, []);

  // Función para validar una dirección específica
  const validateAddress = useCallback(async (address) => {
    try {
      console.log('🔍 Validando dirección:', address);
      
      const response = await apiClient.post('/store/validateAddress', {
        address,
        country: 'ar',
        returnSuggestions: true
      });

      if (response.data.success) {
        return {
          isValid: true,
          confidence: response.data.confidence,
          suggestions: response.data.suggestions || [],
          validatedAddress: response.data.validatedAddress,
          distance: response.data.distance,
          shippingCost: response.data.shippingCost
        };
      }

      return {
        isValid: false,
        message: 'Dirección no válida',
        suggestions: response.data.suggestions || []
      };
    } catch (error) {
      console.error('❌ Error validando dirección:', error);
      return {
        isValid: false,
        message: 'Error al validar la dirección',
        suggestions: []
      };
    }
  }, []);

  // Función para obtener sugerencias de direcciones incompletas
  const getAddressCompletion = useCallback(async (partialAddress) => {
    try {
      console.log('🔧 Completando dirección:', partialAddress);
      
      const completions = [];
      
      // Estrategias de completado
      if (!partialAddress.includes('Córdoba')) {
        completions.push(`${partialAddress}, Córdoba`);
        completions.push(`${partialAddress}, Córdoba Capital`);
      }

      // Agregar números comunes si no hay número
      if (!/\d/.test(partialAddress)) {
        for (let i = 1; i <= 5; i++) {
          const num = Math.floor(Math.random() * 2000) + 100;
          completions.push(`${partialAddress} ${num}`);
        }
      }

      // Buscar cada completado
      const results = await Promise.all(
        completions.map(completion => searchAddresses(completion, { limit: 3 }))
      );

      // Aplanar y deduplicar resultados
      const flatResults = results.flat();
      const uniqueResults = flatResults.filter((result, index, self) => 
        index === self.findIndex(r => r.formatted.toLowerCase() === result.formatted.toLowerCase())
      );

      return uniqueResults.slice(0, 5); // Máximo 5 sugerencias
    } catch (error) {
      console.error('❌ Error completando dirección:', error);
      return [];
    }
  }, [searchAddresses]);

  // Limpiar sugerencias
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  // Función auxiliar para calcular calidad de dirección
  const calculateAddressQuality = (result) => {
    let quality = result.confidence || 0;
    
    // Bonificar si tiene número de casa
    if (result.components?.house_number) quality += 0.2;
    
    // Bonificar si tiene nombre de calle
    if (result.components?.road) quality += 0.1;
    
    // Bonificar si está en Córdoba
    if (result.components?.city?.toLowerCase().includes('córdoba')) quality += 0.1;
    
    // Penalizar si está muy lejos (más de 50km)
    if (result.distance > 50) quality -= 0.3;
    
    return Math.min(1, Math.max(0, quality));
  };

  return {
    // Estados
    isSearching,
    suggestions,
    error,
    
    // Funciones
    searchAddresses,
    validateAddress,
    getAddressCompletion,
    clearSuggestions,
    
    // Utilidades
    calculateAddressQuality
  };
};

// Hook para direcciones guardadas
export const useSavedAddresses = () => {
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Cargar direcciones del localStorage
  const loadSavedAddresses = useCallback(() => {
    try {
      const saved = localStorage.getItem('saved_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedAddresses(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error cargando direcciones guardadas:', error);
    }
    return [];
  }, []);

  // Guardar dirección
  const saveAddress = useCallback((address, nickname = '') => {
    try {
      const newAddress = {
        id: Date.now(),
        ...address,
        nickname,
        savedAt: new Date().toISOString(),
        usageCount: 0
      };

      const updated = [...savedAddresses, newAddress];
      setSavedAddresses(updated);
      localStorage.setItem('saved_addresses', JSON.stringify(updated));
      
      console.log('💾 Dirección guardada:', newAddress);
      return newAddress;
    } catch (error) {
      console.error('Error guardando dirección:', error);
      return null;
    }
  }, [savedAddresses]);

  // Eliminar dirección
  const deleteAddress = useCallback((addressId) => {
    try {
      const updated = savedAddresses.filter(addr => addr.id !== addressId);
      setSavedAddresses(updated);
      localStorage.setItem('saved_addresses', JSON.stringify(updated));
      
      console.log('🗑️ Dirección eliminada:', addressId);
      return true;
    } catch (error) {
      console.error('Error eliminando dirección:', error);
      return false;
    }
  }, [savedAddresses]);

  // Incrementar contador de uso
  const incrementUsage = useCallback((addressId) => {
    try {
      const updated = savedAddresses.map(addr => 
        addr.id === addressId 
          ? { ...addr, usageCount: (addr.usageCount || 0) + 1, lastUsed: new Date().toISOString() }
          : addr
      );
      setSavedAddresses(updated);
      localStorage.setItem('saved_addresses', JSON.stringify(updated));
    } catch (error) {
      console.error('Error actualizando uso de dirección:', error);
    }
  }, [savedAddresses]);

  return {
    savedAddresses,
    loadSavedAddresses,
    saveAddress,
    deleteAddress,
    incrementUsage
  };
};

export default useAddresses;