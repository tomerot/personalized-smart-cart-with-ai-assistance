/**
 * useBarcodeScanner Hook
 * Connects barcode scanner events to cart functionality
 * 
 * This hook:
 * 1. Listens for barcode scan events from the scanner controller
 * 2. Fetches product data from the backend (with user allergies/dietary needs)
 * 3. Transforms product data to cart format
 * 4. Adds scanned products to the cart
 * 5. Stores conflict/alternatives data for later handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { barcodeControllerService, BARCODE_EVENT_TYPES } from '@/services/barcodeControllerService';
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';

/**
 * Hook for handling barcode scanning and cart integration
 * @param {object} options - Hook options
 * @param {boolean} options.autoConnect - Whether to auto-connect on mount (default: true)
 * @param {function} options.onScanSuccess - Callback when product is successfully scanned and added
 * @param {function} options.onScanError - Callback when scan fails (product not found, etc.)
 * @param {function} options.onConflict - Callback when product has conflict with user preferences
 * @returns {object} Hook state and methods
 */
export function useBarcodeScanner({
  autoConnect = true,
  onScanSuccess,
  onScanError,
  onConflict,
} = {}) {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [lastError, setLastError] = useState(null);
  
  // TODO: Handle alternatives when product conflicts with user preferences
  // These alternatives will be shown to the user for selection
  const [pendingAlternatives, setPendingAlternatives] = useState(null);
  
  // Refs
  const isProcessing = useRef(false);
  
  // Context
  const { addProduct } = useCart();
  const { user } = useUser();

  /**
   * Handle barcode scanned event
   * @param {string} barcode - Scanned barcode
   */
  const handleBarcodeScanned = useCallback(async (barcode) => {
    // Prevent concurrent processing
    if (isProcessing.current) {
      console.log('Already processing a barcode, skipping...');
      return;
    }

    isProcessing.current = true;
    setIsLoading(true);
    setLastError(null);

    try {
      console.log(`Processing scanned barcode: ${barcode}`);

      // Get user's allergies and dietary needs
      const allergies = user?.allergies || [];
      const dietaryNeeds = user?.dietary_needs || [];

      // Fetch product data from backend
      const result = await productService.scanProduct(barcode, allergies, dietaryNeeds);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch product');
      }

      const { data } = result;
      const { original_product, has_conflict, alternatives, conflict_with_original } = data;

      // Transform product to cart item format
      const cartItem = productService.transformToCartItem(original_product);

      // Add product to cart
      addProduct(cartItem);
      setLastScannedProduct(cartItem);

      // Handle conflict scenario
      if (has_conflict) {
        console.log('Product has conflict with user preferences:', conflict_with_original);
        
        // TODO: Show alternatives UI to user when product conflicts with their preferences
        // The alternatives array contains safe alternative products
        // The conflict_with_original object contains details about the conflict:
        // - allergen_conflicts: List of allergens that conflict
        // - dietary_conflicts: List of dietary needs that conflict
        // - details: Human-readable conflict description
        setPendingAlternatives({
          originalProduct: original_product,
          conflict: conflict_with_original,
          alternatives: alternatives,
          totalAlternatives: data.total_alternatives,
        });

        // Notify parent component about conflict
        if (onConflict) {
          onConflict({
            product: cartItem,
            conflict: conflict_with_original,
            alternatives: alternatives,
          });
        }
      } else {
        // Clear any pending alternatives
        setPendingAlternatives(null);
      }

      // Notify parent component about success
      if (onScanSuccess) {
        onScanSuccess(cartItem, has_conflict);
      }

      console.log('Product added to cart:', cartItem.name);

    } catch (error) {
      console.error('Error processing barcode:', error);
      setLastError(error.message);

      // Notify parent component about error
      if (onScanError) {
        onScanError(barcode, error.message);
      }
    } finally {
      isProcessing.current = false;
      setIsLoading(false);
    }
  }, [user, addProduct, onScanSuccess, onScanError, onConflict]);

  /**
   * Handle scanner event
   * @param {object} event - Scanner event
   */
  const handleScannerEvent = useCallback((event) => {
    console.log('Received scanner event:', event);

    switch (event.event_type) {
      case BARCODE_EVENT_TYPES.BARCODE_SCANNED:
        handleBarcodeScanned(event.barcode);
        break;

      case BARCODE_EVENT_TYPES.INVALID_BARCODE:
        console.warn('Invalid barcode scanned');
        setLastError('Invalid barcode format');
        if (onScanError) {
          onScanError(null, 'Invalid barcode format');
        }
        break;

      case BARCODE_EVENT_TYPES.SCANNER_FAILURE:
        console.error('Scanner failure detected');
        setLastError('Barcode scanner malfunction');
        break;

      default:
        console.log('Unknown event type:', event.event_type);
    }
  }, [handleBarcodeScanned, onScanError]);

  /**
   * Connect to barcode scanner
   */
  const connect = useCallback(async () => {
    const connected = await barcodeControllerService.connect();
    setIsConnected(connected);
    return connected;
  }, []);

  /**
   * Disconnect from barcode scanner
   */
  const disconnect = useCallback(() => {
    barcodeControllerService.disconnect();
    setIsConnected(false);
  }, []);

  /**
   * Manually scan a barcode (for testing)
   * @param {string} barcode - Barcode to scan
   */
  const manualScan = useCallback((barcode) => {
    handleBarcodeScanned(barcode);
  }, [handleBarcodeScanned]);

  /**
   * Clear pending alternatives (after user has made a decision)
   */
  const clearPendingAlternatives = useCallback(() => {
    setPendingAlternatives(null);
  }, []);

  // Set up event listeners on mount
  useEffect(() => {
    // Subscribe to scanner events
    const unsubscribeEvents = barcodeControllerService.onEvent(handleScannerEvent);

    // Subscribe to connection status changes
    const unsubscribeConnection = barcodeControllerService.onConnectionChange(setIsConnected);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Check initial connection status
    setIsConnected(barcodeControllerService.isConnected());

    // Cleanup on unmount
    return () => {
      unsubscribeEvents();
      unsubscribeConnection();
    };
  }, [autoConnect, connect, handleScannerEvent]);

  return {
    // State
    isConnected,
    isLoading,
    lastScannedProduct,
    lastError,
    pendingAlternatives,

    // Methods
    connect,
    disconnect,
    manualScan,
    clearPendingAlternatives,
  };
}

export default useBarcodeScanner;

