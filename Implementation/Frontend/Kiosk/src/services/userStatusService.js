/**
 * User Status Service
 * Handles user-related API calls (status, cart session)
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, fetchWithTimeout } from '@/config/api.config';
import { formatPhoneForBackend } from '@/utils/formatters';

export const userStatusService = {
  /**
   * Get user status (active cart and shopping list flags)
   * @param {string} phoneNumber - Full phone number in local format (e.g., "0541234567")
   * @returns {Promise<{success: boolean, status?: {has_active_cart: boolean, has_shopping_list: boolean}, message?: string}>}
   */
  getUserStatus: async (phoneNumber) => {
    try {
      const internationalPhone = formatPhoneForBackend(phoneNumber);
      const url = `${API_BASE_URL}${API_ENDPOINTS.USERS.STATUS(internationalPhone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      return { 
        success: true, 
        status: {
          has_active_cart: data.has_active_cart,
          has_shopping_list: data.has_shopping_list,
        }
      };
    } catch (error) {
      console.error('Failed to get user status:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to get user status' 
      };
    }
  },

  /**
   * Get user's cart session
   * @param {string} phoneNumber - Full phone number in local format (e.g., "0541234567")
   * @returns {Promise<{success: boolean, cart?: {phone: string, items: Array, last_updated: string}, message?: string}>}
   */
  getCart: async (phoneNumber) => {
    try {
      const internationalPhone = formatPhoneForBackend(phoneNumber);
      const url = `${API_BASE_URL}${API_ENDPOINTS.CART.GET(internationalPhone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      // Backend returns: { phone, items, last_updated }
      return { 
        success: true, 
        cart: {
          phone: data.phone,
          items: data.items,
          last_updated: data.last_updated,
        }
      };
    } catch (error) {
      console.error('Failed to get cart:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to get cart session' 
      };
    }
  },
};

