import axios from 'axios';

// Cliente principal con timeout estándar
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 segundos para operaciones normales
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente específico para emails con timeout extendido
export const emailApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 segundos para emails
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente específico para operaciones largas (pedidos, uploads, etc.)
export const longApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 25000, // 25 segundos para operaciones complejas
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptores para manejo de errores global
const setupInterceptors = (client) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        console.warn('Timeout detectado pero operación puede haber sido exitosa:', error.config.url);
      }
      return Promise.reject(error);
    }
  );
};

setupInterceptors(apiClient);
setupInterceptors(emailApiClient);
setupInterceptors(longApiClient);

export default apiClient;