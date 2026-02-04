/**
 * ProductAlternatives Component
 *
 * Displays 1-3 product alternatives in a card format, to be used inside chat bubbles.
 * - 1 alternative: Single product card
 * - 2 alternatives: Card with horizontal divider between products
 * - 3 alternatives: Card with two horizontal dividers
 *
 * @param {Array} alternatives - Array of product alternatives (1-3 items)
 *   Each alternative should have: { imageUrl, name, size, company, price }
 * @param {function} onReplace - Callback when "Replace" button is clicked, receives the product
 * @param {boolean} disabled - Whether replace buttons should be disabled
 * @param {string} className - Additional CSS classes
 */
const ProductAlternatives = ({
  alternatives = [],
  onReplace,
  disabled = false,
  className = "",
}) => {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  // Limit to max 3 alternatives
  const displayAlternatives = alternatives.slice(0, 3);

  const handleReplace = (product) => {
    if (onReplace) {
      onReplace(product);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden border border-gray-200 ${className}`}
    >
      {displayAlternatives.map((product, index) => (
        <div key={product.id || index}>
          {/* Divider line between products */}
          {index > 0 && (
            <div className="h-px bg-gray-200 mx-4" />
          )}
          
          {/* Product Row */}
          <div className="flex items-center p-4">
            {/* Product Image */}
            <div className="shrink-0 w-16 h-16 mr-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              {/* Product Name with Size */}
              <h4 className="text-base font-medium text-gray-800 leading-tight">
                {product.name}
                {product.size && (
                  <span className="text-gray-600 font-normal"> ({product.size})</span>
                )}
              </h4>
              
              {/* Company Name */}
              {product.company && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {product.company}
                </p>
              )}
              
              {/* Price */}
              <p className="text-base font-semibold text-gray-800 mt-1">
                <span className="text-sm">₪</span>
                {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
              </p>
            </div>

            {/* Replace Button */}
            <button
              onClick={() => handleReplace(product)}
              disabled={disabled}
              className={`
                shrink-0 ml-4
                px-5 py-2
                text-sm font-medium
                rounded-full
                transition-all duration-150
                ${disabled 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 active:scale-95'
                }
              `}
            >
              Replace
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductAlternatives;

