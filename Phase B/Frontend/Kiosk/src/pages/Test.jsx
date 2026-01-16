import { useState } from "react";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";

function Test() {
  const [activePage, setActivePage] = useState("cart");

  return (
    <div className="flex h-screen p-4 bg-gray-300">
      {/* NavRail on the left - using all defaults */}
      <NavRail>
        <NavRailButton
          icon={ICONS.CART}
          label="Cart"
          isActive={activePage === "cart"}
          onClick={() => setActivePage("cart")}
        />
        <NavRailButton
          icon={ICONS.GROCERY_LIST}
          label="Grocery List"
          isActive={activePage === "list"}
          onClick={() => setActivePage("list")}
        />
        <NavRailButton
          icon={ICONS.SETTINGS}
          label="Settings"
          isActive={activePage === "settings"}
          onClick={() => setActivePage("settings")}
        />
        <NavRailButton
          icon={ICONS.HELP}
          label="Help"
          isBottom={true}
          isActive={activePage === "help"}
          onClick={() => setActivePage("help")}
        />
      </NavRail>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="font-[Montserrat] text-4xl font-bold text-gray-800 mb-4">
            {activePage.charAt(0).toUpperCase() + activePage.slice(1)} Page
          </h1>
          <p className="text-gray-600">
            Click the buttons on the NavRail to switch pages
          </p>
        </div>
      </div>
    </div>
  );
}

export default Test;
