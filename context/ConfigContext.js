import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../config/api';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('🔧 ConfigContext: Fetching configuration...');
        }
        
        const response = await apiClient.get('/store/variablesenv');
        setConfig(response.data);
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('✅ ConfigContext: Configuration loaded:', response.data);
        }
      } catch (error) {
        console.error('❌ ConfigContext: Error fetching config:', error);
        setError(error.message);
        
        // Configuración de fallback para desarrollo
        const fallbackConfig = {
          storeName: 'PuntoSur',
          storeAddress: 'Av. Cdad. de Valparaíso 3297, Córdoba, Argentina',
          storePhone: '+542302651250',
          storeDescription: 'Somos una tienda ubicada en la zona sur de Córdoba Capital donde nos enfocamos en satisfacer las necesidades del cliente. ¡No dudes en elegirnos!',
          storeInstagram: '@puntosur',
          storeEmail: 'puntosur@gmail.com',
          storeDeliveryBase: '200',
          storeDeliveryKm: '300',
          iva: '4',
          pageStatus: '0'
        };
        
        setConfig(fallbackConfig);
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.warn('⚠️ ConfigContext: Using fallback configuration');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de ConfigProvider');
  }
  return context;
};