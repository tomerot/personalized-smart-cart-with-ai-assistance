import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import Numpad from "@/components/numpad/Numpad";
import DigitInputRow from "@/components/digitInput/DigitInputRow";

function OtpInputPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const phoneNumber = location.state?.phoneNumber;

  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [timerActive, setTimerActive] = useState(true);

  const requiredLength = 6; // 6 digits for OTP

  // Redirect to phone input if no phone number is provided
  useEffect(() => {
    if (!phoneNumber) {
      navigate("/auth/phone", { replace: true });
    }
  }, [phoneNumber, navigate]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerActive, timeLeft]);

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
      console.log("Submitted OTP:", inputValue);
      // TODO: Verify OTP
      // On success, navigate to next page
    }
  };

  const handleResendCode = () => {
    console.log("Resending code to:", phoneNumber);
    setTimeLeft(180);
    setTimerActive(true);
    setInputValue("");
    // TODO: Resend OTP
  };

  const handleChangePhoneNumber = () => {
    console.log("Going back to phone number entry");
    navigate("/auth/phone", { replace: true });
  };

  const isSubmitEnabled = inputValue.length === requiredLength;
  const activeIndex = inputValue.length;

  // Format phone number for display (054-12345678 format)
  const formatPhoneForDisplay = (phone) => {
    if (!phone || phone.length !== 10) return phone;
    // Format as 05X-XXXXXXX (first 3 digits, dash, remaining 7 digits)
    return `${phone.slice(0, 3)}-${phone.slice(3)}`;
  };

  // Format timer (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!phoneNumber) {
    return null; // Will redirect
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-between w-full h-full py-[5vh]">
        {/* Top section - Prompt and digit input - ANIMATED */}
        <div className="flex flex-col items-center justify-center flex-1 gap-[clamp(2rem,4vh,4rem)] animate-fadeIn">
          <div className="flex flex-col items-center gap-[clamp(1.5rem,3vh,3rem)]">
            {/* Prompt text */}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-black">
                Enter the Verification Code
              </h2>
              
              <div className="flex flex-col items-center gap-3">
                {timerActive ? (
                  <>
                    <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-gray-600">
                      A code was sent to {formatPhoneForDisplay(phoneNumber)}. Code expires in {formatTime(timeLeft)} minutes.
                    </p>
                    <button
                      onClick={handleChangePhoneNumber}
                      className="text-[clamp(1rem,1.5vw,1.25rem)] font-bold 
                                bg-linear-to-b from-green-400 to-green-600
                                bg-clip-text text-transparent
                                hover:opacity-70 active:opacity-50 transition-opacity
                                cursor-pointer"
                    >
                      Wrong phone number? Tap to change
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleResendCode}
                    className="text-[clamp(1rem,1.5vw,1.25rem)] font-bold 
                              bg-linear-to-b from-green-400 to-green-600
                              bg-clip-text text-transparent
                              hover:opacity-70 active:opacity-50 transition-opacity
                              cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            {/* Digit input boxes */}
            <DigitInputRow
              value={inputValue}
              totalDigits={6}
              activeIndex={activeIndex}
              dashPositions={[]} // No dashes for OTP
              prefillValue=""
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

export default OtpInputPage;

