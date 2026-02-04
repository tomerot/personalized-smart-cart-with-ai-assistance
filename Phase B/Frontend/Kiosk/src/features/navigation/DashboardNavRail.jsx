import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";
import { NAV_VIEWS } from "@/features/navigation";

// Shared style props for all NavRail buttons
const BUTTON_STYLE = {
  fillIconWhenActive: false,
  activeColor: "#e4fcec",
  inactiveColor: "#e4fcec",
  activeIconWeight: 400,
  inactiveIconWeight: 200,
  activeLabelFontWeight: 500,
  inactiveLabelFontWeight: 300,
};

/**
 * DashboardNavRail - Pre-configured NavRail with all dashboard navigation buttons
 */
function DashboardNavRail({ 
  activeView, 
  onViewChange, 
  onLeaveClick, 
  onProfileClick, 
  onHelpClick 
}) {
  return (
    <NavRail>
      {/* Top buttons - Navigation views */}
      <NavRailButton
        icon={ICONS.GROCERY_LIST}
        label="Grocery List"
        isActive={activeView === NAV_VIEWS.GROCERY_LIST}
        onClick={() => onViewChange(NAV_VIEWS.GROCERY_LIST)}
        {...BUTTON_STYLE}
      />
      <NavRailButton
        icon={ICONS.CHAT}
        label="Smart Companion"
        isActive={activeView === NAV_VIEWS.COMPANION}
        onClick={() => onViewChange(NAV_VIEWS.COMPANION)}
        {...BUTTON_STYLE}
      />
      <NavRailButton
        icon={ICONS.DISCOUNT}
        label="Discounts"
        isActive={activeView === NAV_VIEWS.DISCOUNTS}
        disabled={true}
        {...BUTTON_STYLE}
      />

      {/* Bottom buttons - Modals */}
      <NavRailButton
        icon={ICONS.LEAVE}
        label="Leave"
        isBottom={true}
        onClick={onLeaveClick}
        {...BUTTON_STYLE}
      />
      
      {/* Divider line */}
      <div isBottom={true} className="w-full px-2 py-2">
        <div className="w-full h-px bg-white/30"></div>
      </div>
      
      <NavRailButton
        icon={ICONS.PROFILE}
        label="Profile"
        isBottom={true}
        onClick={onProfileClick}
        {...BUTTON_STYLE}
      />
      <NavRailButton
        icon={ICONS.HELP}
        label="Help"
        isBottom={true}
        onClick={onHelpClick}
        {...BUTTON_STYLE}
      />
    </NavRail>
  );
}

export default DashboardNavRail;

