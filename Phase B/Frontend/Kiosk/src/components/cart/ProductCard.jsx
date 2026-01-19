import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

/**
 * ProductCard Component
 *
 * A card component for displaying products in the shopping cart.
 *
 * @param {string} productName - The name of the product
 * @param {string} imageUrl - URL or path to the product image
 * @param {number} quantity - Current quantity of the product
 * @param {number} currentPrice - Current price of the product
 * @param {number} pricePerUnit - Price per unit for display
 * @param {function} onIncrease - Callback when quantity is increased
 * @param {function} onDecrease - Callback when quantity is decreased (deletes if quantity is 1)
 * @param {function} onDelete - Callback when product is deleted from cart
 * @param {string} className - Additional CSS classes
 */
const ProductCard = ({
  productName = "Product Name",
  imageUrl = "",
  quantity = 1,
  currentPrice = 0,
  pricePerUnit = 0,
  onIncrease,
  onDecrease,
  onDelete,
  className = "",
}) => {
  const handleIncrease = () => {
    if (onIncrease) onIncrease();
  };

  const handleDecrease = () => {
    if (onDecrease) onDecrease();
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
  };

  return (
    <div
      className={`
        flex items-center
        bg-white rounded-2xl
        px-4 py-4
        border border-gray-200
        ${className}
      `}
    >
      {/* Left Section: Product Image */}
      <div className="shrink-0 w-20 h-20 mr-4">
        <img
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Middle Section: Product Info and Quantity */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-800 truncate mb-4">
          {productName}
        </h3>

        {/* Quantity Pill and Delete Button */}
        <div className="flex items-center gap-4">
          {/* Quantity Pill - Horizontal Layout */}
          <div className="flex items-center border border-gray-300 rounded-full w-fit overflow-hidden px-1">
            {/* Quantity Display */}
            <span className="pl-4 pr-2 text-base font-medium text-gray-800 min-w-6 text-center">
              {quantity}
            </span>

            {/* Buttons Container */}
            <div className="flex flex-col">
              {/* Increase Button */}
              <button
                onClick={handleIncrease}
                className="
                  flex items-center justify-center
                  w-6 h-3.5
                  bg-transparent
                  cursor-pointer
                "
              >
                <Icon
                  name={ICONS.ADD}
                  size={12}
                  weight={400}
                  style={{ color: "#374151" }}
                />
              </button>

              {/* Decrease Button */}
              <button
                onClick={handleDecrease}
                className="
                  flex items-center justify-center
                  w-6 h-3.5
                  bg-transparent
                  cursor-pointer
                "
              >
                <Icon
                  name={ICONS.REDUCE}
                  size={12}
                  weight={400}
                  style={{ color: "#374151" }}
                />
              </button>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="
              flex items-center justify-center
              transition-opacity duration-150
              cursor-pointer
              hover:opacity-60
            "
          >
            <Icon
              name={ICONS.DELETE}
              size={32}
              weight={230}
              style={{ color: "#6B7280" }}
            />
          </button>
        </div>
      </div>

      {/* Right Section: Price */}
      <div className="flex items-center ml-4 mr-4">
        {/* Price Section */}
        <div className="text-center">
          {/* Current Price */}
          <div className="text-xl font-bold text-gray-800">
            <span className="text-sm">₪</span>{currentPrice.toFixed(2)}
          </div>

          {/* Price Per Unit */}
          <div className="text-xs text-gray-500 mt-0.5">
            ₪{pricePerUnit.toFixed(2)} per unit
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

