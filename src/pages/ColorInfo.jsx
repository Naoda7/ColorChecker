import { useState, useRef, useEffect } from 'react';
import tinycolor from 'tinycolor2';
import { HexColorPicker } from "react-colorful";

const ColorInfo = () => {
  const [inputColor, setInputColor] = useState('');
  const [colorInfo, setColorInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [copyNotification, setCopyNotification] = useState({
    visible: false,
    message: '',
    isSuccess: true
  });
  const pickerRef = useRef(null);

  const colorFormats = [
    { label: 'HEX', value: 'hex' },
    { label: 'RGB', value: 'rgb' },
    { label: 'HSL', value: 'hsl' },
    { label: 'CMYK', value: 'cmyk' },
  ];

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseCmykInput = (input) => {
    const cmykRegex = /^cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i;
    const match = input.match(cmykRegex);
    
    if (!match) return null;
    
    const [_, c, m, y, k] = match.map(Number);
    if ([c, m, y, k].some(v => v < 0 || v > 100)) return null;
    
    const r = 255 * (1 - c/100) * (1 - k/100);
    const g = 255 * (1 - m/100) * (1 - k/100);
    const b = 255 * (1 - y/100) * (1 - k/100);
    
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const getColorName = async (hex) => {
    try {
      const response = await fetch(`https://api.color.pizza/v1/${hex.replace('#', '')}`);
      const data = await response.json();
      return data.colors[0].name;
    } catch (err) {
      console.error('Failed to fetch color name:', err);
      return null;
    }
  };

  const colorToCmyk = (color) => {
    const rgb = color.toRgb();
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    let k = 1 - Math.max(r, g, b);
    let c = (1 - r - k) / (1 - k);
    let m = (1 - g - k) / (1 - k);
    let y = (1 - b - k) / (1 - k);

    if (k === 1) c = m = y = 0;

    return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cmykParsed = parseCmykInput(inputColor);
    const color = cmykParsed ? tinycolor(cmykParsed) : tinycolor(inputColor);
    
    if (!color.isValid()) {
      setError('⚠️ Invalid color format');
      setColorInfo(null);
      return;
    }

    setLoading(true);
    
    try {
      const hex = color.toHexString();
      const hsl = color.toHsl();
      const rgb = color.toRgb();
      const name = await getColorName(hex) || 'Unknown Color Name';

      setColorInfo({
        name,
        hex: hex.toUpperCase(),
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`,
        cmyk: colorToCmyk(color),
        color: hex
      });
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError('⚠️ Failed to get color information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyNotification({
        visible: true,
        message: 'Copied to clipboard!',
        isSuccess: true
      });
    } catch (err) {
      console.error('Copy failed:', err);
      setCopyNotification({
        visible: true,
        message: 'Failed to copy',
        isSuccess: false
      });
    } finally {
      setTimeout(() => {
        setCopyNotification(prev => ({ ...prev, visible: false }));
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-gray-800">
          Color Information Tool
        </h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex items-center gap-2 flex-1 bg-white p-1 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-400 relative">
              {/* Color Picker Button */}
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-md border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 flex-shrink-0 shadow-sm flex items-center justify-center"
                style={{ backgroundColor: inputColor || '#ffffff' }}
                aria-label="Open color picker"
              >
                <svg 
                  className={`w-6 h-6 ${!inputColor ? 'text-gray-400' : 'text-white opacity-90'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>

              {/* Custom Color Picker */}
              {showPicker && (
                <div 
                  ref={pickerRef}
                  className="absolute left-0 top-full mt-2 z-50 shadow-xl rounded-lg overflow-hidden"
                >
                  <HexColorPicker 
                    color={inputColor || '#ffffff'} 
                    onChange={setInputColor}
                  />
                  <div className="p-2 bg-white border-t border-gray-200 text-center">
                    <span className="text-sm font-mono">{inputColor || '#ffffff'}</span>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={inputColor}
                onChange={(e) => setInputColor(e.target.value)}
                placeholder="Enter HEX, RGB, HSL, or CMYK..."
                className="flex-1 p-3 h-14 border-0 focus:ring-0 text-gray-700 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 h-14 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Searching...' : 'Find Color'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {colorInfo && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div 
              className="w-full h-32 sm:h-48 rounded-lg mb-4 border-4 border-white shadow-inner"
              style={{ 
                backgroundColor: colorInfo.color,
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.1)'
              }}
            />
            
            <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-800">
              {colorInfo.name}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {colorFormats.map(({ label, value }) => (
                <div 
                  key={value}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <button
                      onClick={() => handleCopy(colorInfo[value])}
                      className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Copy
                    </button>
                  </div>
                  <code className="block text-sm text-gray-600 break-all mt-1">
                    {colorInfo[value]}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy Notification Popup */}
        {copyNotification.visible && (
            <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-fade-in-up ${
                copyNotification.isSuccess 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
            <div className="flex items-center gap-2">
              {copyNotification.isSuccess ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{copyNotification.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorInfo;