/**
 * Formatting Utilities
 */

/**
 * Format Israeli phone number for display (05X-XXX-XXXX)
 * @param {string} phone - 10-digit phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return phone;
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length !== 10) return phone;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

/**
 * Format seconds to mm:ss display
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string (e.g., "02:30")
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format price for display
 * @param {number} price - Price value
 * @returns {string} Formatted price with currency symbol
 */
export const formatPrice = (price) => {
  if (price == null) return '';
  return `₪${price.toFixed(2)}`;
};
