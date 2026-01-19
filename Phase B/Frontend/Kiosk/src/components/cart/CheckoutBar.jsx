/**
 * CheckoutBar Component
 *
 * A bar component that displays the total price and checkout button.
 * Designed to be placed at the bottom of the cart section.
 *
 * @param {number} totalPrice - The total price of all items in the cart
 * @param {function} onCheckout - Callback when checkout button is clicked
 * @param {string} className - Additional CSS classes
 */
const CheckoutBar = ({
  totalPrice = 0,
  onCheckout,
  className = "",
}) => {
  const handleCheckout = () => {
    if (onCheckout) onCheckout();
  };

  return (
    <div
      className={`
        flex items-center justify-center gap-8
        ${className}
      `}
    >
      {/* Left Section: Total Price */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-600 mb-1">
          Total Price
        </span>
        <span className="text-2xl font-bold text-gray-800">
          <span className="text-lg">₪</span>{totalPrice.toFixed(2)}
        </span>
      </div>

      {/* Right Section: Checkout Button */}
      <button
        onClick={handleCheckout}
        className="
          bg-green-600
          hover:bg-green-700
          active:bg-green-800
          text-white
          font-semibold
          text-lg
          px-20 py-4
          rounded-xl
          transition-colors duration-150
          cursor-pointer
        "
      >
        Checkout
      </button>
    </div>
  );
};

export default CheckoutBar;

