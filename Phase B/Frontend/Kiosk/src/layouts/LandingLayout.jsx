import ShaderGradientBackground from "@/components/shadergradient/ShaderGradient";
import smartCartBg from "@/assets/smart-cart-bg.png";

function LandingLayout({ children }) {
  return (
    <div className="relative w-screen h-screen bg-[#1a1a1a]">
      {/* Animated background */}
      <ShaderGradientBackground />

      {/* White rectangle behind the cart image, in front of gradient */}
      <div className="absolute left-0 top-0 h-screen w-[35%] bg-white z-0" />

      {/* Smart cart image at leftmost position - uncropped */}
      <img
        src={smartCartBg}
        alt="Smart Cart"
        className="absolute left-0 top-0 h-screen w-auto max-w-[60%] z-1"
      />

      {/* Page content layered on top */}
      <div className="relative z-2 flex items-center justify-end h-full pr-[clamp(2rem,8vw,8rem)] pl-[clamp(40%,55vw,65%)]">
        {children}
      </div>
    </div>
  );
}

export default LandingLayout;
