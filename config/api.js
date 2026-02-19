import axios from 'axios';

// Configuración de base URL - SIEMPRE usa NEXT_PUBLIC_API_URL
const getBaseURL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL no está definida en las variables de entorno. Por favor, configúrala en tu archivo .env');
  }
  
  return apiUrl;
};

// Función helper para obtener URLs de imágenes
export const getImageURL = (imagePath) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL no está definida en las variables de entorno');
  }
  
  // Remover trailing slash si existe
  const baseUrl = apiUrl.replace(/\/$/, '');
  // Asegurar que imagePath no empiece con /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
};

// Función helper para URLs de productos
export const getProductImageURL = (barcode) => {
  return getImageURL(`/images/products/${barcode}.png`);
};

// Función helper para placeholder
export const getPlaceholderImageURL = () => {
  return getImageURL('/images/placeholder.png');
};

// Función helper para favicon
export const getFaviconURL = () => {
  return getImageURL('/images/favicon-tienda.ico');
};

// Cliente principal con timeout estándar
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // 15 segundos para operaciones normales
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente específico para emails con timeout extendido
export const emailApiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 45000, // 45 segundos para emails
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente específico para operaciones largas (pedidos, uploads, etc.)
export const longApiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 35000, // 35 segundos para operaciones complejas
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptores para manejo de errores global y debugging
const setupInterceptors = (client, name = 'API') => {
  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log(`🚀 [${name}] ${config.method?.toUpperCase()} ${config.url}`, {
          baseURL: config.baseURL,
          data: config.data,
          params: config.params
        });
      }
      return config;
    },
    (error) => {
      console.error(`❌ [${name}] Request Error:`, error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log(`✅ [${name}] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
      }
      return response;
    },
    (error) => {
      // Log del error
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.error(`❌ [${name}] Response Error:`, {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
      }

      // Manejo especial de timeouts
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        console.warn(`⏰ [${name}] Timeout detectado pero operación puede haber sido exitosa:`, error.config?.url);
        
        // Para operaciones críticas como pedidos, consideramos que el timeout no es necesariamente un error
        if (error.config?.url?.includes('NuevoPedido') || error.config?.url?.includes('mailPedidoRealizado')) {
          console.warn('⚠️ Timeout en operación crítica - la operación puede haberse completado en el servidor');
        }
      }

      // Manejo de errores de red
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        console.error(`🌐 [${name}] Error de red - verificar conexión al servidor:`, getBaseURL());
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors(apiClient, 'API');
setupInterceptors(emailApiClient, 'EMAIL');
setupInterceptors(longApiClient, 'LONG');

// Función helper para obtener la URL base
export const getApiBaseURL = getBaseURL;

// Función helper para verificar la conexión
export const checkApiConnection = async () => {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      baseURL: getBaseURL()
    };
  }
};

// Log de configuración en desarrollo
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG === 'true') {
  console.log('🔧 API Configuration:', {
    baseURL: getBaseURL(),
    environment: process.env.NODE_ENV,
    buildEnv: process.env.NEXT_PUBLIC_BUILD_ENV
  });
}

export default apiClient;