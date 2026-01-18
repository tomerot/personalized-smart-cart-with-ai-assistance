/**
 * Formatting Utilities
 * Pure functions for formatting data for display
 */

/**
 * Format Israeli phone number for display (05X-XXXXXXX)
 * @param {string} phone - 10-digit phone number
 * @returns {string} Formatted phone number with dash
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3)}`;
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

