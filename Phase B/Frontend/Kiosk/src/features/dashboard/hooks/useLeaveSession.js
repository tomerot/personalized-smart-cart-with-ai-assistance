import { useState, useCallback } from "react";
import { voiceControllerService } from "@/services/voiceControllerService";
import { barcodeControllerService } from "@/services/barcodeControllerService";

/**
 * Custom hook to manage leaving/logout session flow
 * Also handles checkout complete (same cleanup logic)
 */
export function useLeaveSession({ navigate, stopConversation, clearMessages, clearCart, logout }) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleLeaveClick = () => {
    setShowLeaveModal(true);
  };

  // Core cleanup logic - reused by both leave and checkout complete
  const performSessionCleanup = useCallback(() => {
    // Stop any active voice conversation
    stopConversation();

    // Clear voice messages
    clearMessages();

    // Clear cart items
    clearCart();

    // Disconnect WebSocket connections
    voiceControllerService.disconnect();
    barcodeControllerService.disconnect();

    // Logout user (clears sessionStorage)
    logout();

    // Delay navigation to ensure click event is fully processed
    setTimeout(() => {
      navigate("/");
    }, 50);
  }, [navigate, stopConversation, clearMessages, clearCart, logout]);

  const handleConfirmLeave = () => {
    console.log("Leave confirmed - resetting session and returning to landing page");
    setShowLeaveModal(false);
    performSessionCleanup();
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
  };

  return {
    showLeaveModal,
    handleLeaveClick,
    handleConfirmLeave,
    handleCancelLeave,
    performSessionCleanup, // Exposed for checkout complete
  };
}

