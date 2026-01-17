import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import Numpad from "@/components/numpad/Numpad";
import DigitInputRow from "@/components/digitInput/DigitInputRow";

function PhoneInputPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

  const prefillValue = "05"; // Israeli phone numbers start with 05
  const requiredLength = 8; // 8 digits for phone (excluding 05 prefix)

  const handleNumberClick = (digit) => {
    if (inputValue.length < requiredLength) {
      setInputValue(inputValue + digit);
    }
  };

  const handleBackspace = () => {
    setInputValue(inputValue.slice(0, -1));
  };

  const handleSubmit = () => {
    if (inputValue.length === requiredLength) {
      const fullPhoneNumber = prefillValue + inputValue;
      console.log("Submitted phone number:", fullPhoneNumber);
      // TODO: Send OTP to phone number
      // Navigate to OTP page with phone number
      navigate("/auth/otp", { state: { phoneNumber: fullPhoneNumber } });
    }
  };

  const isSubmitEnabled = inputValue.length === requiredLength;
  const activeIndex = prefillValue.length + inputValue.length;

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
              totalDigits={10}
              activeIndex={activeIndex}
              dashPositions={[2]} // Dash after index 2 (after "05" and one more digit)
              prefillValue={prefillValue}
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

