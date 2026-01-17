import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingLayout from "@/layouts/LandingLayout";

function LandingPage() {
  // Animation duration in seconds (change this to adjust speed)
  const pulseAnimationDuration = 2;
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  const handleScreenTouch = () => {
    // Start fade-out animation
    setIsFadingOut(true);
    
    // Navigate to phone input page after animation completes
    setTimeout(() => {
      navigate("/auth/phone");
    }, 800); // Animation duration: 800ms
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
            animationDuration: `${pulseAnimationDuration}s`,
          }}
        >
          Touch the Screen to Start
        </p>
      </div>
    </LandingLayout>
  );
}

export default LandingPage;
