import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

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
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Icon
              name={ICONS.CART}
              size={28}
              weight={500}
              style={{ color: "#16a34a" }}
            />
            <h2 className="text-xl font-semibold text-gray-800">
              Forgot Something?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-70 active:opacity-50 transition-opacity"
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
              <p className="text-gray-600 mb-4">
                Based on your shopping habits, you might need these items:
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
                      <p className="text-xs text-gray-400 mt-1">
                        {item.status === "overdue" ? (
                          <span className="text-amber-600">
                            Usually buy every {item.average_purchase_interval} days
                            ({item.days_since_last_purchase} days ago)
                          </span>
                        ) : (
                          <span>
                            Due soon ({item.days_since_last_purchase} days since last purchase)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => onAddItem(item)}
                      className="shrink-0 px-4 py-2 rounded-lg
                                 bg-green-600 hover:bg-green-700 active:bg-green-800
                                 text-white font-medium text-sm
                                 transition-colors duration-150"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={onCheckout}
            className="w-full px-6 py-3 rounded-xl font-semibold
                       bg-green-600 hover:bg-green-700 active:bg-green-800
                       text-white transition-colors duration-150"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotItemsModal;
