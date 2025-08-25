// ===================================
// AddressMapPicker.jsx - Versión simplificada
// ===================================

import { useState, useEffect, useRef } from 'react';
import { Button } from '@heroui/button';
import { IoMdClose, IoMdCheckmark, IoMdPin } from 'react-icons/io';

const AddressMapPicker = ({ isOpen, onClose, onConfirm, initialAddress = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [addressText, setAddressText] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Coordenadas de Córdoba
  const CORDOBA_CENTER = { lat: -31.4201, lng: -64.1888 };
  const STORE_LOCATION = { lat: -31.4201, lng: -64.1888 };

  useEffect(() => {
    if (isOpen && !mapInstance.current) {
      loadLeafletMap();
    }
  }, [isOpen]);

  const loadLeafletMap = async () => {
    setIsLoading(true);
    setMapError(null);

    try {
      if (!window.L) {
        await loadLeafletLibrary();
      }
      initializeLeafletMap();
    } catch (error) {
      console.error('Error cargando mapa:', error);
      setMapError('Error cargando el mapa. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const loadLeafletLibrary = () => {
    return new Promise((resolve, reject) => {
      // Cargar CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.onload = () => {
        // Cargar JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Error cargando Leaflet JS'));
        document.head.appendChild(script);
      };
      cssLink.onerror = () => reject(new Error('Error cargando Leaflet CSS'));
      document.head.appendChild(cssLink);
    });
  };

  const initializeLeafletMap = () => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = window.L.map(mapRef.current).setView(
        [CORDOBA_CENTER.lat, CORDOBA_CENTER.lng], 
        13
      );

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Marcador de la tienda
      const storeMarker = window.L.marker([STORE_LOCATION.lat, STORE_LOCATION.lng], {
        icon: window.L.divIcon({
          className: 'store-marker',
          html: '<div style="background: #2563eb; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">🏪</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      storeMarker.bindPopup('<b>Nuestra Tienda</b><br>Punto de origen del envío');

      let selectedMarker = null;

      // Manejar clicks en el mapa
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // Remover marcador anterior
        if (selectedMarker) {
          map.removeLayer(selectedMarker);
        }

        // Crear nuevo marcador
        selectedMarker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            className: 'selected-marker',
            html: '<div style="background: #dc2626; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">📍</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        // Calcular distancia y costo
        const distance = calculateDistance(
          STORE_LOCATION.lat, STORE_LOCATION.lng,
          lat, lng
        );
        const shippingCost = calculateShippingCost(distance);

        // Obtener dirección
        setIsLoading(true);
        try {
          const address = await getReverseGeocode(lat, lng);
          setAddressText(address);
          
          selectedMarker.bindPopup(`
            <div class="text-center">
              <b>Ubicación seleccionada</b><br>
              <small>${address}</small><br>
              <span class="text-sm text-gray-600">
                ${distance.toFixed(1)}km • $${shippingCost.toFixed(2)}
              </span>
            </div>
          `).openPopup();

          setSelectedLocation({
            lat,
            lng,
            distance,
            shippingCost,
            address
          });
        } catch (error) {
          setAddressText(`Ubicación seleccionada`);
          setSelectedLocation({
            lat,
            lng,
            distance,
            shippingCost,
            address: `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          });
        } finally {
          setIsLoading(false);
        }
      });

      mapInstance.current = map;
      setIsLoading(false);

      // Si hay una dirección inicial, centrar el mapa ahí
      if (initialAddress && initialAddress.coordinates) {
        map.setView([initialAddress.coordinates.lat, initialAddress.coordinates.lng], 15);
      }

    } catch (error) {
      console.error('Error inicializando mapa:', error);
      setMapError('Error inicializando el mapa');
      setIsLoading(false);
    }
  };

  // Geocodificación inversa simplificada
  const getReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&language=es&limit=1`
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      
      return `Ubicación (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (error) {
      return `Ubicación seleccionada`;
    }
  };

  // Función para calcular distancia
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI/180);

  const calculateShippingCost = (distance) => {
    const baseCost = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_BASE) || 500;
    const costPerKm = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_KM) || 100;
    return Math.max(baseCost, baseCost + (distance * costPerKm));
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;
    
    onConfirm({
      address: selectedLocation.address,
      coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng },
      distance: selectedLocation.distance,
      shippingCost: selectedLocation.shippingCost,
      source: 'map'
    });
  };

  // Limpiar mapa al cerrar
  const handleClose = () => {
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    setSelectedLocation(null);
    setMapError(null);
    setAddressText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Seleccionar ubicación en el mapa
          </h3>
          <Button
            variant="flat"
            size="sm"
            onClick={handleClose}
            className="p-2"
          >
            <IoMdClose className="text-xl" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b">
          <p className="text-sm text-blue-800">
            <IoMdPin className="inline mr-1" />
            Haz clic en el mapa para seleccionar tu ubicación de entrega.
          </p>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}
          
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-red-600 mb-2">{mapError}</p>
                <Button onClick={loadLeafletMap} size="sm">
                  Reintentar
                </Button>
              </div>
            </div>
          )}
          
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="p-4 bg-green-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-green-800 mb-1">Dirección confirmada</p>
                <p className="text-sm text-gray-700 mb-2">{addressText}</p>
                <p className="text-sm text-green-600">
                  Distancia: {selectedLocation.distance.toFixed(1)} km • 
                  Envío: ${selectedLocation.shippingCost.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-green-600 text-white hover:bg-green-700 ml-4"
              >
                <IoMdCheckmark className="mr-1" />
                Confirmar ubicación
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressMapPicker;