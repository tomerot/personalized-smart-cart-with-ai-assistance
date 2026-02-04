/**
 * API Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://smart-cart-backend-nh7z.onrender.com';

/**
 * Convert Israeli phone number from local format to international format
 * 05XXXXXXXX -> +972XXXXXXXX
 * @param {string} phone - Local phone number (e.g., "0541234567")
 * @returns {string} International format (e.g., "+972541234567")
 */
export const convertPhoneToInternational = (phone) => {
  if (!phone) return phone;
  // Remove any spaces or dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Replace leading 0 with +972
  if (cleaned.startsWith('0')) {
    return '+972' + cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Convert international phone number back to local format for display
 * +972XXXXXXXX -> 05XXXXXXXX
 * @param {string} phone - International phone number
 * @returns {string} Local format
 */
export const convertPhoneToLocal = (phone) => {
  if (!phone) return phone;
  if (phone.startsWith('+972')) {
    return '0' + phone.slice(4);
  }
  return phone;
};
