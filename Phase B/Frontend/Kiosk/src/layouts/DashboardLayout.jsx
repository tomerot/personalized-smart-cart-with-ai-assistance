import { useNavigate } from "react-router-dom";
import { useRef, useState, useMemo, useCallback } from "react";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";
import Icon from "@/components/icons/ICON";
import Cart from "@/components/cart/Cart";
import ConfirmationModal from "@/components/modal/ConfirmationModal";
import MessageModal from "@/components/modal/MessageModal";
import ForgotItemsModal from "@/components/modal/ForgotItemsModal";
import CheckoutSuccessModal from "@/components/modal/CheckoutSuccessModal";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";
import { NAV_VIEWS, VIEW_CONFIG, useViewTransition } from "@/features/navigation";
import { CompanionView } from "@/features/smart-companion";
import { voiceControllerService } from "@/services/voiceControllerService";
import { barcodeControllerService } from "@/services/barcodeControllerService";
import { checkoutService } from "@/services/checkoutService";
import { productService } from "@/services/productService";
import { GroceryListView, ShoppingListMapPopover } from "@/features/grocery-list";
import { shoppingListService } from "@/services/shoppingListService";

/**
 * DashboardLayout Component
 * 
 * Main layout for the dashboard with:
 * - NavRail on the left
 * - Dynamic content area based on NavRail selection
 * - My Cart section (always visible on the right)
 * 
 * @param {ReactNode} children - Optional children to render (currently unused)
 */
function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { user, hasShoppingList, logout } = useUser();
  const { cartItems, clearCart, addProduct } = useCart();
  const { activeView, setActiveView, isTransitioning, displayView } = useViewTransition(NAV_VIEWS.GROCERY_LIST);
  const { highlightedProductId, addConflictMessage, stopConversation, clearMessages } = useVoiceAssistant();

  // Modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Checkout state
  const [showForgotItemsModal, setShowForgotItemsModal] = useState(false);
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [checkoutSuggestions, setCheckoutSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [checkoutItemsTracked, setCheckoutItemsTracked] = useState(0);
  
  // Shopping list state - managed here so it persists across view changes
  const [shoppingList, setShoppingList] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [skippedItems, setSkippedItems] = useState(new Set());
  const [showMapPopover, setShowMapPopover] = useState(false);
  const actionButtonRef = useRef(null);
  
  // Log hasShoppingList only once per session
  const hasLoggedShoppingList = useRef(false);
  if (!hasLoggedShoppingList.current) {
    console.log('🔍 DashboardLayout - hasShoppingList:', hasShoppingList, '| Type:', typeof hasShoppingList);
    hasLoggedShoppingList.current = true;
  }

  // Cart items map for quick lookup
  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach(item => {
      map.set(item.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  // Toggle skip status for an item
  const handleToggleSkip = useCallback((barcode) => {
    setSkippedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(barcode)) {
        newSet.delete(barcode);
      } else {
        newSet.add(barcode);
      }
      return newSet;
    });
  }, []);

  // Barcode scanner integration
  const {
    isConnected,
    pendingAlternatives,
    manualScan,
  } = useBarcodeScanner({
    autoConnect: true,
    onScanSuccess: (product, hasConflict) => {
      console.log("Product scanned:", product.name);
      if (hasConflict) {
        console.log("⚠️ Product has conflict with user preferences");
      }
    },
    onScanError: (barcode, error) => {
      console.error(`Scan error for ${barcode}:`, error);
      // Show error modal to user
      setErrorMessage(`Product not found for barcode: ${barcode}`);
      setShowErrorModal(true);
    },
    onConflict: ({ product, conflict, alternatives }) => {
      console.log("Conflict detected:", conflict);
      console.log(`${alternatives.length} alternatives available`);

      // Add conflict message to Smart Companion chat
      addConflictMessage({
        originalProduct: product.originalProduct || product,
        conflict: conflict,
        alternatives: alternatives,
      });

      // Switch to Smart Companion view to show the conflict
      setActiveView(NAV_VIEWS.COMPANION);
    },
  });

  // Handlers for modal buttons (Leave, Settings, Help)
  const handleLeaveClick = () => {
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = () => {
    console.log("Leave confirmed - resetting session and returning to landing page");

    // Close modal first
    setShowLeaveModal(false);

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
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
  };

  const handleSettingsClick = () => {
    // TODO: Open settings modal
    console.log("Settings clicked - will open modal");
  };

  const handleHelpClick = () => {
    // TODO: Open help modal
    console.log("Help clicked - will open modal");
  };

  const handleCheckout = async () => {
    if (!user?.phone) {
      console.error("No user phone for checkout");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty");
      setShowErrorModal(true);
      return;
    }

    console.log("Checkout clicked - fetching suggestions...");
    setIsLoadingSuggestions(true);
    setShowForgotItemsModal(true);

    // Get barcodes of items currently in cart
    const cartBarcodes = cartItems.map(item => item.id);

    // Fetch replenishment suggestions
    const result = await checkoutService.getSuggestions(user.phone, cartBarcodes);

    setIsLoadingSuggestions(false);

    if (result.success) {
      setCheckoutSuggestions(result.data.suggestions || []);
      console.log(`Found ${result.data.suggestions?.length || 0} suggestions`);
    } else {
      console.error("Failed to get suggestions:", result.error);
      // Still show the modal, just with no suggestions
      setCheckoutSuggestions([]);
    }
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
  };

  const handleProceedToCheckout = async () => {
    if (!user?.phone) {
      console.error("No user phone for checkout");
      return;
    }

    console.log("Processing checkout...");
    setShowForgotItemsModal(false);

    // First sync cart to backend (required before checkout)
    console.log("Syncing cart to backend...");
    const syncResult = await checkoutService.syncCart(user.phone, cartItems);

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
      setCheckoutItemsTracked(result.data.items_tracked || 0);
      setShowCheckoutSuccessModal(true);
    } else {
      console.error("Checkout failed:", result.error);
      setErrorMessage("Checkout failed. Please try again.");
      setShowErrorModal(true);
    }
  };

  const handleCheckoutComplete = () => {
    console.log("Checkout complete - resetting session and returning to landing page");

    setShowCheckoutSuccessModal(false);

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

    // Navigate back to landing page
    setTimeout(() => {
      navigate("/");
    }, 50);
  };

  // Load shopping list from backend
  const handleLoadGroceryList = async () => {
    if (!user?.phone || isLoadingList) return;
    
    setIsLoadingList(true);
    console.log("Loading grocery list from backend...");

    try {
      const result = await shoppingListService.getShoppingList(user.phone);
      
      if (result.success && result.data?.items?.length > 0) {
        // Store the shopping list in state
        setShoppingList(result.data);
        setSkippedItems(new Set()); // Reset skipped items
        console.log(`✅ Loaded shopping list with ${result.data.items.length} items`);
      } else {
        console.log("No items in shopping list");
        setShoppingList(null);
      }
    } catch (error) {
      console.error("Failed to load grocery list:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Toggle map popover
  const handleToggleMapPopover = () => {
    setShowMapPopover(prev => !prev);
  };

  const handleAudioSettings = () => {
    // TODO: Implement audio settings modal/functionality
    console.log("Audio Settings clicked");
  };

  // Get current view info for title/icon (use displayView for smooth transitions)
  const viewInfo = VIEW_CONFIG[displayView];

  // Determine button state for Grocery List view
  const isListLoaded = shoppingList !== null && shoppingList.items?.length > 0;

  return (
    <div className="flex h-full w-full p-4">
      {/* NavRail - Left side */}
      <NavRail>
        {/* Top buttons - Navigation views */}
        <NavRailButton
          icon={ICONS.GROCERY_LIST}
          label="Grocery List"
          isActive={activeView === NAV_VIEWS.GROCERY_LIST}
          onClick={() => setActiveView(NAV_VIEWS.GROCERY_LIST)}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
        />
        <NavRailButton
          icon={ICONS.CHAT}
          label="Smart Companion"
          isActive={activeView === NAV_VIEWS.COMPANION}
          onClick={() => setActiveView(NAV_VIEWS.COMPANION)}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
        />
        <NavRailButton
          icon={ICONS.DISCOUNT}
          label="Discounts"
          isActive={activeView === NAV_VIEWS.DISCOUNTS}
          disabled={true}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
        />

        {/* Bottom buttons - Modals */}
        <NavRailButton
          icon={ICONS.LEAVE}
          label="Leave"
          isBottom={true}
          onClick={handleLeaveClick}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
        />
        {/* Divider line */}
        <div isBottom={true} className="w-full px-2 py-2">
          <div className="w-full h-px bg-white/30"></div>
        </div>
        <NavRailButton
          icon={ICONS.SETTINGS}
          label="Settings"
          isBottom={true}
          onClick={handleSettingsClick}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
        />
        <NavRailButton
          icon={ICONS.HELP}
          label="Help"
          isBottom={true}
          onClick={handleHelpClick}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
        />
      </NavRail>

      {/* Main content area wrapper */}
      <div className="flex-1 h-full ml-4 flex flex-col">
        {/* Title row - aligned with Cart title */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className={`flex items-center gap-2 ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <Icon 
              name={viewInfo.icon} 
              size={22} 
              weight={600}
              style={{ color: "#1f2937" }}
            />
            <h2 className="font-[Montserrat] text-2xl font-bold text-gray-800">
              {viewInfo.label}
            </h2>
          </div>
          
          {/* Grocery List action button - toggles between Load List and Display Map */}
          {displayView === NAV_VIEWS.GROCERY_LIST && (
            <div className="relative">
              {isListLoaded ? (
                // Show "Display Map" button after list is loaded
                <button 
                  ref={actionButtonRef}
                  className={`flex items-center gap-3 px-3 py-1 font-semibold rounded-xl transition-colors duration-150 
                    ${showMapPopover 
                      ? 'bg-green-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                    } ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}
                  onClick={handleToggleMapPopover}
                >
                  <Icon 
                    name={ICONS.MAP} 
                    size={20} 
                    weight={500}
                    style={{ color: "white" }}
                  />
                  <span className="font-[Montserrat] pr-1">Display Map</span>
                </button>
              ) : (
                // Show "Load List" button before list is loaded
                <button 
                  disabled={!hasShoppingList || isLoadingList}
                  className={`flex items-center gap-3 px-3 py-1 font-semibold rounded-xl transition-colors duration-150 ${
                    !hasShoppingList || isLoadingList
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                  } ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}
                  onClick={handleLoadGroceryList}
                >
                  {isLoadingList ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="font-[Montserrat] pr-1">Loading...</span>
                    </>
                  ) : (
                    <>
                      <Icon 
                        name={ICONS.LOAD_LIST} 
                        size={20} 
                        weight={500}
                        style={{ color: !hasShoppingList ? "#6b7280" : "white" }}
                      />
                      <span className="font-[Montserrat] pr-1">Load List</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          
          {displayView === NAV_VIEWS.COMPANION && viewInfo.actionButton && (
            <button 
              className={`flex items-center gap-3 px-3 py-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition-colors duration-150 ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}
              onClick={handleAudioSettings}
            >
              <Icon 
                name={viewInfo.actionButton.icon} 
                size={20} 
                weight={500}
                style={{ color: "white" }}
              />
              <span className="font-[Montserrat] pr-1">{viewInfo.actionButton.label}</span>
            </button>
          )}
        </div>

        {/* Dynamic content area - Changes based on NavRail selection */}
        <div className="flex-1 rounded-2xl border border-gray-200 overflow-hidden" style={{ backgroundColor: '#f7fef9' }}>
          <div className={`w-full h-full p-6 flex flex-col ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            {displayView === NAV_VIEWS.GROCERY_LIST && (
              <GroceryListView 
                shoppingList={shoppingList}
                skippedItems={skippedItems}
                onToggleSkip={handleToggleSkip}
              />
            )}
            {displayView === NAV_VIEWS.COMPANION && <CompanionView />}
            {displayView === NAV_VIEWS.DISCOUNTS && (
              <div className="text-gray-600">
                Discounts and offers will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Cart section - Always visible, integrated with background */}
      <div className="shrink-0 w-[580px] h-full ml-6">
        <Cart
          onCheckout={handleCheckout}
          onManualBarcodeSubmit={manualScan}
          highlightedProductId={highlightedProductId}
        />
      </div>

      {/* Leave Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLeaveModal}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        icon={ICONS.WARNING}
        title="Are you sure you want to leave?"
        message="Your cart and conversation history will be cleared."
        confirmText="Leave"
        cancelText="Stay"
        confirmColor="#dc2626"
        iconColor="#f59e0b"
      />

      {/* Error Modal */}
      <MessageModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        icon={ICONS.BLOCK}
        message={errorMessage}
        iconColor="#dc2626"
      />

      {/* Forgot Items Modal (Checkout Suggestions) */}
      <ForgotItemsModal
        isOpen={showForgotItemsModal}
        onClose={() => setShowForgotItemsModal(false)}
        onAddItem={handleAddSuggestedItem}
        onCheckout={handleProceedToCheckout}
        suggestions={checkoutSuggestions}
        isLoading={isLoadingSuggestions}
      />

      {/* Checkout Success Modal */}
      <CheckoutSuccessModal
        isOpen={showCheckoutSuccessModal}
        onClose={handleCheckoutComplete}
        itemsTracked={checkoutItemsTracked}
      />
      {/* Map Popover */}
      {showMapPopover && shoppingList && (
        <ShoppingListMapPopover
          shoppingList={shoppingList}
          cartItemsMap={cartItemsMap}
          skippedItems={skippedItems}
          onToggleSkip={handleToggleSkip}
          onClose={() => setShowMapPopover(false)}
          buttonRef={actionButtonRef}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
