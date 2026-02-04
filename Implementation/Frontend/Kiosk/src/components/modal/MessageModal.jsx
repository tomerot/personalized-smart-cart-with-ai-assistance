import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * MessageModal Component
 * 
 * A reusable modal for displaying messages (warnings, errors, info, etc.)
 * Features a backdrop blur/dark overlay, icon, close button, and message text
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} icon - Icon name from ICONS config
 * @param {string|array} message - Message text (string or array of strings for multiple lines)
 * @param {string} iconColor - Color for the icon (default: "black")
 * @param {number} iconSize - Size of the icon in pixels (default: 80)
 * @param {string} backgroundColor - Background color of modal (default: "white")
 * @param {string} textColor - Color for message text (default: "black")
 * @param {string} closeIconColor - Color for close button (default: "black")
 * @param {number} closeIconSize - Size of close icon in pixels (default: 32)
 * @param {string} className - Additional CSS classes for the modal container
 */
const MessageModal = ({
  isOpen,
  onClose,
  icon,
  message,
  iconColor = "black",
  iconSize = 80,
  backgroundColor = "white",
  textColor = "black",
  closeIconColor = "black",
  closeIconSize = 32,
  className = "",
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

  // Convert message to array if it's a string
  const messageLines = Array.isArray(message) ? message : [message];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[2vw] animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop - blurred and darkened */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className={`relative flex flex-col items-center justify-center
                    min-w-[min(400px,90vw)] max-w-[min(600px,90vw)]
                    min-h-[min(300px,50vh)]
                    p-[clamp(2rem,4vw,4rem)]
                    rounded-[clamp(1rem,2vw,2rem)]
                    shadow-2xl
                    ${className}`}
        style={{ backgroundColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-[clamp(1rem,2vw,1.5rem)] right-[clamp(1rem,2vw,1.5rem)]
                     hover:opacity-70 active:opacity-50 transition-opacity
                     cursor-pointer"
          aria-label="Close modal"
        >
          <Icon
            name={ICONS.CLOSE}
            size={closeIconSize}
            weight={500}
            style={{ color: closeIconColor }}
          />
        </button>

        {/* Icon - top center */}
        <div className="mb-[clamp(1.5rem,3vh,2rem)]">
          <Icon
            name={icon}
            size={iconSize}
            fill={0}
            weight={500}
            style={{ color: iconColor }}
          />
        </div>

        {/* Message text - center */}
        <div className="flex flex-col items-center justify-center gap-[clamp(0.5rem,1vh,1rem)] text-center">
          {messageLines.map((line, index) => (
            <p
              key={index}
              className="text-[clamp(1.2rem,2vw,1.8rem)] font-medium"
              style={{ color: textColor }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;

