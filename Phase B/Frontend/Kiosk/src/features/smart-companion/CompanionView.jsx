import { useCallback } from "react";
import Chat from "@/components/chat/Chat";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services/productService";

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
  } = useVoiceAssistant();

  const { cartItems, deleteProduct, addProduct } = useCart();

  /**
   * Handle replacing a product with an alternative
   * Removes the original product from cart and adds the alternative
   */
  const handleReplaceProduct = useCallback((alternative) => {
    console.log("Replacing product with alternative:", alternative);
    
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
    
    console.log("Product replaced successfully:", cartItem.name);
  }, [highlightedProductId, deleteProduct, addProduct]);

  return (
    <Chat
      isConversationActive={isConversationActive}
      onStartStop={toggleConversation}
      status={chatStatus}
      timerProgress={timerProgress}
      messages={messages}
      onReplaceProduct={handleReplaceProduct}
      cartItems={cartItems}
    />
  );
}

