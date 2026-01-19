import { useNavigate } from "react-router-dom";
import Icon from "@/components/icons/ICON";

/**
 * NavRailButton Component
 *
 * A navigation button for the NavRail with icon, label, and active state styling.
 *
 * @param {string} icon - Icon name from icons.config.js
 * @param {string} label - Text label displayed below the icon
 * @param {boolean} isActive - Whether the button is in active state (shows filled icon + pill)
 * @param {boolean} isBottom - Whether to position this button at the bottom of the NavRail
 * @param {boolean} disabled - Whether the button is disabled (default: false)
 * @param {string} to - Route path for navigation (used when onClick is not provided)
 * @param {function} onClick - Custom click handler (overrides navigation if provided)
 * @param {number} iconSize - Icon size in pixels (default: 32)
 * @param {string} pillShape - Shape of the background: "pill" or "circle" (default: "pill")
 * @param {number} pillWidth - Width of the pill in pixels, ignored if pillShape is "circle" (default: 65)
 * @param {number} pillHeight - Height of the pill in pixels, ignored if pillShape is "circle" (default: 36)
 * @param {number} circleSize - Size of the circle in pixels when pillShape is "circle" (default: iconSize * 1.6)
 * @param {string} pillBorderRadius - Border radius of the pill, ignored if pillShape is "circle" (default: "20px")
 * @param {string} pillColor - Background color of the pill/circle (default: "#056619")
 * @param {string} activeColor - Icon and label color when active (default: "#5ae541")
 * @param {string} inactiveColor - Icon and label color when inactive (default: "#ffffff")
 * @param {string} disabledColor - Icon and label color when disabled (default: "#666666")
 * @param {number} activeLabelFontWeight - Font weight of the label when active (default: 700)
 * @param {number} inactiveLabelFontWeight - Font weight of the label when inactive (default: 500)
 * @param {number} labelGap - Gap between icon/pill and label in pixels (default: 8)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
const NavRailButton = ({
  icon,
  label,
  isActive = false,
  isBottom = false,
  disabled = false,
  to,
  onClick,
  iconSize = 32,
  pillShape = "pill",
  pillWidth = 65,
  pillHeight = 36,
  circleSize,
  pillBorderRadius = "20px",
  pillColor = "#056619",
  activeColor = "#5ae541",
  inactiveColor = "#ffffff",
  disabledColor = "#666666",
  activeLabelFontWeight = 700,
  inactiveLabelFontWeight = 500,
  labelGap = 8,
  className = "",
  style = {},
  ...props
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  const currentColor = disabled ? disabledColor : (isActive ? activeColor : inactiveColor);

  // Calculate background dimensions based on shape
  const isCircle = pillShape === "circle";
  const bgWidth = isCircle ? circleSize ?? iconSize * 1.6 : pillWidth;
  const bgHeight = isCircle ? circleSize ?? iconSize * 1.6 : pillHeight;
  const bgBorderRadius = isCircle ? "50%" : pillBorderRadius;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        bg-transparent border-none
        py-2
        transition-all duration-200 ease-in-out
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      style={style}
      data-is-bottom={isBottom}
      {...props}
    >
      {/* Icon container with pill background */}
      <div className="relative flex items-center justify-center">
        {/* Pill background - visible when active */}
        <div
          className={`
            absolute
            transition-all duration-200 ease-in-out
            ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"}
          `}
          style={{
            backgroundColor: pillColor,
            width: bgWidth,
            height: bgHeight,
            borderRadius: bgBorderRadius,
          }}
        />
        {/* Icon */}
        <Icon
          name={icon}
          fill={isActive ? 1 : 0}
          size={iconSize}
          style={{
            color: currentColor,
            position: "relative",
            zIndex: 1,
            transition: "all 0.2s ease-in-out",
          }}
        />
      </div>

      {/* Label */}
      <span
        className="font-[Montserrat] text-xs transition-all duration-200 ease-in-out"
        style={{
          color: currentColor,
          fontWeight: isActive
            ? activeLabelFontWeight
            : inactiveLabelFontWeight,
          marginTop: labelGap,
        }}
      >
        {label}
      </span>
    </button>
  );
};

export default NavRailButton;
