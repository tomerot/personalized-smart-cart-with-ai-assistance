import smartCartBg from "@/assets/smart-cart-bg.png";

function LandingLayout({ children, isFadingOut, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`relative w-full h-full transition-opacity duration-800 cursor-pointer ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* White rectangle behind the cart image, in front of gradient */}
      <div className="absolute left-0 top-0 h-full w-[35%] bg-white z-0" />

      {/* Smart cart image at leftmost position - uncropped, fixed aspect ratio */}
      <img
        src={smartCartBg}
        alt="Smart Cart"
        className="absolute left-0 top-0 h-full w-auto z-1"
      />

      {/* Page content layered on top - centered in the whitespace after the image */}
      <div className="absolute left-[65%] right-0 top-0 z-2 flex items-center justify-center h-full">
        {children}
      </div>
    </div>
  );
}

export default LandingLayout;
