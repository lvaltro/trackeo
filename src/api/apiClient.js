// src/api/apiClient.js
// Cliente HTTP centralizado para Trackeo.cl
// Toda la comunicación con el backend pasa por aquí.

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT = 15000; // 15 segundos
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 segundo base (exponencial)

/**
 * Error personalizado con código HTTP y datos del servidor.
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * Ejecuta un fetch con timeout, retry automático, e interceptor de 401.
 * @param {string} endpoint - Ruta relativa (ej: '/session')
 * @param {object} options - Opciones de fetch + timeout personalizado
 * @param {number} retryCount - Contador interno de reintentos
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}, retryCount = 0) {
  const controller = new AbortController();
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Si el caller pasó su propio signal (ej: AbortController del componente),
  // lo escuchamos para abortar también nuestro controller interno.
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const config = {
    ...options,
    signal: controller.signal,
    credentials: 'include', // Cookie JSESSIONID viaja automáticamente
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);

    // 401 = Sesión expirada → evento global para que App.jsx lo maneje
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new ApiError('Sesión expirada', 401);
    }

    // 429 = Rate limited → esperar y reintentar
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 5;
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return request(endpoint, options, retryCount); // No cuenta como retry
    }

    // 5xx = Error de servidor → retry con backoff exponencial
    if (response.status >= 500 && retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY * Math.pow(2, retryCount)));
      return request(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      const errorData = await response.text().catch(() => null);
      throw new ApiError(
        `Error ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // 204 No Content
    if (response.status === 204) return null;

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);

    // Timeout → ApiError legible
    if (error.name === 'AbortError') {
      throw new ApiError('Timeout: el servidor no respondió a tiempo', 408);
    }

    // Si ya es un ApiError nuestro, propagarlo directamente
    if (error instanceof ApiError) {
      throw error;
    }

    // Error de red (offline, DNS, etc.) → retry con backoff
    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY * Math.pow(2, retryCount)));
      return request(endpoint, options, retryCount + 1);
    }

    throw new ApiError(error.message || 'Error de red', 0);
  }
}

/**
 * API Client con métodos HTTP estándar.
 */
const apiClient = {
  get: (endpoint, options) =>
    request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),

  put: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (endpoint, options) =>
    request(endpoint, { ...options, method: 'DELETE' }),
};

export { apiClient, ApiError };
export default apiClient;
