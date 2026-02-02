import { useRef, useState, useCallback } from "react";
import ProductCard from "./ProductCard";
import CheckoutBar from "./CheckoutBar";
import BarcodeInputModal from "@/components/modal/BarcodeInputModal";
import { useCart } from "@/context/CartContext";
import Icon from "@/components/icons/ICON";
import { ICONS } from "@/components/icons/icons.config";

/**
 * Cart Component
 *
 * A shopping cart component with touch/drag scrolling functionality.
 * Products are stacked with the most recently scanned item on top.
 * Supports inverted touch scrolling: drag up to scroll down, drag down to scroll up.
 *
 * @param {function} onCheckout - Callback when checkout button is clicked
 * @param {function} onManualBarcodeSubmit - Callback when barcode is manually entered
 * @param {string|number} highlightedProductId - ID of product to highlight (for voice assistant context)
 * @param {string} className - Additional CSS classes
 */
const Cart = ({
  onCheckout,
  onManualBarcodeSubmit,
  highlightedProductId = null,
  className = "",
}) => {
  const { cartItems, totalPrice, increaseQuantity, decreaseQuantity, deleteProduct } = useCart();
  const scrollContainerRef = useRef(null);
  const barcodeButtonRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Debug: Log highlighted product
  console.log('📦 Cart - highlightedProductId:', highlightedProductId, 'cartItems:', cartItems.length);

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

  // Products are already in correct order (last scanned on top)
  const displayProducts = cartItems;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Cart Title - Outside the white box */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Icon 
            name={ICONS.CART} 
            size={22} 
            weight={600}
            style={{ color: "#1f2937" }}
          />
          <h2 className="font-[Montserrat] text-2xl font-bold text-gray-800">
            Your Cart
          </h2>
        </div>
        
        <button
          ref={barcodeButtonRef}
          className="flex items-center gap-3 px-4 py-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition-colors duration-150 relative z-50"
          onClick={() => setShowBarcodeModal(!showBarcodeModal)}
        >
          <Icon 
            name={ICONS.BARCODE} 
            size={20} 
            weight={500}
            style={{ color: "white" }}
          />
          <span className="font-[Montserrat]">Type Barcode</span>
        </button>
      </div>

      {/* White box container */}
      <div 
        className="flex-1 flex flex-col rounded-2xl border border-gray-200 overflow-hidden p-4" 
        style={{ backgroundColor: '#f7fef9' }}
      >
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
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <Icon 
                name={ICONS.CART_EMPTY} 
                size={64} 
                weight={350}
                style={{ color: "#9ca3af", marginBottom: "16px" }}
              />
              <p className="font-bold text-lg mb-3">Your Cart is Currently Empty</p>
              <p className="text-center text-sm">
                <span className="font-semibold">Scan</span> a barcode to add a product,
                <br />
                or tap <span className="font-semibold">"Type Barcode"</span> to enter it manually
              </p>
            </div>
          ) : (
            displayProducts.map((product, index) => (
              <ProductCard
                key={product.id || index}
                productName={product.name}
                company={product.company}
                size={product.size}
                imageUrl={product.imageUrl}
                quantity={product.quantity}
                currentPrice={product.currentPrice}
                pricePerUnit={product.pricePerUnit}
                onIncrease={() => increaseQuantity(product.id)}
                onDecrease={() => decreaseQuantity(product.id)}
                onDelete={() => deleteProduct(product.id)}
                isHighlighted={highlightedProductId === product.id}
              />
            ))
          )}
        </div>

        {/* Checkout Bar - Fixed at bottom */}
        <div className="shrink-0">
          <CheckoutBar
            totalPrice={totalPrice}
            onCheckout={onCheckout}
            disabled={cartItems.length === 0}
          />
        </div>
      </div>

      {/* Barcode Input Modal */}
      <BarcodeInputModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        onSubmit={(barcode) => {
          setShowBarcodeModal(false);
          if (onManualBarcodeSubmit) {
            onManualBarcodeSubmit(barcode);
          }
        }}
        anchorRef={barcodeButtonRef}
      />
    </div>
  );
};

export default Cart;

