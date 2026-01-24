import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * ChatBubble Component
 * 
 * A reusable chat bubble for the voice assistant integration.
 * Can be used for both user messages and voice assistant responses.
 * 
 * Features:
 * - Customizable speaker icon in filled circle
 * - Optional conflict/warning icon in same line as speaker label
 * - Support for child components (product alternatives, maps, etc.)
 * - Flexible background colors for different speaker types
 * 
 * @param {string} speakerIcon - Icon name from ICONS config (e.g., ICONS.PERSON, ICONS.COMPANION)
 * @param {string} speakerLabel - Label text for who is speaking (e.g., "You", "Smart Companion")
 * @param {string} backgroundColor - Background color of the bubble (default: "#e4fcec")
 * @param {string} textColor - Color for the text content (default: "#1f2937")
 * @param {string} iconColor - Color for the speaker icon (default: "#1f2937")
 * @param {string} iconBackgroundColor - Background color for the speaker icon circle (default: "#ffffff")
 * @param {boolean} showConflict - Whether to show the conflict/warning icon (default: false)
 * @param {string} conflictIconColor - Color for the conflict icon (default: "#dc2626")
 * @param {ReactNode} children - Content to display inside the bubble (text, components, etc.)
 * @param {string} className - Additional CSS classes for the bubble container
 */
const ChatBubble = ({
  speakerIcon,
  speakerLabel,
  backgroundColor = "#e4fcec",
  textColor = "#1f2937",
  iconColor = "#1f2937",
  iconBackgroundColor = "#ffffff",
  showConflict = false,
  conflictIconColor = "#dc2626",
  children,
  className = "",
}) => {
  return (
    <div
      className={`relative rounded-2xl p-5 ${className}`}
      style={{
        backgroundColor,
        border: showConflict ? `3px solid ${conflictIconColor}` : '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header with Speaker Icon and Label */}
      <div className="flex items-center gap-3 mb-3">
        {/* Speaker Icon in filled circle */}
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: iconBackgroundColor,
          }}
        >
          <Icon
            name={speakerIcon}
            size={24}
            weight={500}
            fill={1}
            style={{ color: iconColor }}
          />
        </div>
        
        <span
          className="font-[Montserrat] text-base font-semibold flex-1"
          style={{ color: textColor }}
        >
          {speakerLabel}
        </span>

        {/* Conflict/Warning Icon - Same line as speaker label */}
        {showConflict && (
          <Icon
            name={ICONS.CONFLICT}
            size={32}
            weight={500}
            fill={1}
            style={{ color: conflictIconColor }}
          />
        )}
      </div>

      {/* Content Area */}
      <div
        className="font-[Montserrat] text-base font-normal"
        style={{ color: textColor }}
      >
        {children}
      </div>
    </div>
  );
};

export default ChatBubble;

