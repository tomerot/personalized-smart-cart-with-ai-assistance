import { useNavigate } from "react-router-dom";
import { useMemo, useEffect, useRef } from "react";
import { ICONS } from "@/components/icons/icons.config";
import Icon from "@/components/icons/ICON";
import Cart from "@/components/cart/Cart";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";
import { NAV_VIEWS, VIEW_CONFIG, useViewTransition, DashboardNavRail } from "@/features/navigation";
import { CompanionView } from "@/features/smart-companion";
import { GroceryListView, useShoppingList } from "@/features/grocery-list";
import { DashboardModals, useCheckout, useLeaveSession, useShoppingRoute, useProfile, useAudioSettings, useHelp } from "@/features/dashboard";
import ProfileModal from "@/components/modal/ProfileModal";
import { cartAutoSaveService } from "@/services/cartAutoSaveService";

/**
 * DashboardLayout Component
 * 
 * Main layout for the dashboard with:
 * - NavRail on the left
 * - Dynamic content area based on NavRail selection
 * - My Cart section (always visible on the right)
 */
function DashboardLayout() {
  const navigate = useNavigate();
  const { user, hasShoppingList, logout, savedCart, clearSavedCart } = useUser();
  const { cartItems, clearCart, addProduct, loadCart, getHasChanged, resetChangedFlag } = useCart();
  const { activeView, setActiveView, isTransitioning, displayView } = useViewTransition(NAV_VIEWS.GROCERY_LIST);
  const { highlightedProductId, addConflictMessage, stopConversation, clearMessages } = useVoiceAssistant();

  // Ref to always access current cart items (avoids stale closure in auto-save service)
  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Load saved cart from crash recovery (if exists)
  useEffect(() => {
    if (savedCart && savedCart.items && savedCart.items.length > 0) {
      console.log('🔄 Restoring cart from backup:', savedCart.items.length, 'items');
      
      // Transform backend format to frontend format
      const cartItemsToLoad = savedCart.items.map(item => ({
        id: item.barcode,
        name: item.name,
        imageUrl: item.image_url,
        pricePerUnit: item.price,
        quantity: item.quantity,
        currentPrice: item.quantity * item.price,
        originalProduct: {
          barcode: item.barcode,
          name: item.name,
          image_url: item.image_url,
          company: item.company,
          category: item.category,
          price: item.price,
          size: item.size,
          ingredients: item.ingredients,
          allergens: item.allergens,
          dietary_tags: item.dietary_tags,
          nutritional_info: item.nutritional_info,
          available: item.available,
        },
      }));
      
      loadCart(cartItemsToLoad);
      console.log('✅ Cart restored successfully');
      
      // Clear saved cart after loading (so it doesn't reload on re-mount)
      clearSavedCart();
    }
  }, [savedCart, loadCart, clearSavedCart]);

  // Initialize cart auto-save service
  useEffect(() => {
    if (!user?.phone) return;

    console.log('🔄 Starting cart auto-save service for user:', user.phone);
    
    // Start the auto-save service
    // Using ref to always get current cart items (avoids stale closure)
    cartAutoSaveService.start(
      user.phone,
      () => cartItemsRef.current,
      getHasChanged,
      resetChangedFlag
    );

    // DEVELOPMENT ONLY: Expose service for manual testing
    if (import.meta.env.DEV) {
      window.cartAutoSaveService = cartAutoSaveService;
      console.log('💡 Dev Mode: You can manually trigger save with: window.cartAutoSaveService.triggerSave()');
    }

    // Cleanup: Stop the service when component unmounts
    return () => {
      console.log('🛑 Stopping cart auto-save service...');
      cartAutoSaveService.stop();
      if (import.meta.env.DEV) {
        delete window.cartAutoSaveService;
      }
    };
    // Only restart service if user phone changes (not on every cart update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  // Cart items map for quick lookup
  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cartItems]);

  // Shopping list hook
  const {
    shoppingList, isLoadingList, skippedItems, isListLoaded,
    handleToggleSkip, handleLoadGroceryList, hasUncollectedItems,
  } = useShoppingList({ user, cartItemsMap });

  // Checkout hook
  const checkout = useCheckout({ 
    user, cartItems, addProduct,
    hasUncollectedItems: shoppingList ? hasUncollectedItems : null
  });

  // Leave session hook
  const leave = useLeaveSession({
    navigate, stopConversation, clearMessages, clearCart, logout, user,
  });

  // Shopping route modal hook
  const { showShoppingRoute, actionButtonRef, handleToggleShoppingRoute, setShowShoppingRoute } = useShoppingRoute();

  // Profile modal hook
  const { showProfileModal, handleProfileClick, handleCloseProfile } = useProfile();

  // Audio settings modal hook
  const audioSettings = useAudioSettings();

  // Help modal hook
  const help = useHelp();

  // Barcode scanner integration
  const { manualScan } = useBarcodeScanner({
    autoConnect: true,
    onScanSuccess: (product, hasConflict) => {
      console.log("Product scanned:", product.name);
      if (hasConflict) console.log("⚠️ Product has conflict with user preferences");
    },
    onScanError: (barcode, error) => {
      console.error(`Scan error for ${barcode}:`, error);
      checkout.setErrorMessage(["Barcode not recognized.", "Please try again."]);
      checkout.setShowErrorModal(true);
    },
    onConflict: ({ product, conflict, alternatives }) => {
      console.log("Conflict detected:", conflict);
      addConflictMessage({
        originalProduct: product.originalProduct || product,
        conflict, alternatives,
      });
      setActiveView(NAV_VIEWS.COMPANION);
    },
  });

  
  // Checkout complete reuses session cleanup
  const handleCheckoutComplete = () => {
    console.log("Checkout complete - resetting session");
    checkout.setShowCheckoutSuccessModal(false);
    leave.performSessionCleanup();
  };

  const viewInfo = VIEW_CONFIG[displayView];
  const fadeClass = isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn';

  return (
    <div className="flex h-full w-full p-4">
      {/* NavRail - Left side */}
      <DashboardNavRail
        activeView={activeView}
        onViewChange={setActiveView}
        onLeaveClick={leave.handleLeaveClick}
        onProfileClick={handleProfileClick}
        onHelpClick={help.handleHelpClick}
      />

      {/* Main content area wrapper */}
      <div className="flex-1 h-full ml-4 flex flex-col">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className={`flex items-center gap-2 ${fadeClass}`}>
            <Icon name={viewInfo.icon} size={22} weight={600} style={{ color: "#1f2937" }} />
            <h2 className="font-[Montserrat] text-2xl font-bold text-gray-800">{viewInfo.label}</h2>
          </div>
          
          {/* Action buttons */}
          {displayView === NAV_VIEWS.GROCERY_LIST && (
            <div className="relative">
              {isListLoaded ? (
                <button 
                  ref={actionButtonRef}
                  className={`flex items-center gap-3 px-3 py-1 font-semibold rounded-xl transition-colors duration-150 
                    ${showShoppingRoute ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700 active:bg-green-800'} text-white ${fadeClass}`}
                  onClick={handleToggleShoppingRoute}
                >
                  <Icon name={ICONS.MAP} size={20} weight={500} style={{ color: "white" }} />
                  <span className="font-[Montserrat] pr-1">Shopping Route</span>
                </button>
              ) : (
                <button 
                  disabled={!hasShoppingList || isLoadingList}
                  className={`flex items-center gap-3 px-3 py-1 font-semibold rounded-xl transition-colors duration-150 ${
                    !hasShoppingList || isLoadingList
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                  } ${fadeClass}`}
                  onClick={handleLoadGroceryList}
                >
                  {isLoadingList ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="font-[Montserrat] pr-1">Loading...</span>
                    </>
                  ) : (
                    <>
                      <Icon name={ICONS.LOAD_LIST} size={20} weight={500} style={{ color: !hasShoppingList ? "#6b7280" : "white" }} />
                      <span className="font-[Montserrat] pr-1">Load List</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          
          {displayView === NAV_VIEWS.COMPANION && viewInfo.actionButton && (
            <div className="relative">
              <button 
                ref={audioSettings.audioButtonRef}
                disabled={!audioSettings.isVolumeControlAvailable}
                className={`flex items-center gap-3 px-3 py-1 font-semibold rounded-xl transition-colors duration-150 ${
                  !audioSettings.isVolumeControlAvailable
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : audioSettings.showAudioSettings 
                      ? 'bg-green-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                } ${fadeClass}`}
                onClick={audioSettings.handleAudioSettingsClick}
              >
                <Icon 
                  name={viewInfo.actionButton.icon} 
                  size={20} 
                  weight={500} 
                  style={{ color: !audioSettings.isVolumeControlAvailable ? "#6b7280" : "white" }} 
                />
                <span className="font-[Montserrat] pr-1">{viewInfo.actionButton.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic content area */}
        <div className="flex-1 rounded-2xl border border-gray-200 overflow-hidden" style={{ backgroundColor: '#f7fef9' }}>
          <div className={`w-full h-full p-6 flex flex-col ${fadeClass}`}>
            {displayView === NAV_VIEWS.GROCERY_LIST && (
              <GroceryListView shoppingList={shoppingList} skippedItems={skippedItems} onToggleSkip={handleToggleSkip} />
            )}
            {displayView === NAV_VIEWS.COMPANION && <CompanionView />}
            {displayView === NAV_VIEWS.DISCOUNTS && (
              <div className="text-gray-600">Discounts and offers will appear here</div>
            )}
          </div>
        </div>
      </div>

      {/* My Cart section */}
      <div className="shrink-0 w-[580px] h-full ml-6">
        <Cart onCheckout={checkout.handleCheckout} onManualBarcodeSubmit={manualScan} highlightedProductId={highlightedProductId} />
      </div>

      {/* All modals */}
      <DashboardModals
        showLeaveModal={leave.showLeaveModal}
        onCancelLeave={leave.handleCancelLeave}
        onConfirmLeave={leave.handleConfirmLeave}
        showErrorModal={checkout.showErrorModal}
        errorMessage={checkout.errorMessage}
        onCloseError={() => checkout.setShowErrorModal(false)}
        showForgotItemsModal={checkout.showForgotItemsModal}
        onCloseForgotItems={() => checkout.setShowForgotItemsModal(false)}
        onAddSuggestedItem={checkout.handleAddSuggestedItem}
        onProceedToCheckout={checkout.handleProceedToCheckout}
        checkoutSuggestions={checkout.checkoutSuggestions}
        isLoadingSuggestions={checkout.isLoadingSuggestions}
        showCheckoutSuccessModal={checkout.showCheckoutSuccessModal}
        onCheckoutComplete={handleCheckoutComplete}
        showIncompleteListModal={checkout.showIncompleteListModal}
        onCloseIncompleteList={() => checkout.setShowIncompleteListModal(false)}
        onProceedWithIncompleteList={checkout.handleProceedWithIncompleteList}
        showShoppingRoute={showShoppingRoute}
        onCloseShoppingRoute={() => setShowShoppingRoute(false)}
        actionButtonRef={actionButtonRef}
        shoppingList={shoppingList}
        cartItemsMap={cartItemsMap}
        skippedItems={skippedItems}
        showAudioSettings={audioSettings.showAudioSettings}
        onCloseAudioSettings={audioSettings.handleCloseAudioSettings}
        audioButtonRef={audioSettings.audioButtonRef}
        volume={audioSettings.volume}
        onVolumeChange={audioSettings.handleVolumeChange}
        isLoadingVolume={audioSettings.isLoading}
        showHelpModal={help.showHelpModal}
        onCloseHelp={help.handleCloseHelp}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfile}
      />
    </div>
  );
}

export default DashboardLayout;
