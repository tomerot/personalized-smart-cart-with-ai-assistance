/**
 * Shopping List Service
 * Handles shopping list API operations for the Kiosk app
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, fetchWithTimeout } from '@/config/api.config';
import { formatPhoneForBackend } from '@/utils/formatters';

export const shoppingListService = {
  /**
   * Get user's shopping list with items and optimized route
   * @param {string} phoneNumber - Full phone number in local format (e.g., "0541234567")
   * @returns {Promise<{success: boolean, data?: object, message?: string}>}
   */
  getShoppingList: async (phoneNumber) => {
    try {
      const internationalPhone = formatPhoneForBackend(phoneNumber);
      const url = `${API_BASE_URL}${API_ENDPOINTS.SHOPPING_LIST.GET(internationalPhone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      // 404 means no shopping list exists - not an error
      if (response.status === 404) {
        return { success: true, data: null };
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      
      // Backend returns: { phone, items, category_order, route_coordinates }
      return { 
        success: true, 
        data: {
          phone: data.phone,
          items: data.items || [],
          categoryOrder: data.category_order || [],
          routeCoordinates: data.route_coordinates || [],
        }
      };
    } catch (error) {
      console.error('Failed to get shopping list:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to load shopping list' 
      };
    }
  },

  /**
   * Delete user's shopping list (called after loading list to cart)
   * @param {string} phoneNumber - Full phone number in local format (e.g., "0541234567")
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  deleteShoppingList: async (phoneNumber) => {
    try {
      const internationalPhone = formatPhoneForBackend(phoneNumber);
      const url = `${API_BASE_URL}${API_ENDPOINTS.SHOPPING_LIST.DELETE(internationalPhone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS,
      });

      // 404 means no list to delete - not an error
      if (response.status === 404) {
        return { success: true, message: 'No list to delete' };
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error: ${response.status}`);
      }

      return { success: true, message: 'Shopping list deleted successfully' };
    } catch (error) {
      console.error('Failed to delete shopping list:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to delete shopping list' 
      };
    }
  },
};

