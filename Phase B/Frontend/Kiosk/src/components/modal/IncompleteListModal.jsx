import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * IncompleteListModal Component
 *
 * Shows a warning when user tries to checkout without collecting all items
 * from their shopping list that they intended to pick up.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed (X button)
 * @param {function} onProceed - Callback when user chooses to proceed anyway
 */
const IncompleteListModal = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative flex flex-col items-center
                   w-[min(520px,95vw)]
                   rounded-2xl shadow-2xl bg-white overflow-hidden
                   p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* X button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:opacity-70 active:opacity-50 transition-opacity"
          aria-label="Close modal"
        >
          <Icon
            name={ICONS.CLOSE}
            size={28}
            weight={500}
            style={{ color: "#374151" }}
          />
        </button>

        {/* Warning Icon */}
        <div className="mb-4 mt-2">
          <Icon
            name={ICONS.WARNING}
            size={64}
            weight={500}
            style={{ color: "#f59e0b" }}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Products Not Collected
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          You haven't collected all products from the shopping list.
          <br />
          Are you sure you want to proceed to checkout?
        </p>

        {/* Divider */}
        <div className="w-full border-t border-gray-100 mb-5" />

        {/* Proceed Button */}
        <button
          onClick={onProceed}
          className="w-full flex items-center justify-center gap-2
                     bg-amber-500 hover:bg-amber-600 active:bg-amber-700
                     text-white font-semibold text-lg
                     px-6 py-4 rounded-xl
                     transition-colors duration-150
                     cursor-pointer"
        >
          Proceed Anyway
        </button>
      </div>
    </div>
  );
};

export default IncompleteListModal;

