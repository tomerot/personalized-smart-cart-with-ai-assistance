/**
 * Product Service
 * Handles product search
 */

import { API_BASE_URL } from '@/config';

export const productService = {
  /**
   * Search products by name
   * @param {string} query - Search query
   * @param {number} limit - Maximum results (default: 5)
   * @returns {Promise<{success: boolean, products?: array, message?: string}>}
   */
  searchProducts: async (query, limit = 5) => {
    if (!query || query.trim().length === 0) {
      return { success: true, products: [] };
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error: ${response.status}`);
      }

      const products = await response.json();
      return { success: true, products };
    } catch (error) {
      console.error('Failed to search products:', error);
      return { success: false, products: [], message: error.message || 'Failed to search products' };
    }
  },
};
