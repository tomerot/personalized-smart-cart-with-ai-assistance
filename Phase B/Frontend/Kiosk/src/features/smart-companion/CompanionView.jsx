import { useCallback } from "react";
import Chat from "@/components/chat/Chat";
import ChatBar from "@/components/chat/ChatBar";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services/productService";

/**
 * Empty state component - before conversation starts
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4 -mt-4">
      <Icon 
        name={ICONS.NO_CHAT} 
        size={64} 
        weight={350}
        style={{ color: "#9ca3af", marginBottom: "16px" }}
      />
      <p className="font-bold text-lg mb-3">Smart Companion is Ready to Help</p>
      <p className="text-center text-sm">
        Tap <span className="font-semibold">"Start Conversation"</span> and speak when prompted
      </p>
    </div>
  );
}

/**
 * CompanionView Component
 * Displays the Smart Companion chat interface with voice assistant integration
 */
export default function CompanionView() {
  const {
    isConversationActive,
    chatStatus,
    timerProgress,
    messages,
    toggleConversation,
    highlightedProductId,
    isVoiceControllerConnected,
  } = useVoiceAssistant();

  const { cartItems, deleteProduct, addProduct } = useCart();

  /**
   * Handle replacing a product with an alternative
   * Removes the original product from cart and adds the alternative
   */
  const handleReplaceProduct = useCallback((alternative) => {
    // The highlighted product is the one that caused the conflict
    if (highlightedProductId) {
      // Remove the original product
      deleteProduct(highlightedProductId);
    }
    
    // Add the alternative product to cart
    // Use originalProduct if available (full product data), otherwise use alternative directly
    const productData = alternative.originalProduct || alternative;
    const cartItem = productService.transformToCartItem(productData);
    addProduct(cartItem);
  }, [highlightedProductId, deleteProduct, addProduct]);

  return (
    <div className="flex flex-col h-full">
      {/* Empty state or Chat messages - with bottom padding for ChatBar */}
      <div className="flex-1 overflow-hidden mb-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <Chat
            messages={messages}
            onReplaceProduct={handleReplaceProduct}
            cartItems={cartItems}
          />
        )}
      </div>

      {/* Chat Bar - Fixed at bottom */}
      <div className="shrink-0">
        <ChatBar
          isConversationActive={isConversationActive}
          onStartStop={toggleConversation}
          status={chatStatus}
          timerProgress={timerProgress}
          disabled={!isVoiceControllerConnected}
        />
      </div>
    </div>
  );
}

