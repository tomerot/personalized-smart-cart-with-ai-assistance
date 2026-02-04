import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * CheckoutSuccessModal Component
 *
 * Shows a success message after checkout and redirects to landing page
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed (returns to landing)
 */
const CheckoutSuccessModal = ({
  isOpen,
  onClose,
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

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

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
                   w-[min(450px,90vw)]
                   p-8 rounded-2xl shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <Icon
            name={ICONS.CHECK_CIRCLE}
            size={56}
            weight={400}
            fill={1}
            style={{ color: "#16a34a" }}
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3 text-center">
          Thank You!
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center">
          Payment approved successfully
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessModal;
