import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { UI_CONFIG } from "@/data/uiConfig";
import DashboardLayout from "@/layouts/DashboardLayout";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!user?.phone) {
      console.error("No authenticated user - redirecting to phone input");
      navigate("/auth/phone", { replace: true });
      return;
    }

    // Fade out the loading message
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, UI_CONFIG.PULSE_ANIMATION_DURATION * 1000);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Same gradient background as loading page */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, #e4fcec 0%, #effdf3 100%)',
        }}
      />
      
      {/* Loading message with fade-out */}
      {showLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className="animate-fadeOut text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-green-600"
          >
            Preparing Dashboard...
          </p>
        </div>
      )}
      
      {/* Dashboard content */}
      <div className="relative z-10 w-full h-full">
        <DashboardLayout />
      </div>
    </div>
  );
}

export default DashboardPage;

