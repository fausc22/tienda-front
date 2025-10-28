// hooks/useProductSearch.js - Hook optimizado para búsqueda instantánea
import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../config/api';

export const useInstantSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isSelectingRef = useRef(false); // 🆕 Flag para saber si se está seleccionando

  // Función para buscar sugerencias (solo primeros 5 resultados)
  const fetchSuggestions = useCallback(async (term) => {
    if (!term || term.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 🆕 No buscar sugerencias si se está seleccionando
    if (isSelectingRef.current) {
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      // Buscar solo 5 resultados para sugerencias
      const encodedTerm = encodeURIComponent(term.trim());
      const response = await apiClient.get(
        `/store/buscar/${encodedTerm}/1/5`,
        { signal: abortControllerRef.current.signal }
      );

      const items = response.data?.data || [];
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para búsqueda completa con paginación
  const executeFullSearch = useCallback(async (term, page = 1) => {
    if (!term || term.length < 2) {
      setResults([]);
      setPagination(null);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      setShowSuggestions(false); // 🆕 Cerrar dropdown al hacer búsqueda completa

      const encodedTerm = encodeURIComponent(term.trim());
      console.log(`🔍 [FRONTEND] Ejecutando búsqueda completa:`, {
        term: term,
        trimmed: term.trim(),
        encoded: encodedTerm,
        url: `/store/buscar/${encodedTerm}/${page}/30`,
        page
      });

      const response = await apiClient.get(
        `/store/buscar/${encodedTerm}/${page}/30`
      );

      console.log(`✅ [FRONTEND] Respuesta de búsqueda:`, {
        resultados: response.data?.data?.length || 0,
        totalItems: response.data?.pagination?.totalItems || 0
      });

      setResults(response.data?.data || []);
      setPagination(response.data?.pagination || null);

    } catch (error) {
      console.error('❌ [FRONTEND] Error in full search:', {
        term,
        error: error.message,
        response: error.response?.data
      });
      setResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para sugerencias
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 🆕 No ejecutar debounce si se está seleccionando
    if (isSelectingRef.current) {
      isSelectingRef.current = false; // Reset flag
      return;
    }

    if (searchTerm.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchTerm);
      }, 400); // 400ms de delay
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // 🆕 Función mejorada para seleccionar sugerencia
  const handleSelectSuggestion = (product) => {
    isSelectingRef.current = true; // Marcar que se está seleccionando

    // SOLUCIÓN: Buscar por código de barras (único) en lugar de nombre
    const searchKey = product.CODIGO_BARRA || product.COD_INTERNO || product.art_desc_vta?.trim();
    const displayName = product.art_desc_vta?.trim() || '';

    console.log(`🎯 [FRONTEND] Sugerencia seleccionada:`, {
      displayName,
      searchKey,
      CODIGO_BARRA: product.CODIGO_BARRA,
      COD_INTERNO: product.COD_INTERNO,
      PRECIO: product.PRECIO
    });

    // Mostrar el nombre en el input para UX
    setSearchTerm(displayName);
    setShowSuggestions(false);
    setSuggestions([]);

    // CRÍTICO: Buscar por código de barras para garantizar resultado único
    executeFullSearch(searchKey);
  };

  const clearSearch = () => {
    isSelectingRef.current = false;
    setSearchTerm('');
    setSuggestions([]);
    setResults([]);
    setPagination(null);
    setHasSearched(false);
    setShowSuggestions(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    results,
    loading,
    showSuggestions,
    setShowSuggestions,
    pagination,
    hasSearched,
    handleSelectSuggestion,
    executeFullSearch,
    clearSearch
  };
};