import { useEffect, useState } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";
import { useCart } from "@/context/CartContext";

/**
 * ForgotItemsModal Component
 *
 * Shows suggested products that user might have forgotten based on their buying patterns
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed (skip suggestions)
 * @param {function} onAddItem - Callback when user wants to add an item (receives suggestion object)
 * @param {function} onCheckout - Callback when user wants to proceed to checkout
 * @param {Array} suggestions - Array of suggestion items from API
 * @param {boolean} isLoading - Whether suggestions are being loaded
 */
const ForgotItemsModal = ({
  isOpen,
  onClose,
  onAddItem,
  onCheckout,
  suggestions = [],
  isLoading = false,
}) => {
  // Get current cart total
  const { totalPrice: currentCartTotal } = useCart();
  
  // Track quantities for each item by barcode (starts at 0)
  const [itemQuantities, setItemQuantities] = useState({});

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset quantities when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setItemQuantities({});
    }
  }, [isOpen]);

  // Increase quantity
  const handleIncrease = (barcode) => {
    setItemQuantities((prev) => ({
      ...prev,
      [barcode]: (prev[barcode] || 0) + 1,
    }));
  };

  // Decrease quantity
  const handleDecrease = (barcode) => {
    setItemQuantities((prev) => {
      const currentQty = prev[barcode] || 0;
      if (currentQty <= 0) return prev;
      return {
        ...prev,
        [barcode]: currentQty - 1,
      };
    });
  };

  // Calculate total price of items to be added
  const totalNewItemsPrice = suggestions.reduce((total, item) => {
    const qty = itemQuantities[item.barcode] || 0;
    return total + (item.price * qty);
  }, 0);

  // Handle proceed - add items with quantities and process checkout
  const handleProceed = () => {
    // Collect all items with quantity > 0 to add
    const itemsToAdd = [];
    
    suggestions.forEach((item) => {
      const qty = itemQuantities[item.barcode] || 0;
      if (qty > 0) {
        // Add item to cart and track for checkout
        for (let i = 0; i < qty; i++) {
          const cartItem = onAddItem(item);
          if (cartItem) {
            itemsToAdd.push(cartItem);
          }
        }
      }
    });
    
    // Proceed to checkout WITH the items we just added
    // This fixes the stale closure issue where cartItems wouldn't include newly added items
    onCheckout(itemsToAdd);
  };

  // Don't show modal if not open OR if there are no suggestions (and not loading)
  if (!isOpen || (!isLoading && suggestions.length === 0)) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative flex flex-col
                   w-[min(600px,95vw)] max-h-[85vh]
                   rounded-2xl shadow-2xl bg-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-5 border-b border-gray-100 relative">
          <h2 className="text-xl font-semibold text-gray-800">
            Forgot Something?
          </h2>
          <button
            onClick={onClose}
            className="absolute right-5 p-1 hover:opacity-70 active:opacity-50 transition-opacity"
            aria-label="Close modal"
          >
            <Icon
              name={ICONS.CLOSE}
              size={28}
              weight={500}
              style={{ color: "#374151" }}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No suggestions at this time.</p>
              <p className="text-sm mt-2">You're all set!</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-600 mb-4">
                Based on your shopping habits,
                <br />
                you might need the following products
              </p>
              <div className="space-y-3">
                {suggestions.map((item) => (
                  <div
                    key={item.barcode}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    {/* Product Image */}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-lg bg-white"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/64?text=No+Image";
                      }}
                    />

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {item.company} {item.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.size && `${item.size} • `}
                        <span className="font-medium text-green-600">
                          ₪{item.price.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs mt-1">
                        <span className="text-amber-600">
                          {item.days_since_last_purchase} days since last purchase
                        </span>
                      </p>
                    </div>

                    {/* Quantity Pill */}
                    <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shrink-0 bg-white mr-2">
                      {/* Quantity Display */}
                      <span className="pl-4 pr-2 text-base font-medium text-gray-800 w-10 text-center">
                        {itemQuantities[item.barcode] || 0}
                      </span>

                      {/* Buttons Container */}
                      <div className="flex flex-col">
                        {/* Increase Button */}
                        <button
                          onClick={() => handleIncrease(item.barcode)}
                          className="flex items-center justify-center w-6 h-3.5 bg-transparent cursor-pointer"
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
                          onClick={() => handleDecrease(item.barcode)}
                          className="flex items-center justify-center w-6 h-3.5 bg-transparent cursor-pointer"
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <div className="flex items-center justify-center gap-8">
            {/* Total Price Display */}
            <div className="flex flex-col items-center w-40 shrink-0">
              <span className="text-sm font-medium text-gray-600 mb-1">
                Total Price
              </span>
              <span className="text-2xl font-bold text-gray-800 tabular-nums">
                <span className="text-lg">₪</span>{(currentCartTotal + totalNewItemsPrice).toFixed(2)}
              </span>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceed}
              className="flex items-center gap-3
                         bg-green-600 hover:bg-green-700 active:bg-green-800
                         text-white font-semibold text-lg
                         px-16 py-4 rounded-xl
                         transition-colors duration-150
                         cursor-pointer shrink-0"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotItemsModal;
