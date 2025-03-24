import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ColorInfo from "./pages/ColorInfo";
import ColorContrast from "./pages/ColorContrast";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<ColorInfo />} />
        <Route path="/color-contrast" element={<ColorContrast />} />
      </Routes>
    </Router>
  );
}

export default App;