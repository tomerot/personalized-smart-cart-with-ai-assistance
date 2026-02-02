function NumberButton({ digit, onClick, variant = "default" }) {
  const isModalVariant = variant === "modal";
  
  const buttonClass = isModalVariant
    ? "aspect-square rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-2xl font-semibold transition-colors duration-150 flex items-center justify-center select-none"
    : "bg-linear-to-b from-green-400 to-green-600 text-white text-[clamp(1.5rem,3vw,2.5rem)] font-semibold rounded-lg w-full aspect-square flex items-center justify-center hover:from-green-500 hover:to-green-700 active:from-green-600 active:to-green-800 transition-all shadow-md hover:shadow-lg select-none";
  
  return (
    <button
      onClick={() => onClick(digit)}
      className={buttonClass}
    >
      {digit}
    </button>
  );
}

export default NumberButton;

