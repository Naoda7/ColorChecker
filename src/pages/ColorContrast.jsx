import { useState, useEffect } from "react";
import tinycolor from "tinycolor2";

const ColorContrast = () => {
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [contrastRatio, setContrastRatio] = useState(null);
  const [showFixOptions, setShowFixOptions] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const color1 = tinycolor(textColor);
    const color2 = tinycolor(bgColor);
    
    if (color1.isValid() && color2.isValid()) {
      const ratio = tinycolor.readability(color1, color2);
      setContrastRatio(ratio.toFixed(2));
    } else {
      setContrastRatio(null);
    }
    setShowFixOptions(false);
  }, [textColor, bgColor]);

  const getContrastRating = (ratio) => {
    if (!ratio) return { 
      level: "invalid",
      text: "Invalid colors", 
      activeStars: 0,
      bgClass: "bg-gray-100 border-gray-300",
      textColorClass: "text-gray-600",
      labelColorClass: "text-gray-500",
      starColor: "text-gray-400"
    };
    
    if (ratio >= 12.01) return { 
      level: "excellent",
      text: "SSS", 
      activeStars: 5,
      bgClass: "bg-green-50 border-green-300",
      textColorClass: "text-green-600",
      labelColorClass: "text-green-500",
      starColor: "text-green-500"
    };
    if (ratio >= 7.01) return { 
      level: "very-good",
      text: "Very Good", 
      activeStars: 4,
      bgClass: "bg-blue-50 border-blue-300",
      textColorClass: "text-blue-600",
      labelColorClass: "text-blue-500",
      starColor: "text-blue-500"
    };
    if (ratio >= 4.51) return { 
      level: "good",
      text: "Good", 
      activeStars: 3,
      bgClass: "bg-purple-50 border-purple-300",
      textColorClass: "text-purple-600",
      labelColorClass: "text-purple-500",
      starColor: "text-purple-500"
    };
    if (ratio >= 3.01) return { 
      level: "poor",
      text: "Poor", 
      activeStars: 2,
      bgClass: "bg-yellow-50 border-yellow-300",
      textColorClass: "text-yellow-600",
      labelColorClass: "text-yellow-500",
      starColor: "text-yellow-500"
    };
    return { 
      level: "very-poor",
      text: "Very Poor", 
      activeStars: 1,
      bgClass: "bg-red-50 border-red-300",
      textColorClass: "text-red-600",
      labelColorClass: "text-red-500",
      starColor: "text-red-500"
    };
  };

  const renderStars = (activeStars, starColor) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={i <= activeStars ? starColor : "text-gray-300"}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const findOptimalColor = (fixedColor, changingColor, targetRatio = 7.0) => {
    const fixed = tinycolor(fixedColor);
    let optimal = tinycolor(changingColor);
    const originalHue = optimal.toHsl().h;
    
    // Check if already meets target
    if (tinycolor.readability(optimal, fixed) >= targetRatio) {
      return changingColor;
    }

    // Determine adjustment direction
    const isFixedLight = fixed.isLight();
    let adjustment = isFixedLight ? -15 : 15; // Darken or lighten

    // Try to preserve original hue while meeting contrast
    for (let i = 0; i < 20; i++) {
      const hsl = optimal.toHsl();
      
      // Adjust lightness while preserving hue
      hsl.l = Math.min(1, Math.max(0, hsl.l + (adjustment/100)));
      optimal = tinycolor(hsl);
      
      // Check contrast
      if (tinycolor.readability(optimal, fixed) >= targetRatio) {
        // Try to find closest color that meets contrast
        for (let j = 0; j < 10; j++) {
          const newHsl = optimal.toHsl();
          newHsl.h = originalHue; // Preserve original hue
          const newColor = tinycolor(newHsl);
          
          if (tinycolor.readability(newColor, fixed) >= targetRatio) {
            return newColor.toHexString();
          }
        }
        return optimal.toHexString();
      }
    }

    // Fallback to extreme contrast if needed
    return isFixedLight ? "#000000" : "#ffffff";
  };

  const handleFixColor = (type) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      if (type === 'text') {
        const newTextColor = findOptimalColor(bgColor, textColor);
        setTextColor(newTextColor);
      } else {
        const newBgColor = findOptimalColor(textColor, bgColor);
        setBgColor(newBgColor);
      }
      
      setIsCalculating(false);
      setShowFixOptions(false);
    }, 300);
  };

  const ratingInfo = contrastRatio ? getContrastRating(contrastRatio) : getContrastRating(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Color Contrast Checker
        </h1>

        {/* Input section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Color (HEX)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-12 cursor-pointer"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color (HEX)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-12 h-12 cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2">Preview</h2>
        {/* Preview */}
        <div 
          className="p-6 rounded-lg mb-6 shadow-sm transition-all"
          style={{ 
            backgroundColor: bgColor,
            color: textColor,
            border: '1px solid #e5e7eb'
          }}
        >
          <h2 className="text-xl font-bold mb-2">Accessibility Matters</h2>
          <p className="text-base">
            Good color contrast ensures your content is readable by everyone. 
            The Web Content Accessibility Guidelines (WCAG) recommend a minimum 
            contrast ratio of 4.5:1 for normal text and 3:1 for large text.
          </p>
        </div>

        <h2 className="text-xl font-bold mb-2">Contrast Results</h2>

        {/* Results */}
        <div className={`p-4 rounded-lg shadow-sm border ${ratingInfo.bgClass} relative`}>
          {(ratingInfo.level === 'very-poor' || ratingInfo.level === 'poor') && (
            <div className="absolute top-2 right-2">
              <button 
                onClick={() => setShowFixOptions(!showFixOptions)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  ratingInfo.level === 'very-poor' 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                } transition-colors`}
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculating...' : 'Click to fix'}
              </button>
              
              {showFixOptions && (
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleFixColor('text')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Optimize Text Color
                    </button>
                    <button
                      onClick={() => handleFixColor('background')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Optimize Background
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${ratingInfo.labelColorClass} font-medium`}>
                Contrast Ratio
              </p>
              <p className={`text-2xl font-bold ${ratingInfo.textColorClass}`}>
                {contrastRatio ? `${contrastRatio}:1` : "N/A"}
              </p>
            </div>
            <div>
              <p className={`text-sm ${ratingInfo.labelColorClass} font-medium`}>
                Rating
              </p>
              <div className="flex items-center">
                <div className="text-2xl tracking-wider">
                  {renderStars(ratingInfo.activeStars, ratingInfo.starColor)}
                </div>
                <span className={`ml-2 font-semibold ${ratingInfo.textColorClass}`}>
                  {ratingInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {(ratingInfo.level === 'very-poor' || ratingInfo.level === 'poor') && (
          <div className={`mt-4 p-3 rounded-md ${ratingInfo.level === 'very-poor' ? 'bg-red-50' : 'bg-yellow-50'}`}>
            <p className={`text-sm ${ratingInfo.level === 'very-poor' ? 'text-red-700' : 'text-yellow-700'}`}>
              <strong>Accessibility Issue:</strong> This color combination may be difficult to read. 
              Use the "Click to fix" button to automatically optimize colors for better contrast.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorContrast;