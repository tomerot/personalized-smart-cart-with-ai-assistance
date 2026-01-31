/**
 * Cart Auto-Save Service
 * 
 * Automatically saves cart to backend every 3 minutes for crash recovery.
 * Only syncs if cart has changed since last save.
 * 
 * This is a background service that users don't directly interact with.
 * Cart backup is deleted on checkout or session leave.
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, fetchWithTimeout } from '@/config/api.config';

class CartAutoSaveService {
  constructor() {
    this.intervalId = null;
    this.intervalMs = 3 * 60 * 1000; // 3 minutes
    this.isRunning = false;
    this.phone = null;
    this.getCartData = null;
    this.hasCartChanged = null;
    this.resetCartChangedFlag = null;
  }

  /**
   * Start the auto-save service
   * @param {string} phone - User's phone number
   * @param {Function} getCartData - Function that returns current cart items
   * @param {Function} hasCartChanged - Function that returns if cart changed since last save
   * @param {Function} resetCartChangedFlag - Function to reset the cart changed flag
   */
  start(phone, getCartData, hasCartChanged, resetCartChangedFlag) {
    if (this.isRunning) {
      console.log('⚠️ Cart auto-save already running');
      return;
    }

    this.phone = phone;
    this.getCartData = getCartData;
    this.hasCartChanged = hasCartChanged;
    this.resetCartChangedFlag = resetCartChangedFlag;
    this.isRunning = true;

    console.log('🔄 Cart auto-save started - will sync every 3 minutes');

    // Set interval to check and save every 3 minutes
    this.intervalId = setInterval(() => {
      this.checkAndSave();
    }, this.intervalMs);
  }

  /**
   * Check if cart changed and save if needed
   */
  async checkAndSave() {
    if (!this.isRunning) return;

    // Check if cart has changed
    const changed = this.hasCartChanged ? this.hasCartChanged() : false;
    
    console.log(`💾 Cart auto-save check: hasChanged = ${changed}`);
    
    if (!changed) {
      console.log('💾 Cart auto-save: No changes detected, skipping sync');
      return;
    }

    // Get current cart data
    const cartItems = this.getCartData ? this.getCartData() : [];
    
    try {
      if (cartItems.length === 0) {
        // Cart is empty - delete the backup instead of syncing empty array
        console.log('💾 Cart auto-save: Cart is empty, deleting backup...');
        await this.deleteCartBackup(this.phone);
      } else {
        // Cart has items - sync them
        console.log(`💾 Cart auto-save: Syncing ${cartItems.length} items...`);
        await this.syncCart(this.phone, cartItems);
      }
      
      // Reset the changed flag after successful operation
      if (this.resetCartChangedFlag) {
        this.resetCartChangedFlag();
      }
      
      console.log('✅ Cart auto-save: Operation successful');
    } catch (error) {
      console.error('❌ Cart auto-save: Operation failed', error);
    }
  }

  /**
   * Manually trigger a save (useful for testing or immediate save)
   */
  async triggerSave() {
    await this.checkAndSave();
  }

  /**
   * Stop the auto-save service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.phone = null;
    this.getCartData = null;
    this.hasCartChanged = null;
    this.resetCartChangedFlag = null;
    console.log('🛑 Cart auto-save stopped');
  }

  /**
   * Delete cart backup from backend
   * Called on checkout or session leave
   * @param {string} phone - User's phone number
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteCartBackup(phone) {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CART.DELETE(phone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS,
      });

      // 404 is ok - means no cart backup exists
      if (response.status === 404) {
        console.log('💾 Cart backup deletion: No backup found (already clean)');
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      console.log('✅ Cart backup deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete cart backup:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete cart backup',
      };
    }
  }

  /**
   * Sync cart to backend (internal helper)
   * @param {string} phone - User's phone number
   * @param {Array} cartItems - Cart items from frontend
   * @returns {Promise<void>}
   */
  async syncCart(phone, cartItems) {
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
  }
}

// Export singleton instance
export const cartAutoSaveService = new CartAutoSaveService();

