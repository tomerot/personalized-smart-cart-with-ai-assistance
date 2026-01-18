import React from "react";

/**
 * NavRail Component
 *
 * A vertical navigation rail that displays NavRailButton components.
 * Supports separating buttons into top and bottom sections using the isBottom prop.
 *
 * @param {ReactNode} children - NavRailButton components to render
 * @param {string} backgroundColor - Background color of the NavRail (default: "#004612")
 * @param {number|string} width - Width of the NavRail (default: 95)
 * @param {string} borderRadius - Border radius for rounded corners (default: "50px")
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
const NavRail = ({
  children,
  backgroundColor = "#004612",
  width = 100,
  borderRadius = "30px",
  className = "",
  style = {},
  ...props
}) => {
  // Separate children into top and bottom groups based on isBottom prop
  const topButtons = [];
  const bottomButtons = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.props.isBottom) {
        bottomButtons.push(child);
      } else {
        topButtons.push(child);
      }
    }
  });

  return (
    <nav
      className={`
        flex flex-col justify-between items-center
        h-full
        py-4
        ${className}
      `}
      style={{
        backgroundColor,
        width: typeof width === "number" ? `${width}px` : width,
        borderRadius,
        ...style,
      }}
      {...props}
    >
      {/* Top buttons container */}
      <div className="flex flex-col items-center gap-4">{topButtons}</div>

      {/* Bottom buttons container */}
      {bottomButtons.length > 0 && (
        <div className="flex flex-col items-center gap-4">{bottomButtons}</div>
      )}
    </nav>
  );
};

export default NavRail;
