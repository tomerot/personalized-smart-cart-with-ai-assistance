/**
 * Authentication Service
 * Handles all auth-related API calls (OTP sending, verification)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Set to true to use mock responses (when backend is not available)
const USE_MOCK = true;

// Mock OTP code for testing
const MOCK_OTP_CODE = '111111';

export const authService = {
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Full phone number (e.g., "0541234567")
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  sendOtp: async (phoneNumber) => {
    // Mock mode for development
    if (USE_MOCK) {
      console.log(`[MOCK] Sending OTP to ${phoneNumber}`);
      return { success: true, message: 'OTP sent successfully' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { success: false, message: 'Failed to send verification code' };
    }
  },

  /**
   * Verify OTP code
   * @param {string} phoneNumber - Full phone number
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<{success: boolean, token?: string, message?: string}>}
   */
  verifyOtp: async (phoneNumber, otpCode) => {
    // Mock mode for development
    if (USE_MOCK) {
      console.log(`[MOCK] Verifying OTP ${otpCode} for ${phoneNumber}`);
      if (otpCode === MOCK_OTP_CODE) {
        return { success: true, token: 'mock-jwt-token' };
      }
      return { success: false, message: 'Invalid OTP code' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otpCode }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      return { success: false, message: 'Failed to verify code' };
    }
  },

  /**
   * Resend OTP to phone number
   * @param {string} phoneNumber - Full phone number
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  resendOtp: async (phoneNumber) => {
    return authService.sendOtp(phoneNumber);
  },
};

