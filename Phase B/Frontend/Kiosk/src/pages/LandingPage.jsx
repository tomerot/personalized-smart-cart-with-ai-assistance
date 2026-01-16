import LandingLayout from "@/layouts/LandingLayout";

function LandingPage() {
  // Animation duration in seconds (change this to adjust speed)
  const pulseAnimationDuration = 2;

  return (
    <LandingLayout>
      <div className="text-center text-[#1a1a1a] max-w-[600px]">
        {/* Main heading */}
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-light mb-8 leading-tight">
          Grocery Shopping,{" "}
          <span className="italic font-normal">reimagined.</span>
        </h1>

        {/* Animated call to action */}
        <p
          className="pulse-animation text-[clamp(1.2rem,2.5vw,1.5rem)] font-light"
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
