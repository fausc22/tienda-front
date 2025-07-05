import axios from 'axios';

// Configuración de base URL dinámica
const getBaseURL = () => {
  // Si estamos en el browser
  if (typeof window !== 'undefined') {
    // Prioridad 1: Variable de entorno específica
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Prioridad 2: Detectar entorno por hostname para desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // En desarrollo local, usar localhost solo si el servidor está corriendo ahí
      return 'http://45.58.127.47:3001';
    }
    
    // Prioridad 3: Para cualquier otro caso (incluyendo build), usar servidor remoto
    return 'http://45.58.127.47:3001';
  }
  
  // Para SSR/SSG
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback para producción
  return 'http://45.58.127.47:3001';
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