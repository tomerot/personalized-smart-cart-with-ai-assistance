import { useState, useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * BarcodeInputModal Component
 *
 * A modal for manually entering a barcode using a numpad
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onSubmit - Callback when barcode is submitted (receives barcode string)
 * @param {function} onClose - Callback when modal is closed/cancelled
 */
const BarcodeInputModal = ({ isOpen, onSubmit, onClose }) => {
  const [barcode, setBarcode] = useState("");

  // Reset barcode when modal opens
  useEffect(() => {
    if (isOpen) {
      setBarcode("");
    }
  }, [isOpen]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleNumberClick = (digit) => {
    setBarcode((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setBarcode((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (barcode.length > 0) {
      onSubmit(barcode);
    }
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const isSubmitEnabled = barcode.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[2vw] animate-fadeIn"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative flex flex-col items-center
                   min-w-[min(400px,90vw)] max-w-[min(500px,90vw)]
                   p-8 pt-6
                   rounded-2xl
                   shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - top left */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4
                     hover:opacity-70 active:opacity-50 transition-opacity
                     cursor-pointer"
          aria-label="Close modal"
        >
          <Icon
            name={ICONS.CLOSE}
            size={32}
            weight={500}
            style={{ color: "#374151" }}
          />
        </button>

        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-6">
          <Icon
            name={ICONS.BARCODE}
            size={32}
            weight={500}
            style={{ color: "#16a34a" }}
          />
          <h2 className="text-xl font-semibold text-gray-800">
            Enter Barcode
          </h2>
        </div>

        {/* Barcode Display */}
        <div
          className="w-full mb-6 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50
                     text-center text-2xl font-mono tracking-widest min-h-[60px]
                     flex items-center justify-center"
        >
          {barcode || <span className="text-gray-400">Type barcode...</span>}
        </div>

        {/* Numpad */}
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          {/* Grid for digits 1-9 */}
          <div className="grid grid-cols-3 gap-3">
            {digits.map((digit) => (
              <button
                key={digit}
                onClick={() => handleNumberClick(digit)}
                className="aspect-square rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300
                           text-2xl font-semibold text-gray-800
                           transition-colors duration-150
                           flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Bottom row: Backspace, 0, OK */}
          <div className="grid grid-cols-3 gap-3">
            {/* Backspace button */}
            <button
              onClick={handleBackspace}
              disabled={barcode.length === 0}
              className={`aspect-square rounded-xl flex items-center justify-center
                         transition-opacity duration-150
                         ${barcode.length === 0
                           ? "text-gray-300 cursor-not-allowed"
                           : "text-green-600 hover:opacity-70 active:opacity-50"}`}
            >
              <Icon name={ICONS.BACKSPACE} size={36} weight={400} />
            </button>

            {/* 0 button */}
            <button
              onClick={() => handleNumberClick(0)}
              className="aspect-square rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300
                         text-2xl font-semibold text-gray-800
                         transition-colors duration-150
                         flex items-center justify-center"
            >
              0
            </button>

            {/* OK button */}
            <button
              onClick={handleSubmit}
              disabled={!isSubmitEnabled}
              className={`aspect-square rounded-xl flex items-center justify-center
                         text-xl font-semibold transition-all duration-150
                         ${isSubmitEnabled
                           ? "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white cursor-pointer"
                           : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeInputModal;
