import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { userStatusService } from "@/services/userStatusService";
import { controllerService } from "@/services/controllerService";
import { UI_CONFIG } from "@/data/uiConfig";

function DashboardLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUserHasShoppingList, setSavedCartData } = useUser();
  
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
          console.log("✅ User status from backend:", statusResult.status);
          console.log("📋 has_shopping_list:", statusResult.status.has_shopping_list, "| Type:", typeof statusResult.status.has_shopping_list);
          
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
        } else {
          console.error("Failed to connect to controllers - will retry on dashboard");
        }

        // Navigate to dashboard after data is loaded
        // No artificial delay - navigate immediately after data is ready
        console.log("Dashboard data loaded - navigating to dashboard");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Even on error, navigate to dashboard (it can handle retries)
        navigate("/dashboard", { replace: true });
      }
    };

    loadDashboardData();
  }, [phoneNumber, navigate, setUserHasShoppingList, setSavedCartData]);

  // Note: We intentionally do NOT disconnect on unmount
  // The connection should persist from loading page to dashboard
  // Controllers will be disconnected when user leaves the session (logout/exit)

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

