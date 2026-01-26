import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * ConfirmationModal Component
 *
 * A modal for confirming actions with confirm/cancel buttons
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onConfirm - Callback when confirmed
 * @param {function} onCancel - Callback when cancelled
 * @param {string} icon - Icon name from ICONS config (default: WARNING)
 * @param {string} title - Modal title text
 * @param {string} message - Modal message text
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} confirmColor - Background color for confirm button (default: red)
 * @param {string} iconColor - Color for the icon (default: "#f59e0b" amber)
 */
const ConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  icon = ICONS.WARNING,
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#dc2626",
  iconColor = "#f59e0b",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-[2vw] animate-fadeIn"
      onClick={onCancel}
    >
      {/* Backdrop - blurred and darkened */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative flex flex-col items-center justify-center
                   min-w-[min(400px,90vw)] max-w-[min(500px,90vw)]
                   p-[clamp(2rem,4vw,3rem)]
                   rounded-[clamp(1rem,2vw,1.5rem)]
                   shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mb-4">
          <Icon
            name={icon}
            size={64}
            fill={0}
            weight={500}
            style={{ color: iconColor }}
          />
        </div>

        {/* Title */}
        <h2 className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold text-gray-800 mb-2 text-center">
          {title}
        </h2>

        {/* Message */}
        {message && (
          <p className="text-[clamp(0.9rem,1.5vw,1.1rem)] text-gray-600 mb-6 text-center">
            {message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-4 w-full mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onCancel();
            }}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700
                       bg-gray-100 hover:bg-gray-200 active:bg-gray-300
                       transition-colors duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onConfirm();
            }}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-white
                       hover:opacity-90 active:opacity-80
                       transition-opacity duration-150"
            style={{ backgroundColor: confirmColor }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
