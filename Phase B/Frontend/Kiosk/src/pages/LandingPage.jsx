import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingLayout from "@/layouts/LandingLayout";
import { UI_CONFIG } from "@/data/uiConfig";

function LandingPage() {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  // Add a delay before accepting touches to prevent
  // accidental navigation when returning from another page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleScreenTouch = () => {
    // Ignore touches until ready
    if (!isReady || isFadingOut) return;

    // Start fade-out animation
    setIsFadingOut(true);

    // Navigate to phone input page after animation completes
    setTimeout(() => {
      navigate("/auth/phone");
    }, UI_CONFIG.FADE_TRANSITION_DURATION);
  };

  return (
    <LandingLayout isFadingOut={isFadingOut} onClick={handleScreenTouch}>
      <div className="text-center text-[#1a1a1a] w-full px-[clamp(0.5rem,2vw,2rem)]">
        {/* Main heading */}
        <h1 className="text-[clamp(1rem,2.8vw,3rem)] font-light mb-[clamp(0.8rem,2.5vh,2rem)] leading-tight whitespace-nowrap">
          Grocery Shopping,
          <br />
          <span className="italic font-semibold">reimagined.</span>
        </h1>

        {/* Animated call to action */}
        <p
          className="pulse-animation text-[clamp(0.7rem,1.5vw,1.3rem)] font-light whitespace-nowrap"
          style={{
            animationDuration: `${UI_CONFIG.PULSE_ANIMATION_DURATION}s`,
          }}
        >
          Touch the Screen to Start
        </p>
      </div>
    </LandingLayout>
  );
}

export default LandingPage;
