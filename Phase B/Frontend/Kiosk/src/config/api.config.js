/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

/**
 * Backend API base URL
 * Development: Uses /api proxy (configured in vite.config.js)
 * Production: Direct URL to backend
 */
export const API_BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : 'https://smart-cart-backend-nh7z.onrender.com';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  OTP: {
    SEND: (phone) => `/otp/${phone}/send`,
    VERIFY: (phone) => `/otp/${phone}/verify`,
  },
  USERS: {
    STATUS: (phone) => `/users/${phone}/status`,
  },
  CART: {
    GET: (phone) => `/cart-session/${phone}`,
    SYNC: (phone) => `/cart-session/${phone}/sync`,
    DELETE: (phone) => `/cart-session/${phone}`,
  },
  PRODUCTS: {
    SCAN: (barcode) => `/products/${barcode}/scan`,
    SEARCH: '/products/search',
    NUTRITIONAL_INFO: (barcode) => `/products/${barcode}/nutritional-info`,
    AVAILABILITY: (barcode) => `/products/${barcode}/availability`,
    INGREDIENTS: (barcode) => `/products/${barcode}/ingredients`,
    LOCATION: (barcode) => `/products/${barcode}/location`,
    AI_ALTERNATIVES: (barcode) => `/products/${barcode}/ai-alternatives`,
  },
  SHOPPING_LIST: {
    GET: (phone) => `/shopping-list/${phone}`,
    SAVE: (phone) => `/shopping-list/${phone}`,
    DELETE: (phone) => `/shopping-list/${phone}`,
  },
};

/**
 * API configuration options
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

/**
 * Fetch with timeout wrapper
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeout = API_CONFIG.TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond');
    }
    throw error;
  }
}

