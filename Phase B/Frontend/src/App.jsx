import { BrowserRouter, Routes, Route } from "react-router-dom";
import Mode from "./pages/Mode";
import Kiosk from "./pages/Kiosk";
import ListCreation from "./pages/ListCreation";
import Test from "./pages/Test";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Mode />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/list-creation" element={<ListCreation />} />
        <Route path="/test" element={<Test />} />{" "}
        {/* Test page should be removed before deployment */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
