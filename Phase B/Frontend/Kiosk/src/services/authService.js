/**
 * Authentication Service
 * Handles all auth-related API calls (OTP sending, verification)
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, fetchWithTimeout } from '@/config/api.config';
import { formatPhoneForBackend } from '@/utils/formatters';

export const authService = {
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Full phone number in local format (e.g., "0541234567")
   * @returns {Promise<{success: boolean, message?: string, user?: object}>}
   */
  sendOtp: async (phoneNumber) => {
    try {
      // Convert phone number from 05XXXXXXXX to +9725XXXXXXXX
      const internationalPhone = formatPhoneForBackend(phoneNumber);
      const url = `${API_BASE_URL}${API_ENDPOINTS.OTP.SEND(internationalPhone)}`;

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to send verification code' 
      };
    }
  },

  /**
   * Verify OTP code
   * @param {string} phoneNumber - Full phone number in local format (e.g., "0541234567")
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<{success: boolean, user?: object, message?: string}>}
   */
  verifyOtp: async (phoneNumber, otpCode) => {
    try {
      // Convert phone number from 05XXXXXXXX to +9725XXXXXXXX
      const internationalPhone = formatPhoneForBackend(phoneNumber);
      const url = `${API_BASE_URL}${API_ENDPOINTS.OTP.VERIFY(internationalPhone)}`;
      const requestBody = { otp_code: otpCode };

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error: ${response.status}`);
      }

      // Backend returns: { message: "...", user: { phone, allergies, dietary_needs } }
      return { 
        success: true, 
        user: data.user,
        message: data.message 
      };
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to verify code' 
      };
    }
  },

  /**
   * Resend OTP to phone number
   * @param {string} phoneNumber - Full phone number in local format
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  resendOtp: async (phoneNumber) => {
    return authService.sendOtp(phoneNumber);
  },
};

