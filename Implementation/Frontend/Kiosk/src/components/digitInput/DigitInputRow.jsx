import DigitInput from "./DigitInput";

/**
 * DigitInputRow Component
 * 
 * A flexible component for creating rows of digit input boxes with optional dashes
 * 
 * @param {string} value - The current input value (e.g., "0512345678")
 * @param {number} totalDigits - Total number of digit boxes to display
 * @param {number} activeIndex - Index of the currently active input box
 * @param {Array<number>} dashPositions - Array of positions where dashes should appear (e.g., [2, 3] for "05 3-...")
 * @param {string} prefillValue - Pre-filled value that cannot be edited (e.g., "05")
 * 
 * Example usage:
 * <DigitInputRow 
 *   value="0512345" 
 *   totalDigits={10} 
 *   activeIndex={7} 
 *   dashPositions={[2, 3]} 
 *   prefillValue="05"
 * />
 * This renders: 05 3-45_____
 */
function DigitInputRow({ 
  value = "", 
  totalDigits = 10, 
  activeIndex = 0,
  dashPositions = [],
  prefillValue = ""
}) {
  const prefillLength = prefillValue.length;
  const fullValue = prefillValue + value;
  
  // Create array of totalDigits length, each element is the digit at that position or empty string
  const allDigits = Array.from({ length: totalDigits }, (_, index) => 
    fullValue[index] || ""
  );

  return (
    <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
      {allDigits.map((digit, index) => {
        const isDisabled = index < prefillLength;
        const isActive = index === activeIndex && !isDisabled;

        return (
          <div key={index} className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
            <DigitInput
              value={digit}
              isActive={isActive}
              isDisabled={isDisabled}
            />
            {/* Add dash after this position if specified */}
            {dashPositions.includes(index) && (
              <span className="text-[clamp(2.5rem,4vw,4rem)] font-semibold text-black">
                -
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DigitInputRow;

