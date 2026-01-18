/**
 * Shopping List Service
 * Handles shopping list CRUD operations
 */

import { API_BASE_URL, convertPhoneToInternational } from '@/config';

export const shoppingListService = {
  /**
   * Get user's shopping list
   * @param {string} phone - Local phone number
   * @returns {Promise<{success: boolean, data?: object, message?: string}>}
   */
  getShoppingList: async (phone) => {
    const internationalPhone = convertPhoneToInternational(phone);

    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-list/${encodeURIComponent(internationalPhone)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 404) {
        // No list exists yet - not an error
        return { success: true, data: null };
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get shopping list:', error);
      return { success: false, message: error.message || 'Failed to load shopping list' };
    }
  },

  /**
   * Save or update shopping list
   * @param {string} phone - Local phone number
   * @param {array} items - Array of ProductItemData objects
   * @returns {Promise<{success: boolean, data?: object, message?: string}>}
   */
  saveShoppingList: async (phone, items) => {
    const internationalPhone = convertPhoneToInternational(phone);

    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-list/${encodeURIComponent(internationalPhone)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        }
      );

      // 204 No Content means list was deleted (empty items)
      if (response.status === 204) {
        return { success: true, data: null, message: 'Shopping list cleared' };
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data, message: 'Shopping list saved successfully' };
    } catch (error) {
      console.error('Failed to save shopping list:', error);
      return { success: false, message: error.message || 'Failed to save shopping list' };
    }
  },

  /**
   * Delete shopping list
   * @param {string} phone - Local phone number
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  deleteShoppingList: async (phone) => {
    const internationalPhone = convertPhoneToInternational(phone);

    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-list/${encodeURIComponent(internationalPhone)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

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
      return { success: false, message: error.message || 'Failed to delete shopping list' };
    }
  },
};
