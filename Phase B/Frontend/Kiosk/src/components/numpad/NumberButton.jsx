function NumberButton({ digit, onClick }) {
  return (
    <button
      onClick={() => onClick(digit)}
      className="bg-linear-to-b from-green-400 to-green-600 text-white text-[clamp(1.5rem,3vw,2.5rem)] font-semibold rounded-lg 
                 w-full aspect-square flex items-center justify-center
                 hover:from-green-500 hover:to-green-700 active:from-green-600 active:to-green-800 
                 transition-all shadow-md hover:shadow-lg
                 select-none"
    >
      {digit}
    </button>
  );
}

export default NumberButton;

