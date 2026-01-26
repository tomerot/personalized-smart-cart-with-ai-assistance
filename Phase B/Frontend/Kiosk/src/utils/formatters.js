/**
 * Formatting Utilities
 * Pure functions for formatting data for display
 */

/**
 * Format Israeli phone number for display (05X-XXXXXXX)
 * @param {string} phone - 10-digit phone number (e.g., "0541234567")
 * @returns {string} Formatted phone number with dash
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3)}`;
};

/**
 * Convert Israeli phone number from local format to international format
 * Converts from 05XXXXXXXX to +9725XXXXXXXX (removes leading 0, adds +972)
 * @param {string} phone - 10-digit phone number starting with 05 (e.g., "0541234567")
 * @returns {string} International format phone number (e.g., "+972541234567")
 */
export const formatPhoneForBackend = (phone) => {
  if (!phone || !phone.startsWith('05')) {
    console.error('Invalid phone number format. Expected 05XXXXXXXX');
    return phone;
  }
  // Remove the leading 0 and add +972
  return `+972${phone.slice(1)}`;
};

/**
 * Format seconds to mm:ss display
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string (e.g., "02:30")
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Format price for display with currency symbol
 * @param {number} price - Price value
 * @returns {string} Formatted price string (e.g., "₪12.50")
 */
export const formatPrice = (price) => {
  if (price == null || isNaN(price)) return '₪0.00';
  return `₪${price.toFixed(2)}`;
};

