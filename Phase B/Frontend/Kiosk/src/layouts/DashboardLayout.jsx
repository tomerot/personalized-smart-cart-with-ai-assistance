import { useState } from "react";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";

// Navigation views that change the content area (not modals)
const NAV_VIEWS = {
  COMPANION: "companion",
  GROCERY_LIST: "groceryList",
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
  const [activeView, setActiveView] = useState(NAV_VIEWS.COMPANION);

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

  return (
    <div className="flex h-full w-full p-4">
      {/* NavRail - Left side */}
      <NavRail>
        {/* Top buttons - Navigation views */}
        <NavRailButton
          icon={ICONS.CHAT}
          label="Smart Companion"
          isActive={activeView === NAV_VIEWS.COMPANION}
          onClick={() => setActiveView(NAV_VIEWS.COMPANION)}
        />
        <NavRailButton
          icon={ICONS.GROCERY_LIST}
          label="Grocery List"
          isActive={activeView === NAV_VIEWS.GROCERY_LIST}
          onClick={() => setActiveView(NAV_VIEWS.GROCERY_LIST)}
        />
        <NavRailButton
          icon={ICONS.DISCOUNT}
          label="Discounts"
          isActive={activeView === NAV_VIEWS.DISCOUNTS}
          disabled={true}
        />
        <NavRailButton
          icon={ICONS.LEAVE}
          label="Leave"
          onClick={handleLeaveClick}
        />

        {/* Bottom buttons - Modals */}
        <NavRailButton
          icon={ICONS.SETTINGS}
          label="Settings"
          isBottom={true}
          onClick={handleSettingsClick}
        />
        <NavRailButton
          icon={ICONS.HELP}
          label="Help"
          isBottom={true}
          onClick={handleHelpClick}
        />
      </NavRail>

      {/* My Cart section - Always visible, integrated with background */}
      <div className="shrink-0 w-[500px] h-full ml-4 p-4">
        <h2 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4">
          My Cart
        </h2>
        {/* Cart content will be added here */}
        <div className="text-gray-600 text-sm">
          Cart items will appear here
        </div>
      </div>

      {/* Dynamic content area - Changes based on NavRail selection */}
      <div className="flex-1 h-full ml-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {activeView === NAV_VIEWS.COMPANION && (
          <div className="w-full h-full p-6">
            <h1 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4">
              Smart Companion
            </h1>
            <div className="text-gray-600">
              AI assistant content will appear here
            </div>
          </div>
        )}
        {activeView === NAV_VIEWS.GROCERY_LIST && (
          <div className="w-full h-full p-6">
            <h1 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4">
              Grocery List
            </h1>
            <div className="text-gray-600">
              Your grocery list will appear here
            </div>
          </div>
        )}
        {activeView === NAV_VIEWS.DISCOUNTS && (
          <div className="w-full h-full p-6">
            <h1 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4">
              Discounts
            </h1>
            <div className="text-gray-600">
              Discounts and offers will appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;

