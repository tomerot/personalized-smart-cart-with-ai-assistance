/**
 * Authentication Service
 * Handles OTP sending and verification
 */

import { API_BASE_URL, convertPhoneToInternational } from '@/config';

export const authService = {
  /**
   * Send OTP to phone number
   * @param {string} phone - Local phone number (e.g., "0541234567")
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  sendOtp: async (phone) => {
    const internationalPhone = convertPhoneToInternational(phone);

    try {
      const response = await fetch(
        `${API_BASE_URL}/otp/${encodeURIComponent(internationalPhone)}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error: ${response.status}`);
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { success: false, message: error.message || 'Failed to send verification code' };
    }
  },

  /**
   * Verify OTP code
   * @param {string} phone - Local phone number
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<{success: boolean, user?: object, message?: string}>}
   */
  verifyOtp: async (phone, otpCode) => {
    const internationalPhone = convertPhoneToInternational(phone);

    try {
      const response = await fetch(
        `${API_BASE_URL}/otp/${encodeURIComponent(internationalPhone)}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp_code: otpCode }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, message: error.detail || 'Invalid or expired OTP' };
      }

      const data = await response.json();
      return { success: true, user: data.user, message: data.message };
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      return { success: false, message: error.message || 'Failed to verify code' };
    }
  },

  /**
   * Resend OTP to phone number
   * @param {string} phone - Local phone number
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  resendOtp: async (phone) => {
    return authService.sendOtp(phone);
  },
};
