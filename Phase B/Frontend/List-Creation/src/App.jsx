import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test from "./pages/Test";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Test />} />
        {/* Test page should be removed before deployment */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
