/**
 * ShimmerText Component
 * 
 * Displays text with an animated shimmer effect, typically used for loading states.
 * Perfect for showing tool call loading messages in chat bubbles.
 * 
 * @param {string} text - The text to display with shimmer effect
 * @param {string} className - Additional CSS classes
 */
const ShimmerText = ({ text, className = "" }) => {
  return (
    <>
      <style>
        {`
          @keyframes text-shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          
          .shimmer-text {
            background: linear-gradient(
              90deg,
              rgba(31, 41, 55, 0.4) 0%,
              rgba(31, 41, 55, 0.4) 40%,
              rgba(31, 41, 55, 1) 50%,
              rgba(31, 41, 55, 0.4) 60%,
              rgba(31, 41, 55, 0.4) 100%
            );
            background-size: 200% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: text-shimmer 2.5s linear infinite;
            display: inline-block;
          }
        `}
      </style>
      <span className={`shimmer-text ${className}`}>
        {text}
      </span>
    </>
  );
};

export default ShimmerText;

