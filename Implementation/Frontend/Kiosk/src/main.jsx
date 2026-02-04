import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import App from "./App.jsx";
import { enableKioskMode } from "./utils/KioskMode.js";

enableKioskMode();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
