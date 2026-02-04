import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * WarningModal Component
 *
 * A reusable warning modal with a single action button and dismissal options.
 * Used for warnings where user can proceed with an action or dismiss.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed (X button or backdrop click)
 * @param {function} onProceed - Callback when user chooses to proceed
 * @param {string} title - Modal title text
 * @param {string} message - Modal message text (can include JSX)
 * @param {string} proceedText - Text for proceed button (default: "Proceed")
 * @param {string} icon - Icon name from ICONS config (default: WARNING)
 * @param {string} iconColor - Color for the icon (default: "#f59e0b" amber)
 * @param {string} buttonColor - Background color for proceed button (default: amber-500)
 */
const WarningModal = ({
  isOpen,
  onClose,
  onProceed,
  title,
  message,
  proceedText = "Proceed",
  icon = ICONS.WARNING,
  iconColor = "#f59e0b",
  buttonColor = "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
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
            name={icon}
            size={64}
            weight={500}
            style={{ color: iconColor }}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          {title}
        </h2>

        {/* Message */}
        <div className="text-center text-gray-600 mb-6">
          {message}
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-100 mb-5" />

        {/* Proceed Button */}
        <button
          onClick={onProceed}
          className={`w-full flex items-center justify-center gap-2
                     text-white font-semibold text-lg
                     px-6 py-4 rounded-xl
                     transition-colors duration-150
                     cursor-pointer ${buttonColor}`}
        >
          {proceedText}
        </button>
      </div>
    </div>
  );
};

export default WarningModal;

