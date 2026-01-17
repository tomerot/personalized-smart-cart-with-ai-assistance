import NumberButton from "./NumberButton";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

function Numpad({ onNumberClick, onBackspace, onSubmit, isSubmitEnabled = false }) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex flex-col justify-center h-full gap-[clamp(0.6rem,1.2vh,1rem)] w-[clamp(200px,20vw,300px)]">
      {/* Grid for digits 1-9 */}
      <div className="grid grid-cols-3 gap-[clamp(0.6rem,1.2vh,1rem)]">
        {digits.map((digit) => (
          <NumberButton key={digit} digit={digit} onClick={onNumberClick} />
        ))}
      </div>

      {/* Bottom row: Backspace, 0, OK */}
      <div className="grid grid-cols-3 gap-[clamp(0.6rem,1.2vh,1rem)]">
        {/* Backspace button - just icon without background box */}
        <button
          onClick={onBackspace}
          className="text-green-500 rounded-lg 
                     w-full aspect-square flex items-center justify-center
                     hover:opacity-70 active:opacity-50 transition-opacity
                     select-none"
        >
          <Icon name={ICONS.BACKSPACE} size={50} weight={270} />
        </button>

        {/* 0 button */}
        <NumberButton digit={0} onClick={onNumberClick} />

        {/* OK button - just text without background box */}
        <button
          onClick={onSubmit}
          disabled={!isSubmitEnabled}
          className={`text-[clamp(1.2rem,2.5vw,2rem)] font-semibold rounded-lg 
                     w-full aspect-square flex items-center justify-center
                     transition-opacity select-none
                     ${
                       isSubmitEnabled
                         ? "text-green-500 hover:opacity-70 active:opacity-50 cursor-pointer"
                         : "text-gray-300 cursor-not-allowed"
                     }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default Numpad;

