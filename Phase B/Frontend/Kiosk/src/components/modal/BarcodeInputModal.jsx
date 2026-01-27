import { useState, useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";
import Numpad from "@/components/numpad/Numpad";

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
          {barcode || <span className="text-gray-400">Type Barcode</span>}
        </div>

        {/* Numpad */}
        <div className="w-full max-w-[280px]">
          <Numpad
            onNumberClick={handleNumberClick}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
            isSubmitEnabled={isSubmitEnabled}
            variant="modal"
          />
        </div>
      </div>
    </div>
  );
};

export default BarcodeInputModal;
