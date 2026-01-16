import { BrowserRouter, Routes, Route } from "react-router-dom";
import Kiosk from "./pages/Kiosk";
import Test from "./pages/Test";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Kiosk />} />
        <Route path="/test" element={<Test />} />{" "}
        {/* Test page should be removed before deployment */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
