import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import Numpad from "@/components/numpad/Numpad";
import DigitInputRow from "@/components/digitInput/DigitInputRow";
import { authService } from "@/services/authService";
import { AUTH_CONFIG } from "@/config/auth.config";

function PhoneInputPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNumberClick = (digit) => {
    if (inputValue.length < AUTH_CONFIG.PHONE_INPUT_DIGITS) {
      setInputValue(inputValue + digit);
    }
  };

  const handleBackspace = () => {
    setInputValue(inputValue.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (inputValue.length === AUTH_CONFIG.PHONE_INPUT_DIGITS && !isLoading) {
      const fullPhoneNumber = AUTH_CONFIG.PHONE_PREFIX + inputValue;
      console.log("Submitted phone number:", fullPhoneNumber);

      setIsLoading(true);

      // Send OTP to phone number
      const result = await authService.sendOtp(fullPhoneNumber);

      setIsLoading(false);

      if (result.success) {
        console.log("OTP sent successfully");
        // Navigate to OTP page with phone number
        navigate("/auth/otp", { state: { phoneNumber: fullPhoneNumber } });
      } else {
        // Log error but don't show to user
        console.error("Failed to send OTP:", result.message);
      }
    }
  };

  const isSubmitEnabled = inputValue.length === AUTH_CONFIG.PHONE_INPUT_DIGITS && !isLoading;
  const activeIndex = AUTH_CONFIG.PHONE_PREFIX.length + inputValue.length;

  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-between w-full h-full py-[5vh]">
        {/* Top section - Prompt and digit input - ANIMATED */}
        <div className="flex flex-col items-center justify-center flex-1 gap-[clamp(2rem,4vh,4rem)] animate-fadeIn">
          <div className="flex flex-col items-center gap-[clamp(1.5rem,3vh,3rem)]">
            {/* Prompt text */}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-black">
                Enter Your Phone Number
              </h2>

              <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-600">
                An SMS will be sent for verification
              </p>
            </div>

            {/* Digit input boxes */}
            <DigitInputRow
              value={inputValue}
              totalDigits={AUTH_CONFIG.PHONE_TOTAL_DIGITS}
              activeIndex={activeIndex}
              dashPositions={[2]} // Dash after index 2 (after "05" and one more digit)
              prefillValue={AUTH_CONFIG.PHONE_PREFIX}
            />
          </div>
        </div>

        {/* Bottom section - Numpad - STATIC (no animation) */}
        <div className="flex items-center justify-center pb-[3vh]">
          <Numpad
            onNumberClick={handleNumberClick}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
            isSubmitEnabled={isSubmitEnabled}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default PhoneInputPage;
