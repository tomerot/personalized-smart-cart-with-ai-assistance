/**
 * Product Service
 * Handles product-related API calls (fetching product data, scanning with alternatives)
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, fetchWithTimeout } from '@/config/api.config';

export const productService = {
  /**
   * Scan a product and get its data with conflict checking
   * @param {string} barcode - Product barcode to scan
   * @param {string[]} allergies - User's allergies
   * @param {string[]} dietaryNeeds - User's dietary needs
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   * 
   * Response data structure (FindAlternativesResponse):
   * {
   *   has_conflict: boolean,
   *   original_product: ProductResponse,
   *   conflict_with_original: ConflictCheckResponse,
   *   alternatives: ProductResponse[],
   *   total_alternatives: number
   * }
   */
  scanProduct: async (barcode, allergies = [], dietaryNeeds = []) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.PRODUCTS.SCAN(barcode)}`;

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({
          allergies: allergies,
          dietary_needs: dietaryNeeds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to scan product:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch product data',
      };
    }
  },

  /**
   * Format product name for display in cart
   * Returns the product name with size if available
   * Pattern: "name (size)" - e.g., "Fresh Milk 3% (1L)"
   * @param {object} product - Product data from API
   * @returns {string} Formatted product name
   */
  formatProductName: (product) => {
    const { name, size } = product;
    
    if (size) {
      return `${name} (${size})`;
    }
    
    // If no size, just return name
    return name;
  },

  /**
   * Transform API product response to cart item format
   * @param {object} product - Product data from API (ProductResponse)
   * @returns {object} Cart item format
   */
  transformToCartItem: (product) => {
    return {
      id: product.barcode, // Use barcode as unique ID
      name: productService.formatProductName(product),
      company: product.company,
      size: product.size,
      imageUrl: product.image_url,
      pricePerUnit: product.price,
      quantity: 1,
      // Keep original product data for reference
      originalProduct: product,
    };
  },
};

