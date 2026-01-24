import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavRail from "@/components/navrail/NavRail";
import NavRailButton from "@/components/navrail/NavRailButton";
import { ICONS } from "@/components/icons/icons.config";
import Cart from "@/components/cart/Cart";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useUser } from "@/context/UserContext";

// Navigation views that change the content area (not modals)
const NAV_VIEWS = {
  GROCERY_LIST: "groceryList",
  COMPANION: "companion",
  DISCOUNTS: "discounts",
};

// Sample barcodes for testing (from database)
const SAMPLE_BARCODES = [
  "7290117906477", // Sesame Kabukis (from the example)
  "7290000066318", // Another product
  "7290004131074", // Another product
];

function Test() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(NAV_VIEWS.GROCERY_LIST);
  const [manualBarcode, setManualBarcode] = useState("");
  const { user, login } = useUser();

  // Barcode scanner hook with callbacks
  const {
    isConnected,
    isLoading,
    lastScannedProduct,
    lastError,
    pendingAlternatives,
    manualScan,
    connect,
  } = useBarcodeScanner({
    autoConnect: true,
    onScanSuccess: (product, hasConflict) => {
      console.log("Product scanned successfully:", product.name);
      if (hasConflict) {
        console.log("Product has conflict with user preferences!");
      }
    },
    onScanError: (barcode, error) => {
      console.error(`Failed to scan barcode ${barcode}:`, error);
    },
    onConflict: ({ product, conflict, alternatives }) => {
      // TODO: Show modal/UI to user with conflict details and alternatives
      console.log("Conflict detected:", conflict);
      console.log("Available alternatives:", alternatives.length);
    },
  });

  const handleCheckout = () => {
    console.log("Checkout clicked");
  };

  // Handle manual barcode scan (for testing without physical scanner)
  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      manualScan(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  // Handle sample barcode click
  const handleSampleBarcodeScan = (barcode) => {
    manualScan(barcode);
  };

  // Set test user for testing (simulates logged in user with preferences)
  const handleSetTestUser = () => {
    login({
      phone: "+972541234567",
      allergies: ["sesame", "peanuts"],
      dietary_needs: ["vegan"],
    });
  };

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
      {/* Back to Dashboard Button - Fixed in top-left */}
      <button
        onClick={() => navigate("/dashboard")}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <span className="text-xl">←</span>
        <span className="font-medium">Dashboard</span>
      </button>

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
        <Cart onCheckout={handleCheckout} />
      </div>

      {/* Dynamic content area - Changes based on NavRail selection */}
      <div className="flex-1 h-full ml-4 bg-white rounded-2xl border border-gray-200 overflow-hidden overflow-y-auto">
        {activeView === NAV_VIEWS.GROCERY_LIST && (
          <div className="w-full h-full p-6">
            <h1 className="font-[Montserrat] text-2xl font-bold text-gray-800 mb-4">
              Barcode Scanner Test
            </h1>

            {/* Scanner Connection Status */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h2 className="font-semibold text-gray-700 mb-2">Scanner Status</h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                {!isConnected && (
                  <button
                    onClick={connect}
                    className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Reconnect
                  </button>
                )}
              </div>
              {isLoading && (
                <div className="mt-2 text-sm text-blue-600">
                  Processing barcode...
                </div>
              )}
            </div>

            {/* User Status */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h2 className="font-semibold text-gray-700 mb-2">User Preferences</h2>
              {user ? (
                <div className="text-sm text-gray-600">
                  <p><strong>Phone:</strong> {user.phone}</p>
                  <p><strong>Allergies:</strong> {user.allergies?.join(", ") || "None"}</p>
                  <p><strong>Dietary Needs:</strong> {user.dietary_needs?.join(", ") || "None"}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-2">No user logged in</p>
                  <button
                    onClick={handleSetTestUser}
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Set Test User (with sesame allergy)
                  </button>
                </div>
              )}
            </div>

            {/* Manual Barcode Input */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h2 className="font-semibold text-gray-700 mb-2">Manual Barcode Scan</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleManualScan}
                  disabled={!manualBarcode.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Scan
                </button>
              </div>
            </div>

            {/* Sample Barcodes */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h2 className="font-semibold text-gray-700 mb-2">Sample Barcodes</h2>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_BARCODES.map((barcode) => (
                  <button
                    key={barcode}
                    onClick={() => handleSampleBarcodeScan(barcode)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    {barcode}
                  </button>
                ))}
              </div>
            </div>

            {/* Last Scan Result */}
            {lastScannedProduct && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
                <h2 className="font-semibold text-green-700 mb-2">Last Scanned</h2>
                <p className="text-sm text-green-600">{lastScannedProduct.name}</p>
                <p className="text-xs text-green-500">₪{lastScannedProduct.pricePerUnit}</p>
              </div>
            )}

            {/* Error Display */}
            {lastError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                <h2 className="font-semibold text-red-700 mb-2">Error</h2>
                <p className="text-sm text-red-600">{lastError}</p>
              </div>
            )}

            {/* Conflict/Alternatives Display */}
            {/* TODO: Replace this with a proper modal/UI for showing alternatives to user */}
            {pendingAlternatives && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <h2 className="font-semibold text-yellow-700 mb-2">⚠️ Conflict Detected</h2>
                <p className="text-sm text-yellow-600 mb-2">
                  {pendingAlternatives.conflict.details}
                </p>
                {pendingAlternatives.conflict.allergen_conflicts.length > 0 && (
                  <p className="text-xs text-yellow-600">
                    <strong>Allergens:</strong> {pendingAlternatives.conflict.allergen_conflicts.join(", ")}
                  </p>
                )}
                {pendingAlternatives.conflict.dietary_conflicts.length > 0 && (
                  <p className="text-xs text-yellow-600">
                    <strong>Dietary:</strong> {pendingAlternatives.conflict.dietary_conflicts.join(", ")}
                  </p>
                )}
                {pendingAlternatives.alternatives.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-yellow-700">
                      {pendingAlternatives.totalAlternatives} alternatives available
                    </p>
                    {/* TODO: Show alternatives list and allow user to select one */}
                  </div>
                )}
              </div>
            )}
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
