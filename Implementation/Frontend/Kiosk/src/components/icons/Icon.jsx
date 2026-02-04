/**
 * Icon Component
 *
 * A flexible wrapper for Google Material Symbols with customizable properties.
 *
 * @param {string} name - The icon name.
 * @param {number} fill - Icon style: 0 = outlined (hollow), 1 = filled (solid). Default: 0
 * @param {number} weight - Stroke thickness: 100 (thin) to 700 (bold), similar to font-weight. Default: 400
 * @param {number} grade - Fine-tune thickness: -25 (lighter) to 200 (heavier). Adjusts weight without affecting size. Default: 0
 * @param {number} opticalSize - Display size optimization: 20 (small) to 48 (large). Adjusts proportions for readability. Default: 24
 * @param {number} size - Actual display size in pixels. Default: 24
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */

const Icon = ({
  name,
  fill = 0,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  size = 24,
  className = "",
  style = {},
  ...props
}) => {
  const symbolStyle = {
    fontFamily: "'Material Symbols Outlined'",
    fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
    fontSize: `${size}px`,
    ...style,
  };

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={symbolStyle}
      {...props}
    >
      {name}
    </span>
  );
};

export default Icon;
