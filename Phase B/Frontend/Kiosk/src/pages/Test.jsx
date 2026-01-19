import { useState } from "react";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";
import ProductCard from "@/components/cart/ProductCard";

// Navigation views that change the content area (not modals)
const NAV_VIEWS = {
  GROCERY_LIST: "groceryList",
  COMPANION: "companion",
  DISCOUNTS: "discounts",
};

function Test() {
  const [activeView, setActiveView] = useState(NAV_VIEWS.GROCERY_LIST);

  // Handlers for modal buttons (Leave, Settings, Help)
  const handleLeaveClick = () => {
    console.log("Leave clicked - will open modal");
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked - will open modal");
  };

  const handleHelpClick = () => {
    console.log("Help clicked - will open modal");
  };

  return (
    <div className="flex h-screen w-full p-4" style={{
      background: 'linear-gradient(to top, #e4fcec 0%, #effdf3 100%)',
    }}>
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

      {/* My Cart section - Always visible, integrated with background */}
      <div className="shrink-0 w-[580px] h-full ml-4 p-4">
        <h2 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4">
          My Cart
        </h2>
        
        {/* Product Card */}
        <ProductCard
          productName="Product Name"
          imageUrl="https://www.rami-levy.co.il/_ipx/w_366,f_webp/https://img.rami-levy.co.il/product/7290004131074/small.jpg"
          quantity={1}
          currentPrice={12.90}
          pricePerUnit={12.90}
          onIncrease={() => console.log("Increase")}
          onDecrease={() => console.log("Decrease")}
          onDelete={() => console.log("Delete")}
        />
      </div>

      {/* Dynamic content area - Changes based on NavRail selection */}
      <div className="flex-1 h-full ml-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
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

export default Test;
