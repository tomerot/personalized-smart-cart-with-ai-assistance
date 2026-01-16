import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/global.css";
import App from "./App.jsx";
import { loadIcons } from "./utils/IconsLoader.js";
import { loadFonts } from "./utils/FontsLoader.js";
import { enableKioskMode } from "./utils/KioskMode.js";

loadIcons();
loadFonts();
enableKioskMode();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
