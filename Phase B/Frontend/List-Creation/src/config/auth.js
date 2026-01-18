/**
 * Authentication Configuration
 */

export const AUTH_CONFIG = {
  // Phone input
  PHONE_PREFIX: '05',
  PHONE_TOTAL_DIGITS: 10,
  PHONE_PATTERN: /^05\d{8}$/, // Israeli mobile format

  // OTP
  OTP_LENGTH: 6,
  OTP_TIMER_SECONDS: 180, // 3 minutes
};
