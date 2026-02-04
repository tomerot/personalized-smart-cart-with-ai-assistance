/**
 * Cart Context
 * Manages shopping cart state across the application
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const CartContext = createContext(null);

/**
 * Cart Provider Component
 * Wraps the app to provide cart state management
 */
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const hasChangedRef = useRef(false);
  
  /**
   * Mark cart as changed (for auto-save)
   */
  const markAsChanged = useCallback(() => {
    hasChangedRef.current = true;
  }, []);

  /**
   * Calculate total price of all items in cart
   * @returns {number} Total price
   */
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.currentPrice, 0);
  };

  /**
   * Calculate total number of units in cart
   * @returns {number} Total units
   */
  const getTotalUnits = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * Add a new product to cart
   * Product is added on top (beginning of array)
   * @param {object} product - Product object { id, name, imageUrl, pricePerUnit, quantity }
   */
  const addProduct = useCallback((product) => {
    setCartItems(prevItems => {
      // Check if product already exists
      const existingIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingIndex !== -1) {
        // Product exists, increase quantity
        return prevItems.map(item => {
          if (item.id === product.id) {
            const newQuantity = item.quantity + 1;
            return {
              ...item,
              quantity: newQuantity,
              currentPrice: newQuantity * item.pricePerUnit,
            };
          }
          return item;
        });
      } else {
        // New product - add to beginning of array (top of list)
        const newProduct = {
          ...product,
          quantity: product.quantity || 1,
          currentPrice: (product.quantity || 1) * product.pricePerUnit,
        };
        return [newProduct, ...prevItems];
      }
    });
    markAsChanged();
  }, [markAsChanged]);

  /**
   * Increase quantity of a product
   * @param {string|number} productId - ID of the product
   */
  const increaseQuantity = useCallback((productId) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            currentPrice: newQuantity * item.pricePerUnit,
          };
        }
        return item;
      })
    );
    markAsChanged();
  }, [markAsChanged]);

  /**
   * Decrease quantity of a product
   * If quantity is 1, product is removed from cart
   * @param {string|number} productId - ID of the product
   */
  const decreaseQuantity = useCallback((productId) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === productId);
      
      if (!item) return prevItems;
      
      // If quantity is 1, remove the product
      if (item.quantity === 1) {
        return prevItems.filter(i => i.id !== productId);
      }
      
      // Otherwise, decrease quantity
      return prevItems.map(i => {
        if (i.id === productId) {
          const newQuantity = i.quantity - 1;
          return {
            ...i,
            quantity: newQuantity,
            currentPrice: newQuantity * i.pricePerUnit,
          };
        }
        return i;
      });
    });
    markAsChanged();
  }, [markAsChanged]);

  /**
   * Delete a product from cart
   * @param {string|number} productId - ID of the product
   */
  const deleteProduct = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    markAsChanged();
  }, [markAsChanged]);

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
    markAsChanged();
  }, [markAsChanged]);

  /**
   * Load cart from saved data (e.g., crash recovery)
   * @param {Array} items - Array of cart items
   */
  const loadCart = useCallback((items) => {
    setCartItems(items);
    // Don't mark as changed when loading from backup
  }, []);

  /**
   * Check if cart has changed since last save
   * Stable function reference using ref
   * @returns {boolean}
   */
  const getHasChanged = useCallback(() => {
    return hasChangedRef.current;
  }, []);

  /**
   * Reset the cart changed flag (after successful save)
   * Stable function reference
   */
  const resetChangedFlag = useCallback(() => {
    hasChangedRef.current = false;
  }, []);

  const value = {
    cartItems,
    totalPrice: getTotalPrice(),
    totalUnits: getTotalUnits(),
    addProduct,
    increaseQuantity,
    decreaseQuantity,
    deleteProduct,
    clearCart,
    loadCart,
    getHasChanged,
    resetChangedFlag,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Custom hook to use Cart Context
 * @returns {object} Cart context value
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

