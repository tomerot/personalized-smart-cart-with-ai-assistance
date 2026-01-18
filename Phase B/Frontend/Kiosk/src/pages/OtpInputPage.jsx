import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import AuthLayout from "@/layouts/AuthLayout";
import LoadingLayout from "@/layouts/LoadingLayout";
import Numpad from "@/components/numpad/Numpad";
import DigitInputRow from "@/components/digitInput/DigitInputRow";
import MessageModal from "@/components/modal/MessageModal";
import { ICONS } from "@/components/icons/icons.config";
import { formatPhoneForDisplay, formatTime } from "@/utils/formatters";
import { authService } from "@/services/authService";
import { userStatusService } from "@/services/userStatusService";
import { AUTH_CONFIG } from "@/data/authConfig";
import { UI_CONFIG } from "@/data/uiConfig";

function OtpInputPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, setUserHasShoppingList, setSavedCartData } = useUser();
  const phoneNumber = location.state?.phoneNumber;

  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(AUTH_CONFIG.OTP_TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
    if (inputValue.length < AUTH_CONFIG.OTP_LENGTH) {
      setInputValue(inputValue + digit);
    }
  };

  const handleBackspace = () => {
    setInputValue(inputValue.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (inputValue.length === AUTH_CONFIG.OTP_LENGTH && !isVerifying) {
      console.log("Submitted OTP:", inputValue);
      console.log("Phone number being verified:", phoneNumber);

      setIsVerifying(true);

      // Call auth service to verify OTP
      const result = await authService.verifyOtp(phoneNumber, inputValue);

      console.log("Verification result:", result);
      setIsVerifying(false);

      if (result.success) {
        // Correct OTP - store user data in context
        console.log("OTP verified successfully");
        console.log("User data:", result.user);
        
        // Store user data in context (which also persists to sessionStorage)
        if (result.user) {
          login(result.user);
        }
        
        setIsFadingOut(true);

        // After fade-out completes, show loading screen and fetch user status
        setTimeout(async () => {
          setIsLoading(true);

          // Fetch user status (shopping list and active cart flags)
          console.log("Fetching user status...");
          const statusResult = await userStatusService.getUserStatus(phoneNumber);
          
          if (statusResult.success && statusResult.status) {
            console.log("User status:", statusResult.status);
            
            // Save shopping list flag to context
            setUserHasShoppingList(statusResult.status.has_shopping_list);
            
            // If user has an active cart, fetch it
            if (statusResult.status.has_active_cart) {
              console.log("User has active cart, fetching cart data...");
              const cartResult = await userStatusService.getCart(phoneNumber);
              
              if (cartResult.success && cartResult.cart) {
                console.log("Cart fetched successfully:", cartResult.cart);
                setSavedCartData(cartResult.cart);
              } else {
                console.error("Failed to fetch cart:", cartResult.message);
              }
            } else {
              console.log("User has no active cart");
            }
          } else {
            console.error("Failed to fetch user status:", statusResult.message);
          }

          // TODO: Navigate to dashboard after data is loaded
          setTimeout(() => {
            console.log("Dashboard loaded - ready to navigate");
          }, 1000); // Short delay to ensure smooth transition
        }, UI_CONFIG.FADE_TRANSITION_DURATION);
      } else {
        // Wrong OTP - show error modal
        console.error("OTP verification failed:", result.message);
        setShowErrorModal(true);
        setInputValue(""); // Clear input
      }
    }
  };

  const handleResendCode = async () => {
    console.log("Resending code to:", phoneNumber);
    await authService.resendOtp(phoneNumber);
    setTimeLeft(AUTH_CONFIG.OTP_TIMER_SECONDS);
    setTimerActive(true);
    setInputValue("");
  };

  const handleChangePhoneNumber = () => {
    console.log("Going back to phone number entry");
    navigate("/auth/phone", { replace: true });
  };

  const isSubmitEnabled = inputValue.length === AUTH_CONFIG.OTP_LENGTH && !isVerifying;
  const activeIndex = inputValue.length;

  if (!phoneNumber) {
    return null; // Will redirect
  }

  // Show loading screen when OTP is verified
  if (isLoading) {
    return (
      <LoadingLayout>
        <p
          className="pulse-animation text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-green-600"
          style={{
            animationDuration: `${UI_CONFIG.PULSE_ANIMATION_DURATION}s`,
          }}
        >
          Preparing Dashboard...
        </p>
      </LoadingLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Error Modal */}
      <MessageModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        icon={ICONS.BLOCK}
        message={["Wrong verification code.", "Please try again."]}
        iconColor="black"
        textColor="black"
      />

      <div
        className={`flex flex-col items-center justify-between w-full h-full py-[5vh] transition-opacity duration-800 ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
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
                      A code was sent to {formatPhoneForDisplay(phoneNumber)}.
                      Code expires in {formatTime(timeLeft)} minutes.
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
              totalDigits={AUTH_CONFIG.OTP_LENGTH}
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
