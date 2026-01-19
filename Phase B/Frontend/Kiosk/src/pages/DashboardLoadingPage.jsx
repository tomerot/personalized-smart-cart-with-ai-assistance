import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { userStatusService } from "@/services/userStatusService";
import { controllerService } from "@/services/controllerService";
import { UI_CONFIG } from "@/data/uiConfig";

// ⚙️ TESTING FLAG: Set to true to navigate to Test page instead of Dashboard
// Change this to false before production build
const USE_TEST_PAGE = true;

function DashboardLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUserHasShoppingList, setSavedCartData } = useUser();
  const [controllersConnected, setControllersConnected] = useState(false);
  
  // Get phone number from navigation state or user context
  const phoneNumber = location.state?.phoneNumber || user?.phone;

  useEffect(() => {
    // Redirect if no phone number is available
    if (!phoneNumber) {
      console.error("No phone number available - redirecting to phone input");
      navigate("/auth/phone", { replace: true });
      return;
    }

    const loadDashboardData = async () => {
      try {
        // Fetch user status (shopping list and active cart flags)
        console.log("Fetching user status for:", phoneNumber);
        const statusResult = await userStatusService.getUserStatus(phoneNumber);
        
        if (statusResult.success && statusResult.status) {
          console.log("User status:", statusResult.status);
          
          // Save shopping list flag to context
          setUserHasShoppingList(statusResult.status.has_shopping_list);
          
          // If user has an active cart, fetch it
          if (statusResult.status.has_active_cart) {
            console.log("User has active cart, fetching cart data...");
            const cartResult = await userStatusService.getCart(phoneNumber);
            
            if (cartResult.success && cartResult.cart) {
              console.log("Cart fetched successfully:", cartResult.cart);
              setSavedCartData(cartResult.cart);
            } else {
              console.error("Failed to fetch cart:", cartResult.message);
            }
          } else {
            console.log("User has no active cart");
          }
        } else {
          console.error("Failed to fetch user status:", statusResult.message);
        }

        // Connect to Raspberry Pi controllers (Barcode Scanner & Voice Assistant)
        console.log("Connecting to Raspberry Pi controllers...");
        const connectionResult = await controllerService.connect();
        
        if (connectionResult.barcode || connectionResult.voice) {
          console.log("Controller connections established:", connectionResult);
          setControllersConnected(true);
        } else {
          console.error("Failed to connect to controllers - will retry on dashboard");
        }

        // Navigate to dashboard or test page after data is loaded
        // No artificial delay - navigate immediately after data is ready
        const destination = USE_TEST_PAGE ? "/test" : "/dashboard";
        console.log(`Dashboard data loaded - navigating to ${destination}`);
        navigate(destination, { replace: true });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Even on error, navigate to destination (it can handle retries)
        const destination = USE_TEST_PAGE ? "/test" : "/dashboard";
        navigate(destination, { replace: true });
      }
    };

    loadDashboardData();
  }, [phoneNumber, navigate, setUserHasShoppingList, setSavedCartData]);

  // Cleanup: Disconnect from controllers when component unmounts
  useEffect(() => {
    return () => {
      if (controllersConnected) {
        console.log("Cleaning up controller connections...");
        controllerService.disconnect();
      }
    };
  }, [controllersConnected]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Gradient background with fade-in */}
      <div 
        className="absolute inset-0 animate-fadeIn"
        style={{
          background: 'linear-gradient(to top, #e4fcec 0%, #effdf3 100%)',
        }}
      />
      
      {/* Loading message */}
      <p
        className="relative z-10 pulse-animation text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-green-600"
        style={{
          animationDuration: `${UI_CONFIG.PULSE_ANIMATION_DURATION}s`,
        }}
      >
        Preparing Dashboard...
      </p>
    </div>
  );
}

export default DashboardLoadingPage;

