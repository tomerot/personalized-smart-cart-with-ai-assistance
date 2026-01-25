import { useNavigate } from "react-router-dom";
import Icon from "@/components/icons/ICON";

/**
 * NavRailButton Component
 *
 * A navigation button for the NavRail with icon, label, and active state styling.
 *
 * @param {string} icon - Icon name from icons.config.js
 * @param {string} label - Text label displayed below the icon
 * @param {boolean} isActive - Whether the button is in active state
 * @param {boolean} isBottom - Whether to position this button at the bottom of the NavRail
 * @param {boolean} disabled - Whether the button is disabled (default: false)
 * @param {string} to - Route path for navigation (used when onClick is not provided)
 * @param {function} onClick - Custom click handler (overrides navigation if provided)
 * @param {number} iconSize - Icon size in pixels (default: 32)
 * @param {boolean} fillIconWhenActive - Whether to fill the icon when active (default: true)
 * @param {string} activeColor - Icon and label color when active (default: "#5ae541")
 * @param {string} inactiveColor - Icon and label color when inactive (default: "#ffffff")
 * @param {string} disabledColor - Icon and label color when disabled (default: "#666666")
 * @param {number} activeIconWeight - Icon stroke weight when active (default: 400)
 * @param {number} inactiveIconWeight - Icon stroke weight when inactive (default: 400)
 * @param {number} activeLabelFontWeight - Font weight of the label when active (default: 700)
 * @param {number} inactiveLabelFontWeight - Font weight of the label when inactive (default: 500)
 * @param {number} labelGap - Gap between icon and label in pixels (default: 8)
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
  fillIconWhenActive = true,
  activeColor = "#5ae541",
  inactiveColor = "#ffffff",
  disabledColor = "#c0c7c2",
  activeIconWeight = 400,
  inactiveIconWeight = 400,
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
  const currentIconWeight = disabled ? inactiveIconWeight : (isActive ? activeIconWeight : inactiveIconWeight);

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
      {/* Icon */}
      <Icon
        name={icon}
        fill={fillIconWhenActive && isActive ? 1 : 0}
        weight={currentIconWeight}
        size={iconSize}
        style={{
          color: currentColor,
          transition: "all 0.2s ease-in-out",
        }}
      />

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
