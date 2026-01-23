import { useState, useEffect } from "react";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";
import Icon from "@/components/icons/ICON";
import Cart from "@/components/cart/Cart";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

// Navigation views that change the content area (not modals)
const NAV_VIEWS = {
  GROCERY_LIST: "groceryList",
  COMPANION: "companion",
  DISCOUNTS: "discounts",
};

/**
 * DashboardLayout Component
 * 
 * Main layout for the dashboard with:
 * - NavRail on the left
 * - My Cart section (always visible)
 * - Dynamic content area based on NavRail selection
 * 
 * @param {ReactNode} children - Optional children to render (currently unused)
 */
function DashboardLayout({ children }) {
  const [activeView, setActiveView] = useState(NAV_VIEWS.GROCERY_LIST);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayView, setDisplayView] = useState(NAV_VIEWS.GROCERY_LIST);

  // Handle view transitions with fade effect
  useEffect(() => {
    if (activeView !== displayView) {
      // Start fade out
      setIsTransitioning(true);
      
      // After fade out completes, change content and fade in
      const timer = setTimeout(() => {
        setDisplayView(activeView);
        setIsTransitioning(false);
      }, 400); // Half of 0.8s animation duration
      
      return () => clearTimeout(timer);
    }
  }, [activeView, displayView]);

  // Barcode scanner integration
  const {
    isConnected,
    pendingAlternatives,
  } = useBarcodeScanner({
    autoConnect: true,
    onScanSuccess: (product, hasConflict) => {
      console.log("Product scanned:", product.name);
      if (hasConflict) {
        // TODO: Show conflict modal/notification to user
        console.log("⚠️ Product has conflict with user preferences");
      }
    },
    onScanError: (barcode, error) => {
      console.error(`Scan error for ${barcode}:`, error);
      // TODO: Show error notification to user
    },
    onConflict: ({ product, conflict, alternatives }) => {
      // TODO: Show alternatives modal with conflict details
      console.log("Conflict details:", conflict);
      console.log(`${alternatives.length} alternatives available`);
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

  // Get current view info for title/icon (use displayView for smooth transitions)
  const getViewInfo = (view) => {
    switch (view) {
      case NAV_VIEWS.GROCERY_LIST:
        return { icon: ICONS.GROCERY_LIST, label: "Grocery List" };
      case NAV_VIEWS.COMPANION:
        return { icon: ICONS.CHAT, label: "Smart Companion" };
      case NAV_VIEWS.DISCOUNTS:
        return { icon: ICONS.DISCOUNT, label: "Discounts" };
      default:
        return { icon: ICONS.GROCERY_LIST, label: "Grocery List" };
    }
  };

  const viewInfo = getViewInfo(displayView);

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
        <div className="flex items-center gap-2 mb-4 shrink-0">
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

        {/* Dynamic content area - Changes based on NavRail selection */}
        <div className="flex-1 rounded-2xl border border-gray-200 overflow-hidden" style={{ backgroundColor: '#f7fef9' }}>
          <div className={`w-full h-full p-6 ${isTransitioning ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            {displayView === NAV_VIEWS.GROCERY_LIST && (
              <div className="text-gray-600">
                Your grocery list will appear here
              </div>
            )}
            {displayView === NAV_VIEWS.COMPANION && (
              <div className="text-gray-600">
                AI assistant content will appear here
              </div>
            )}
            {displayView === NAV_VIEWS.DISCOUNTS && (
              <div className="text-gray-600">
                Discounts and offers will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Cart section - Always visible, integrated with background */}
      <div className="shrink-0 w-[580px] h-full ml-4">
        <Cart onCheckout={handleCheckout} />
      </div>
    </div>
  );
}

export default DashboardLayout;

