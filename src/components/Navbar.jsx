import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  // Fungsi untuk mengecek apakah link aktif
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-white">Color Tools</h1>
          <div className="flex space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Color Explorer
            </Link>
            <Link 
              to="/color-contrast" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/color-contrast') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Color Contrast
            </Link>
            <Link 
              to="/color-palette" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/color-palette') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Color Palette
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;