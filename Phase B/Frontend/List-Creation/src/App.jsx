import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PhoneInputPage, OtpInputPage, ListCreationPage } from "./pages";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/auth/phone" replace />} />

        {/* Auth routes */}
        <Route path="/auth/phone" element={<PhoneInputPage />} />
        <Route path="/auth/otp" element={<OtpInputPage />} />

        {/* Main app routes */}
        <Route path="/list" element={<ListCreationPage />} />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/auth/phone" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
