// utils/linkHelper.js
// Helper para manejar enlaces SIN basePath (para evitar duplicación)

/**
 * Para links internos - NO agregamos /tienda aquí ya que se maneja en el servidor
 * @param {string} path - La ruta relativa
 * @returns {string} - La ruta tal como está
 */
export const buildUrl = (path) => {
  // Simplemente devolver la ruta tal como está
  // El servidor se encargará de servir desde /tienda
  return path;
};

/**
 * Construye una URL absoluta para el sitio (para metas, emails, etc.)
 * @param {string} path - La ruta relativa
 * @returns {string} - URL absoluta completa
 */
export const buildAbsoluteUrl = (path) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  
  // Si ya es una URL absoluta, devolverla tal como está
  if (path.startsWith('http')) {
    return path;
  }
  
  // Construir URL absoluta
  let fullPath = path;
  if (!path.startsWith('/')) {
    fullPath = '/' + path;
  }
  
  return siteUrl.replace(/\/+$/, '') + fullPath;
};

/**
 * Navega a una ruta usando router.push
 * @param {Object} router - El objeto router de Next.js
 * @param {string} path - La ruta a la que navegar
 */
export const navigateTo = (router, path) => {
  router.push(path);
};

/**
 * Verifica si una ruta es la ruta actual
 * @param {string} currentPath - La ruta actual (router.pathname o router.asPath)
 * @param {string} targetPath - La ruta a comparar
 * @returns {boolean} - true si es la ruta actual
 */
export const isCurrentPath = (currentPath, targetPath) => {
  return currentPath === targetPath;
};