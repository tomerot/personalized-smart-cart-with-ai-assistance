import { useRef } from "react";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";
import Icon from "@/components/icons/ICON";
import Cart from "@/components/cart/Cart";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useUser } from "@/context/UserContext";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";
import { NAV_VIEWS, VIEW_CONFIG, useViewTransition } from "@/features/navigation";
import { CompanionView } from "@/features/smart-companion";
import { GroceryListView } from "@/features/grocery-list";

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
  const { hasShoppingList } = useUser();
  const { activeView, setActiveView, isTransitioning, displayView } = useViewTransition(NAV_VIEWS.GROCERY_LIST);
  const { highlightedProductId, addConflictMessage, hasUnreadConflict } = useVoiceAssistant();
  
  // Log hasShoppingList only once per session
  const hasLoggedShoppingList = useRef(false);
  if (!hasLoggedShoppingList.current) {
    console.log('🔍 DashboardLayout - hasShoppingList:', hasShoppingList, '| Type:', typeof hasShoppingList);
    hasLoggedShoppingList.current = true;
  }

  // Barcode scanner integration
  const {
    isConnected,
    pendingAlternatives,
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
      // TODO: Show error notification to user
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
    // TODO: Open leave confirmation modal
    console.log("Leave clicked - will open modal");
  };

  const handleSettingsClick = () => {
    // TODO: Open settings modal
    console.log("Settings clicked - will open modal");
  };

  const handleHelpClick = () => {
    // TODO: Open help modal
    console.log("Help clicked - will open modal");
  };

  const handleCheckout = () => {
    // TODO: Implement checkout flow
    console.log("Checkout clicked");
  };

  const handleLoadGroceryList = () => {
    // TODO: Implement load grocery list functionality
    console.log("Load Grocery List clicked");
  };

  const handleAudioSettings = () => {
    // TODO: Implement audio settings modal/functionality
    console.log("Audio Settings clicked");
  };

  // Get current view info for title/icon (use displayView for smooth transitions)
  const viewInfo = VIEW_CONFIG[displayView];

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
          showPill={false}
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
          showPill={false}
          fillIconWhenActive={false}
          activeColor="#e4fcec"
          inactiveColor="#e4fcec"
          activeIconWeight={400}
          inactiveIconWeight={200}
          activeLabelFontWeight={500}
          inactiveLabelFontWeight={300}
          showNotificationDot={hasUnreadConflict && activeView !== NAV_VIEWS.COMPANION}
        />
        <NavRailButton
          icon={ICONS.DISCOUNT}
          label="Discounts"
          isActive={activeView === NAV_VIEWS.DISCOUNTS}
          disabled={true}
          showPill={false}
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
          showPill={false}
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
          showPill={false}
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
          showPill={false}
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
          
          {displayView === NAV_VIEWS.GROCERY_LIST && viewInfo.actionButton && (
            <button 
              disabled={!hasShoppingList}
              className={`flex items-center gap-3 px-3 py-1 font-semibold rounded-xl transition-colors duration-150 ${
                !hasShoppingList 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
              } ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}
              onClick={handleLoadGroceryList}
            >
              <Icon 
                name={viewInfo.actionButton.icon} 
                size={20} 
                weight={500}
                style={{ color: !hasShoppingList ? "#6b7280" : "white" }}
              />
              <span className="font-[Montserrat] pr-1">{viewInfo.actionButton.label}</span>
            </button>
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
            {displayView === NAV_VIEWS.GROCERY_LIST && <GroceryListView />}
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
        <Cart onCheckout={handleCheckout} highlightedProductId={highlightedProductId} />
      </div>
    </div>
  );
}

export default DashboardLayout;

