import NumberButton from "./NumberButton";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

function Numpad({ 
  onNumberClick, 
  onBackspace, 
  onSubmit, 
  isSubmitEnabled = false,
  variant = "default" // "default" or "modal"
}) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Modal variant uses fixed gaps and simpler styling
  const isModalVariant = variant === "modal";
  const gapClass = isModalVariant ? "gap-3" : "gap-[clamp(0.6rem,1.2vh,1rem)]";
  const containerClass = isModalVariant 
    ? "flex flex-col w-full" 
    : "flex flex-col justify-center h-full w-[clamp(200px,20vw,300px)]";

  return (
    <div className={`${containerClass} ${gapClass}`}>
      {/* Grid for digits 1-9 */}
      <div className={`grid grid-cols-3 ${gapClass}`}>
        {digits.map((digit) => (
          <NumberButton 
            key={digit} 
            digit={digit} 
            onClick={onNumberClick}
            variant={variant}
          />
        ))}
      </div>

      {/* Bottom row: Backspace, 0, OK */}
      <div className={`grid grid-cols-3 ${gapClass}`}>
        {/* Backspace button */}
        <button
          onClick={onBackspace}
          disabled={isModalVariant && false} // Modal variant backspace is always clickable visually
          className={
            isModalVariant
              ? "aspect-square rounded-xl flex items-center justify-center transition-opacity duration-150 text-green-600 hover:opacity-70 active:opacity-50 select-none"
              : "text-green-500 rounded-lg w-full aspect-square flex items-center justify-center hover:opacity-70 active:opacity-50 transition-opacity select-none"
          }
        >
          <Icon 
            name={ICONS.BACKSPACE} 
            size={isModalVariant ? 36 : 50} 
            weight={isModalVariant ? 400 : 270} 
          />
        </button>

        {/* 0 button */}
        <NumberButton digit={0} onClick={onNumberClick} variant={variant} />

        {/* OK button */}
        <button
          onClick={onSubmit}
          disabled={!isSubmitEnabled}
          className={
            isModalVariant
              ? `aspect-square flex items-center justify-center text-xl font-semibold transition-opacity select-none ${
                  isSubmitEnabled
                    ? "text-green-600 hover:opacity-70 active:opacity-50 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`
              : `text-[clamp(1.2rem,2.5vw,2rem)] font-semibold rounded-lg w-full aspect-square flex items-center justify-center transition-opacity select-none ${
                  isSubmitEnabled
                    ? "text-green-500 hover:opacity-70 active:opacity-50 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`
          }
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default Numpad;

