
// SmartAddressInput.jsx - Versión simplificada
import { useState, useEffect, useRef } from 'react';
import { Button } from '@heroui/button';
import { IoMdSearch, IoMdCheckmark, IoMdClose, IoMdPin, IoMdAlert } from 'react-icons/io';
import apiClient from '../../config/api';

const SmartAddressInput = ({ onAddressSelect, initialValue = '', className = '', isActive = true }) => {
  const [address, setAddress] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Limpiar cuando el componente se vuelve inactivo
  useEffect(() => {
    if (!isActive) {
      setAddress('');
      setSelectedAddress(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isActive]);

  // Limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Buscar sugerencias con debounce
  const searchAddresses = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/store/searchAddresses', {
        query: searchTerm,
        country: 'ar',
        limit: 6
      });

      if (response.data.results && response.data.results.length > 0) {
        const processedSuggestions = response.data.results.map((result, index) => ({
          id: index,
          formatted: result.formatted,
          distance: result.distance,
          shippingCost: result.shippingCost,
          confidence: result.confidence,
          components: result.components,
          coordinates: result.coordinates
        }));

        setSuggestions(processedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error buscando direcciones:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en el input con debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setSelectedAddress(null);

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      onAddressSelect(null, 'input');
      return;
    }

    if (value.length >= 3) {
      // Buscar después de 500ms de inactividad
      debounceRef.current = setTimeout(() => {
        searchAddresses(value);
      }, 500);
    }
  };

  // Seleccionar una dirección
  const handleSelectAddress = (suggestion) => {
    setAddress(suggestion.formatted);
    setSelectedAddress(suggestion);
    setShowSuggestions(false);
    
    // Notificar al componente padre
    onAddressSelect({
      address: suggestion.formatted,
      distance: suggestion.distance,
      shippingCost: suggestion.shippingCost,
      coordinates: suggestion.coordinates,
      components: suggestion.components,
      source: 'input'
    }, 'input');
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener icono según el estado
  const getStatusIcon = () => {
    if (isLoading) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
    }
    if (selectedAddress) {
      return <IoMdCheckmark className="text-green-600" />;
    }
    return <IoMdSearch className="text-gray-400" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input principal */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={handleInputChange}
          disabled={!isActive}
          placeholder="Ej: Av. Colon 1234, Nueva Córdoba"
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            selectedAddress ? 'border-green-500 bg-green-50' :
            !isActive ? 'border-gray-200 bg-gray-50 text-gray-400' :
            'border-gray-300'
          }`}
        />
        
        {/* Icono de estado */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && isActive && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelectAddress(suggestion)}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <IoMdPin className="text-blue-600 flex-shrink-0 text-sm" />
                    <span className="font-medium text-gray-900 text-sm">
                      {suggestion.formatted}
                    </span>
                  </div>
                  
                  {/* Información de envío */}
                  <div className="text-xs text-gray-600 ml-5">
                    <span>Distancia: {suggestion.distance}km • Envío: ${suggestion.shippingCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartAddressInput;