import { useRef, useState, useCallback } from "react";
import ProductCard from "./ProductCard";
import CheckoutBar from "./CheckoutBar";

/**
 * Cart Component
 *
 * A shopping cart component with touch/drag scrolling functionality.
 * Products are stacked with the most recently scanned item on top.
 * Supports inverted touch scrolling: drag up to scroll down, drag down to scroll up.
 *
 * @param {Array} products - Array of product objects to display
 * @param {number} totalPrice - Total price of all items in cart
 * @param {function} onCheckout - Callback when checkout button is clicked
 * @param {function} onIncreaseQuantity - Callback when product quantity is increased
 * @param {function} onDecreaseQuantity - Callback when product quantity is decreased
 * @param {function} onDeleteProduct - Callback when product is deleted
 * @param {string} className - Additional CSS classes
 */
const Cart = ({
  products = [],
  totalPrice = 0,
  onCheckout,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onDeleteProduct,
  className = "",
}) => {
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Handle mouse/touch start
  const handleDragStart = useCallback((e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    
    // Get the Y position from mouse or touch event
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setScrollTop(container.scrollTop);

    // Prevent text selection during drag
    e.preventDefault();
  }, []);

  // Handle mouse/touch move
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Get the Y position from mouse or touch event
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    
    // Calculate the distance moved
    const deltaY = clientY - startY;
    
    // Inverted scrolling: drag up (negative deltaY) scrolls down (increase scrollTop)
    // drag down (positive deltaY) scrolls up (decrease scrollTop)
    container.scrollTop = scrollTop - deltaY;

    e.preventDefault();
  }, [isDragging, startY, scrollTop]);

  // Handle mouse/touch end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Products displayed in reverse order (last scanned on top)
  const displayProducts = [...products].reverse();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Cart Title */}
      <h2 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4 shrink-0">
        My Cart
      </h2>

      {/* Hide webkit scrollbar */}
      <style>
        {`
          .cart-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Scrollable Products Container */}
      <div
        ref={scrollContainerRef}
        className={`
          cart-scroll-container
          flex-1 
          overflow-y-auto 
          overflow-x-hidden
          mb-4 
          space-y-3
          select-none
          ${isDragging ? "cursor-grabbing" : "cursor-grab"}
        `}
        style={{
          // Hide scrollbar but keep functionality
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >

        {displayProducts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Your cart is empty</p>
          </div>
        ) : (
          displayProducts.map((product, index) => (
            <ProductCard
              key={product.id || index}
              productName={product.name}
              imageUrl={product.imageUrl}
              quantity={product.quantity}
              currentPrice={product.currentPrice}
              pricePerUnit={product.pricePerUnit}
              onIncrease={() => onIncreaseQuantity && onIncreaseQuantity(product.id)}
              onDecrease={() => onDecreaseQuantity && onDecreaseQuantity(product.id)}
              onDelete={() => onDeleteProduct && onDeleteProduct(product.id)}
            />
          ))
        )}
      </div>

      {/* Checkout Bar - Fixed at bottom */}
      <div className="shrink-0">
        <CheckoutBar
          totalPrice={totalPrice}
          onCheckout={onCheckout}
        />
      </div>
    </div>
  );
};

export default Cart;

