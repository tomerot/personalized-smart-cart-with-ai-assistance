/**
 * Checkout Service
 * Handles checkout-related API calls (suggestions, process checkout, cart sync)
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, fetchWithTimeout } from '@/config/api.config';

export const checkoutService = {
  /**
   * Sync cart to backend (required before checkout)
   * @param {string} phone - User's phone number
   * @param {Array} cartItems - Cart items from frontend
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  syncCart: async (phone, cartItems) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CART.SYNC(phone)}`;

      // Transform cart items to backend format (ProductItemData)
      const items = cartItems.map(item => {
        const original = item.originalProduct || {};
        return {
          barcode: item.id,
          name: original.name || item.name,
          image_url: item.imageUrl || original.image_url,
          company: original.company || '',
          category: original.category || '',
          price: item.pricePerUnit || original.price || 0,
          size: original.size || null,
          ingredients: original.ingredients || [],
          allergens: original.allergens || [],
          dietary_tags: original.dietary_tags || [],
          nutritional_info: original.nutritional_info || {
            calories_per_100g: 0,
            fat_per_100g: 0,
            sodium_per_100mg: 0,
            carbs_per_100g: 0,
            sugar_per_100g: 0,
            protein_per_100g: 0,
          },
          available: original.available !== false,
          quantity: item.quantity || 1,
        };
      });

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to sync cart:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync cart',
      };
    }
  },

  /**
   * Get replenishment suggestions ("forgot items")
   * Returns products that are due for repurchase based on user's buying patterns
   *
   * @param {string} phone - User's phone number
   * @param {string[]} cartBarcodes - Barcodes of items currently in cart (to exclude)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   *
   * Response data structure:
   * {
   *   phone: string,
   *   suggestions: SuggestionItem[],
   *   total_found: number,
   *   message: string
   * }
   *
   * SuggestionItem:
   * {
   *   barcode: string,
   *   name: string,
   *   company: string,
   *   category: string,
   *   price: number,
   *   size?: string,
   *   image_url: string,
   *   days_since_last_purchase: number,
   *   average_purchase_interval: number,
   *   due_ratio: number,
   *   status: 'due_soon' | 'overdue'
   * }
   */
  getSuggestions: async (phone, cartBarcodes = []) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CHECKOUT.SUGGESTIONS(phone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({
          cart_barcodes: cartBarcodes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to get checkout suggestions:', error);
      return {
        success: false,
        error: error.message || 'Failed to get suggestions',
      };
    }
  },

  /**
   * Process checkout
   * Tracks all cart items in DB and clears cart session
   *
   * @param {string} phone - User's phone number
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   *
   * Response data structure:
   * {
   *   message: string,
   *   items_tracked: number,
   *   checkout_time: string (ISO datetime)
   * }
   */
  processCheckout: async (phone) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CHECKOUT.PROCESS(phone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to process checkout:', error);
      return {
        success: false,
        error: error.message || 'Checkout failed',
      };
    }
  },
};
