import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';
import { LoadingSpinner, Toast } from '@/components/ui';
import { authService } from '@/services';
import { AUTH_CONFIG } from '@/config';

function PhoneInputPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' });

  const handlePhoneChange = (e) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '');
    // Limit to 10 digits
    if (value.length <= AUTH_CONFIG.PHONE_TOTAL_DIGITS) {
      setPhoneNumber(value);
    }
  };

  const isValidPhone = AUTH_CONFIG.PHONE_PATTERN.test(phoneNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidPhone) {
      setToast({
        visible: true,
        message: 'Please enter a valid phone number (05XXXXXXXX)',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    const result = await authService.sendOtp(phoneNumber);

    setIsLoading(false);

    if (result.success) {
      // Navigate to OTP page with phone number
      navigate('/auth/otp', { state: { phoneNumber } });
    } else {
      setToast({
        visible: true,
        message: result.message || 'Failed to send verification code',
        variant: 'error',
      });
    }
  };

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
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 shadow-lg">
              <Icon name={ICONS.CART} size={40} fill={1} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Cart</h1>
            <p className="text-gray-600">Create your shopping list</p>
          </div>

          {/* Phone input card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Enter Your Phone Number
              </h2>
              <p className="text-gray-500 text-sm">
                We'll send you a verification code via SMS
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Phone input */}
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon name={ICONS.PHONE} size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="05X XXX XXXX"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl
                             focus:border-green-500 focus:ring-0 outline-none transition-colors
                             placeholder:text-gray-300"
                    disabled={isLoading}
                  />
                </div>
                {phoneNumber.length > 0 && !isValidPhone && (
                  <p className="mt-2 text-sm text-red-500">
                    Phone number must be 10 digits starting with 05
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isValidPhone || isLoading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all
                          flex items-center justify-center gap-2
                          ${
                            isValidPhone && !isLoading
                              ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <Icon name={ICONS.SMS} size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-6">
            By continuing, you agree to receive SMS messages
          </p>
        </div>
      </div>
    </div>
  );
}

export default PhoneInputPage;
