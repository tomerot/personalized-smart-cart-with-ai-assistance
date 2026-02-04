import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';
import { LoadingSpinner, Toast } from '@/components/ui';
import { authService } from '@/services';
import { AUTH_CONFIG } from '@/config';
import { formatPhoneForDisplay, formatTime } from '@/utils';

function OtpInputPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const phoneNumber = location.state?.phoneNumber;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(AUTH_CONFIG.OTP_TIMER_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' });

  const inputRefs = useRef([]);

  // Redirect if no phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate('/auth/phone', { replace: true });
    }
  }, [phoneNumber, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, go to previous
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      // Focus the next empty input or last input
      const nextEmptyIndex = newOtp.findIndex((d) => !d);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const otpCode = otp.join('');
  const isOtpComplete = otpCode.length === AUTH_CONFIG.OTP_LENGTH;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOtpComplete) return;

    setIsLoading(true);

    const result = await authService.verifyOtp(phoneNumber, otpCode);

    setIsLoading(false);

    if (result.success) {
      // Store user data and navigate to list creation
      sessionStorage.setItem('user', JSON.stringify({ phone: phoneNumber, ...result.user }));
      navigate('/list', { replace: true });
    } else {
      setToast({
        visible: true,
        message: result.message || 'Invalid verification code',
        variant: 'error',
      });
      // Clear OTP and refocus first input
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    const result = await authService.resendOtp(phoneNumber);
    setIsLoading(false);

    if (result.success) {
      setTimeLeft(AUTH_CONFIG.OTP_TIMER_SECONDS);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setToast({
        visible: true,
        message: 'New code sent!',
        variant: 'success',
      });
    } else {
      setToast({
        visible: true,
        message: result.message || 'Failed to resend code',
        variant: 'error',
      });
    }
  };

  const handleChangePhone = () => {
    navigate('/auth/phone', { replace: true });
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      {/* Toast */}
      <Toast
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        message={toast.message}
        variant={toast.variant}
      />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Back button */}
          <button
            onClick={handleChangePhone}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <Icon name={ICONS.BACK} size={20} />
            <span>Change phone number</span>
          </button>

          {/* OTP input card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Icon name={ICONS.SMS} size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Enter Verification Code
              </h2>
              <p className="text-gray-500 text-sm">
                Code sent to <span className="font-medium">{formatPhoneForDisplay(phoneNumber)}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* OTP inputs */}
              <div className="flex justify-center gap-2 md:gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold
                              border-2 rounded-xl outline-none transition-all
                              ${digit ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                              focus:border-green-500 focus:ring-0
                              disabled:bg-gray-100`}
                  />
                ))}
              </div>

              {/* Timer / Resend */}
              <div className="text-center mb-6">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Resend Code
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Resend code in <span className="font-medium">{formatTime(timeLeft)}</span>
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isOtpComplete || isLoading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all
                          flex items-center justify-center gap-2
                          ${
                            isOtpComplete && !isLoading
                              ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpInputPage;
