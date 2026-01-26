import { useRef, useState, useCallback, useEffect } from "react";
import ChatBar from "./ChatBar";
import ChatBubble from "./ChatBubble";
import ProductLocationContent from "./ProductLocationContent";
import ConflictAlternativesContent from "./ConflictAlternativesContent";
import ProductAlternatives from "./ProductAlternatives";
import ShimmerText from "./ShimmerText";
import { ICONS } from "@/components/icons/icons.config";

/**
 * Chat Component
 * 
 * A chat interface component with touch/drag scrolling functionality.
 * - ChatBar at the bottom for conversation control
 * - Chat bubbles at the top showing conversation history
 * - Inverted touch scrolling: drag up to scroll down, drag down to scroll up
 * 
 * @param {boolean} isConversationActive - Whether conversation is active
 * @param {function} onStartStop - Callback when start/stop button is clicked
 * @param {string} status - Current status: 'idle', 'connecting', 'assistant', 'user'
 * @param {number} timerProgress - Progress of inactivity timer (0-100)
 * @param {Array} messages - Array of message objects: { type: 'user' | 'assistant', content: ReactNode, showConflict: boolean }
 * @param {function} onReplaceProduct - Callback when "Replace" button is clicked on an alternative
 * @param {Array} cartItems - Current cart items (for checking if product is still in cart)
 * @param {string} className - Additional CSS classes
 */
const Chat = ({
  isConversationActive = false,
  onStartStop,
  status = 'idle',
  timerProgress = 0,
  messages = [],
  onReplaceProduct,
  cartItems = [],
  className = "",
}) => {
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && messages.length > 0) {
      // Smooth scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Hide webkit scrollbar */}
      <style>
        {`
          .chat-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Scrollable Messages Container */}
      <div
        ref={scrollContainerRef}
        className={`
          chat-scroll-container
          flex-1 
          overflow-y-auto 
          overflow-x-hidden
          mb-4 
          space-y-4
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-center text-lg font-[Montserrat]">
              Start a conversation with your Smart Companion
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Determine what content to render
            let content;
            
            if (message.isLoading && message.loadingText) {
              // Show shimmer loading text
              content = (
                <>
                  {message.content && <>{message.content} </>}
                  <ShimmerText text={message.loadingText} />
                </>
              );
            } else if (message.conflictData) {
              // Check if product is still in cart AND is the current (top) product
              // Disabled when: removed, replaced, or a new product was scanned
              const currentProductId = cartItems.length > 0 ? cartItems[0].id : null;
              const isProductInCart = cartItems.some(item => item.id === message.forProductId);
              const isCurrentProduct = message.forProductId === currentProductId;
              
              // Render ConflictAlternativesContent for product conflict with alternatives (from barcode scan)
              content = (
                <ConflictAlternativesContent
                  message={message.content}
                  allergenConflicts={message.conflictData.allergenConflicts}
                  dietaryConflicts={message.conflictData.dietaryConflicts}
                  alternatives={message.conflictData.alternatives}
                  onReplace={onReplaceProduct}
                  disabled={!isProductInCart || !isCurrentProduct}
                />
              );
            } else if (message.toolCallData?.name === 'get_ai_alternatives') {
              // Check if product is still in cart AND is the current (top) product
              const currentProductId = cartItems.length > 0 ? cartItems[0].id : null;
              const isProductInCart = cartItems.some(item => item.id === message.forProductId);
              const isCurrentProduct = message.forProductId === currentProductId;
              
              // Render ProductAlternatives for voice assistant alternatives request
              // Transform alternatives to the format expected by ProductAlternatives
              const transformedAlternatives = (message.toolCallData.alternatives || []).map(product => ({
                id: product.barcode,
                name: product.name,
                size: product.size,
                company: product.company,
                price: product.price,
                imageUrl: product.image_url,
                originalProduct: product,
              }));
              
              content = (
                <div className="space-y-3">
                  <p>{message.content}</p>
                  {transformedAlternatives.length > 0 && (
                    <ProductAlternatives
                      alternatives={transformedAlternatives}
                      onReplace={onReplaceProduct}
                      disabled={!isProductInCart || !isCurrentProduct}
                    />
                  )}
                </div>
              );
            } else if (message.toolCallData?.name === 'get_product_info') {
              // Render ProductLocationContent for product location results
              content = (
                <ProductLocationContent
                  responseText={message.content}
                  productLocation={message.toolCallData.productLocation}
                />
              );
            } else {
              content = message.content;
            }

            return (
              <ChatBubble
                key={index}
                speakerIcon={message.type === 'user' ? ICONS.PERSON : ICONS.COMPANION}
                speakerLabel={message.type === 'user' ? 'You' : 'Smart Companion'}
                backgroundColor={message.type === 'user' ? '#e3e3e3' : '#e4fcec'}
                iconColor={message.type === 'user' ? '#1f2937' : '#1f2937'}
                textColor="#1f2937"
                showConflict={message.showConflict || false}
                conflictIconColor="#dc2626"
              >
                {content}
              </ChatBubble>
            );
          })
        )}
      </div>

      {/* Chat Bar - Fixed at bottom */}
      <div className="shrink-0">
        <ChatBar
          isConversationActive={isConversationActive}
          onStartStop={onStartStop}
          status={status}
          timerProgress={timerProgress}
        />
      </div>
    </div>
  );
};

export default Chat;

