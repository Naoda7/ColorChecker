import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ColorInfo from "./pages/ColorInfo";
import ColorContrast from "./pages/ColorContrast";
import ColorPalette from "./pages/ColorPalette";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<ColorInfo />} />
        <Route path="/color-contrast" element={<ColorContrast />} />
        <Route path="/color-palette" element={<ColorPalette />} />
      </Routes>
    </Router>
  );
}

export default App;