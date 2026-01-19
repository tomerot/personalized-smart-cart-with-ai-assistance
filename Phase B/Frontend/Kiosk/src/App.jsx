import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import LandingPage from "./pages/LandingPage";
import PhoneInputPage from "./pages/PhoneInputPage";
import OtpInputPage from "./pages/OtpInputPage";
import DashboardLoadingPage from "./pages/DashboardLoadingPage";
import DashboardPage from "./pages/DashboardPage";
import Test from "./pages/Test";
import WebSocketTest from "./pages/WebSocketTest";
import ShaderGradientBackground from "./components/shadergradient/ShaderGradient";

function AppContent() {
  const location = useLocation();
  // Show gradient on landing page and all auth pages
  const showGradient = location.pathname === "/" || location.pathname.startsWith("/auth");

  return (
    <div className="relative w-screen h-screen">
      {/* Persistent shader gradient background - for landing and auth pages */}
      <div className="absolute inset-0 z-0">
        {showGradient && <ShaderGradientBackground />}
      </div>
      
      {/* Routes layered on top */}
      <div className="relative z-10 w-full h-full">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/phone" element={<PhoneInputPage />} />
          <Route path="/auth/otp" element={<OtpInputPage />} />
          <Route path="/dashboard/loading" element={<DashboardLoadingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/test" element={<Test />} />
          <Route path="/test/websocket" element={<WebSocketTest />} />
          {/* Test pages should be removed before build */}
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
