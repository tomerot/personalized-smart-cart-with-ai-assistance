function DigitInput({ value, isActive, isDisabled = false }) {
  const isFilled = value !== "";

  return (
    <div
      className={`
        w-[clamp(4rem,6vw,6rem)] 
        aspect-square
        flex items-center justify-center
        text-[clamp(2.5rem,4vw,4rem)] 
        font-semibold
        rounded-lg
        border-2
        transition-all
        shadow-md
        ${isDisabled ? 'border-gray-300 bg-gray-100/80' : ''}
        ${!isDisabled && isActive ? 'border-green-500 bg-white/80' : ''}
        ${!isDisabled && !isActive && isFilled ? 'border-gray-300 bg-gray-100/80' : ''}
        ${!isDisabled && !isActive && !isFilled ? 'border-gray-400 bg-white/80' : ''}
      `}
    >
      {value}
    </div>
  );
}

export default DigitInput;

