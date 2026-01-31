import { useState } from "react";
import { checkoutService } from "@/services/checkoutService";
import { productService } from "@/services/productService";

/**
 * Custom hook to manage checkout flow including:
 * - Fetching checkout suggestions
 * - Adding suggested items to cart
 * - Processing checkout
 * - Handling incomplete shopping list warnings
 */
export function useCheckout({ user, cartItems, addProduct, hasUncollectedItems }) {
  const [showForgotItemsModal, setShowForgotItemsModal] = useState(false);
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [checkoutSuggestions, setCheckoutSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showIncompleteListModal, setShowIncompleteListModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleCheckout = async () => {
    if (!user?.phone) {
      console.error("No user phone for checkout");
      return;
    }

    // Check if there are uncollected items from shopping list
    if (hasUncollectedItems && hasUncollectedItems()) {
      console.log("User has uncollected items from shopping list - showing warning");
      setShowIncompleteListModal(true);
      return; // Wait for user decision
    }

    // Proceed to checkout flow (ForgotItems suggestions)
    await proceedToCheckoutFlow();
  };

  // Continue checkout flow (fetch suggestions and show ForgotItems modal if needed)
  const proceedToCheckoutFlow = async () => {
    if (!user?.phone) return;

    console.log("Checkout clicked - fetching suggestions...");
    setIsLoadingSuggestions(true);

    // Get barcodes of items currently in cart
    const cartBarcodes = cartItems.map(item => item.id);

    // Fetch replenishment suggestions
    const result = await checkoutService.getSuggestions(user.phone, cartBarcodes);

    setIsLoadingSuggestions(false);

    if (result.success) {
      const suggestions = result.data.suggestions || [];
      setCheckoutSuggestions(suggestions);
      console.log(`Found ${suggestions.length} suggestions`);
      
      // If no suggestions, proceed directly to checkout
      if (suggestions.length === 0) {
        console.log("No suggestions found - proceeding directly to checkout");
        await handleProceedToCheckout();
      } else {
        // Only open modal if there are suggestions
        setShowForgotItemsModal(true);
      }
    } else {
      console.error("Failed to get suggestions:", result.error);
      // If failed to get suggestions, proceed directly to checkout
      setCheckoutSuggestions([]);
      await handleProceedToCheckout();
    }
  };

  // Handle "Proceed Anyway" from IncompleteListModal
  const handleProceedWithIncompleteList = async () => {
    setShowIncompleteListModal(false);
    await proceedToCheckoutFlow();
  };

  const handleAddSuggestedItem = (suggestion) => {
    console.log("Adding suggested item:", suggestion.name);

    // Transform suggestion to cart item format
    const cartItem = {
      id: suggestion.barcode,
      name: productService.formatProductName(suggestion),
      imageUrl: suggestion.image_url,
      pricePerUnit: suggestion.price,
      quantity: 1,
      originalProduct: suggestion,
    };

    // Add to cart
    addProduct(cartItem);

    // Remove from suggestions list
    setCheckoutSuggestions(prev => prev.filter(s => s.barcode !== suggestion.barcode));

    // Return the cart item so caller can track what was added
    return cartItem;
  };

  const handleProceedToCheckout = async (additionalItems = []) => {
    if (!user?.phone) {
      console.error("No user phone for checkout");
      return;
    }

    console.log("Processing checkout...");
    setShowForgotItemsModal(false);

    // Merge current cart items with additional items being added
    // This ensures newly added items are included in the sync (fixes stale closure issue)
    let itemsToSync = [...cartItems];
    
    additionalItems.forEach(newItem => {
      const existingIndex = itemsToSync.findIndex(item => item.id === newItem.id);
      if (existingIndex !== -1) {
        // Item exists - increase quantity
        itemsToSync[existingIndex] = {
          ...itemsToSync[existingIndex],
          quantity: itemsToSync[existingIndex].quantity + newItem.quantity,
          currentPrice: (itemsToSync[existingIndex].quantity + newItem.quantity) * itemsToSync[existingIndex].pricePerUnit,
        };
      } else {
        // New item - add to list
        itemsToSync.push({
          ...newItem,
          currentPrice: newItem.quantity * newItem.pricePerUnit,
        });
      }
    });

    // First sync cart to backend (required before checkout)
    console.log("Syncing cart to backend...", itemsToSync.length, "items");
    const syncResult = await checkoutService.syncCart(user.phone, itemsToSync);

    if (!syncResult.success) {
      console.error("Failed to sync cart:", syncResult.error);
      setErrorMessage("Failed to sync cart. Please try again.");
      setShowErrorModal(true);
      return;
    }

    console.log("Cart synced successfully, processing checkout...");

    // Process the checkout
    const result = await checkoutService.processCheckout(user.phone);

    if (result.success) {
      console.log("Checkout successful:", result.data);
      setShowCheckoutSuccessModal(true);
    } else {
      console.error("Checkout failed:", result.error);
      setErrorMessage("Checkout failed. Please try again.");
      setShowErrorModal(true);
    }
  };

  return {
    // State
    showForgotItemsModal,
    showCheckoutSuccessModal,
    checkoutSuggestions,
    isLoadingSuggestions,
    showIncompleteListModal,
    errorMessage,
    showErrorModal,
    // Handlers
    handleCheckout,
    handleProceedWithIncompleteList,
    handleAddSuggestedItem,
    handleProceedToCheckout,
    // Setters for modals
    setShowForgotItemsModal,
    setShowCheckoutSuccessModal,
    setShowIncompleteListModal,
    setShowErrorModal,
  };
}

