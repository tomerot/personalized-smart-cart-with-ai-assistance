/**
 * User Context
 * Manages authenticated user state across the application
 */

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

/**
 * User Provider Component
 * Wraps the app to provide user state management
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasShoppingList, setHasShoppingList] = useState(false);
  const [savedCart, setSavedCart] = useState(null);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        sessionStorage.removeItem('user');
      }
    }

    // Load shopping list flag from sessionStorage
    const storedHasShoppingList = sessionStorage.getItem('hasShoppingList');
    if (storedHasShoppingList) {
      setHasShoppingList(storedHasShoppingList === 'true');
    }

    // Load saved cart from sessionStorage
    const storedCart = sessionStorage.getItem('savedCart');
    if (storedCart) {
      try {
        const cartData = JSON.parse(storedCart);
        setSavedCart(cartData);
      } catch (error) {
        console.error('Failed to parse stored cart data:', error);
        sessionStorage.removeItem('savedCart');
      }
    }
  }, []);

  /**
   * Login user - called after successful OTP verification
   * @param {object} userData - User data from backend { phone, allergies, dietary_needs }
   */
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    sessionStorage.setItem('user', JSON.stringify(userData));
    console.log('User logged in:', userData);
  };

  /**
   * Logout user - clears user state and session
   */
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setHasShoppingList(false);
    setSavedCart(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('hasShoppingList');
    sessionStorage.removeItem('savedCart');
    console.log('User logged out');
  };

  /**
   * Update user data - for profile updates, preferences changes, etc.
   * @param {object} updates - Partial user data to update
   */
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('User updated:', updatedUser);
  };

  /**
   * Set whether user has a shopping list
   * @param {boolean} hasListFlag - True if user has a shopping list
   */
  const setUserHasShoppingList = (hasListFlag) => {
    setHasShoppingList(hasListFlag);
    sessionStorage.setItem('hasShoppingList', hasListFlag.toString());
    console.log('Shopping list status updated:', hasListFlag);
  };

  /**
   * Set saved cart data (from crash recovery)
   * @param {object} cartData - Cart data { phone, items, last_updated }
   */
  const setSavedCartData = (cartData) => {
    setSavedCart(cartData);
    if (cartData) {
      sessionStorage.setItem('savedCart', JSON.stringify(cartData));
      console.log('Saved cart data updated:', cartData);
    } else {
      sessionStorage.removeItem('savedCart');
      console.log('Saved cart data cleared');
    }
  };

  /**
   * Clear saved cart data (after loading or dismissing)
   */
  const clearSavedCart = () => {
    setSavedCart(null);
    sessionStorage.removeItem('savedCart');
    console.log('Saved cart cleared');
  };

  const value = {
    user,
    isAuthenticated,
    hasShoppingList,
    savedCart,
    login,
    logout,
    updateUser,
    setUserHasShoppingList,
    setSavedCartData,
    clearSavedCart,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Custom hook to use User Context
 * @returns {object} User context value { user, isAuthenticated, login, logout, updateUser }
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

