import { useState, useEffect, useRef } from "react";
import tinycolor from "tinycolor2";
import { motion, AnimatePresence } from "framer-motion";
import { HexColorPicker } from "react-colorful";

const ColorContrast = () => {
  // State declarations
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [contrastRatio, setContrastRatio] = useState(null);
  const [showFixOptions, setShowFixOptions] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copyNotification, setCopyNotification] = useState({
    visible: false,
    message: '',
    isSuccess: true
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const textPickerRef = useRef(null);
  const bgPickerRef = useRef(null);

  // Animation variants
  const fullscreenVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { 
        duration: 0.2,
        ease: [0.7, 0, 0.84, 0]
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    }
  };

  const previewVariants = {
    hover: { 
      scale: 1.01,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    tap: { scale: 0.99 }
  };

  // Calculate contrast ratio when colors change
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

  // Event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (textPickerRef.current && !textPickerRef.current.contains(e.target)) {
        setShowTextPicker(false);
      }
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target)) {
        setShowBgPicker(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFullscreen]);

  // Copy color to clipboard
  const handleCopyColor = (color) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopyNotification({
        visible: true,
        message: 'Color copied!',
        isSuccess: true
      });
      setTimeout(() => {
        setCopyNotification(prev => ({ ...prev, visible: false }));
      }, 2000);
    }).catch(() => {
        setCopyNotification({
          visible: true,
          message: 'Failed to copy',
          isSuccess: false
        });
    });
  };

  // Get contrast rating info
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

  // Render star ratings
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

  // Find optimal color for contrast
  const findOptimalColor = (fixedColor, changingColor, targetRatio = 7.0) => {
    const fixed = tinycolor(fixedColor);
    let optimal = tinycolor(changingColor);
    const originalHue = optimal.toHsl().h;
    
    if (tinycolor.readability(optimal, fixed) >= targetRatio) {
      return changingColor;
    }

    const isFixedLight = fixed.isLight();
    let adjustment = isFixedLight ? -15 : 15;

    for (let i = 0; i < 20; i++) {
      const hsl = optimal.toHsl();
      hsl.l = Math.min(1, Math.max(0, hsl.l + (adjustment/100)));
      optimal = tinycolor(hsl);
      
      if (tinycolor.readability(optimal, fixed) >= targetRatio) {
        for (let j = 0; j < 10; j++) {
          const newHsl = optimal.toHsl();
          newHsl.h = originalHue;
          const newColor = tinycolor(newHsl);
          
          if (tinycolor.readability(newColor, fixed) >= targetRatio) {
            return newColor.toHexString();
          }
        }
        return optimal.toHexString();
      }
    }

    return isFixedLight ? "#000000" : "#ffffff";
  };

  // Handle color fixing
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
        <p className="text-lg text-center text-gray-600 mb-8">  
          Test your text-background color combo for accessibility. Get instant WCAG ratings,  
          <span className="font-semibold"> automatic fixes</span>, and ensure your design is readable for everyone.  
        </p>  

        {/* Color Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Text Color Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Color (HEX)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTextPicker(!showTextPicker)}
                className="w-12 h-12 rounded-md border-2 border-gray-200 hover:border-gray-300 transition-colors flex-shrink-0 shadow-sm"
                style={{ backgroundColor: textColor }}
                aria-label="Open text color picker"
              />
              
              {showTextPicker && (
                <div 
                  ref={textPickerRef}
                  className="absolute left-0 z-50 mt-2 shadow-xl rounded-lg overflow-hidden"
                  style={{ top: '100%' }}
                >
                  <HexColorPicker 
                    color={textColor} 
                    onChange={setTextColor}
                  />
                  <div className="p-2 bg-white border-t border-gray-200 text-center">
                    <span className="text-sm font-mono">{textColor}</span>
                  </div>
                </div>
              )}

              <div className="relative flex-1">
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="#000000"
                  className="w-full p-2 border border-gray-300 rounded-md pr-10 focus:border-gray-800 focus:outline-none"
                />
                <button
                  onClick={() => handleCopyColor(textColor)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  title="Copy color"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Background Color Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color (HEX)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBgPicker(!showBgPicker)}
                className="w-12 h-12 rounded-md border-2 border-gray-200 hover:border-gray-300 transition-colors flex-shrink-0 shadow-sm"
                style={{ backgroundColor: bgColor }}
                aria-label="Open background color picker"
              />
              
              {showBgPicker && (
                <div 
                  ref={bgPickerRef}
                  className="absolute left-0 z-50 mt-2 shadow-xl rounded-lg overflow-hidden"
                  style={{ top: '100%' }}
                >
                  <HexColorPicker 
                    color={bgColor} 
                    onChange={setBgColor}
                  />
                  <div className="p-2 bg-white border-t border-gray-200 text-center">
                    <span className="text-sm font-mono">{bgColor}</span>
                  </div>
                </div>
              )}

              <div className="relative flex-1">
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#ffffff"
                  className="w-full p-2 border border-gray-300 rounded-md pr-10 focus:border-gray-800 focus:outline-none"
                />
                <button
                  onClick={() => handleCopyColor(bgColor)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  title="Copy color"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <h2 className="text-xl font-bold mb-2">Preview</h2>
        <motion.div 
          className="relative"
          whileHover="hover"
          whileTap="tap"
          variants={previewVariants}
        >
          <motion.div 
            className="p-6 rounded-lg mb-6 shadow-sm relative cursor-pointer"
            style={{ 
              backgroundColor: bgColor,
              color: textColor,
              border: '1px solid rgba(0,0,0,0.1)'
            }}
            onClick={() => setIsFullscreen(true)}
            layoutId="preview-container"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-2 right-2 bg-black bg-opacity-20 text-white p-1 rounded-full hover:bg-opacity-30 transition"
              title="Expand to fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
              </svg>
            </motion.button>
            <h2 className="text-xl font-bold mb-2">Accessibility Matters</h2>
            <p className="text-base">
              Good color contrast ensures your content is readable by everyone. 
              The Web Content Accessibility Guidelines (WCAG) recommend a minimum 
              contrast ratio of 4.5:1 for normal text and 3:1 for large text.
            </p>
          </motion.div>
        </motion.div>

        {/* Fullscreen Preview */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2 sm:p-4 touch-none"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
            >
              <motion.div
                  className="relative w-full h-full mx-2 my-4 p-4 sm:p-8 rounded-lg overflow-y-auto"
                  style={{ 
                  backgroundColor: bgColor,
                  color: textColor,
                  maxHeight: 'calc(100vh - 2rem)',
                  border: '1px solid rgba(0,0,0,0.1)'
                  }}
                  variants={fullscreenVariants}
                  layoutId="preview-container"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                  <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-2 right-2 bg-black bg-opacity-20 text-white p-1 sm:p-2 rounded-full"
                  aria-label="Close"
                  variants={itemVariants}
                  >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  </motion.button>

                  <div className="h-full flex flex-col justify-start space-y-4 sm:space-y-8 pt-8">
                  <motion.h2 
                      className="text-2xl sm:text-4xl font-bold"
                      variants={itemVariants}
                  >
                      Accessibility Preview
                  </motion.h2>
                  
                  <motion.p 
                      className="text-base sm:text-xl"
                      variants={itemVariants}
                  >
                      This is how your color combination looks at full size. 
                      The text should be easily readable against the background.
                  </motion.p>
                  
                  <motion.div 
                      className="space-y-4 sm:space-y-8"
                      variants={{
                      hidden: { opacity: 0 },
                      visible: {
                          opacity: 1,
                          transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.2
                          }
                      }
                      }}
                  >
                      <motion.div 
                      className="p-4 sm:p-6 rounded-lg border border-opacity-20"
                      style={{ borderColor: textColor }}
                      variants={itemVariants}
                      >
                      <motion.p 
                          className="text-xl sm:text-4xl font-bold mb-2 sm:mb-4"
                          whileHover={{ x: 5 }}
                      >
                          Large Heading Text
                      </motion.p>
                      <motion.p 
                          className="text-lg sm:text-2xl mb-2 sm:mb-4"
                          whileHover={{ x: 5 }}
                      >
                          Subheading Text
                      </motion.p>
                      <motion.p 
                          className="text-base sm:text-xl"
                          whileHover={{ x: 5 }}
                      >
                          Body Text Example
                      </motion.p>
                      </motion.div>
                      
                      <motion.div 
                      className="p-4 sm:p-6 rounded-lg border border-opacity-20"
                      style={{ borderColor: textColor }}
                      variants={itemVariants}
                      >
                      <motion.p 
                          className="text-sm sm:text-lg mb-2 sm:mb-4"
                          whileHover={{ x: 5 }}
                      >
                          Regular Paragraph (18px) - WCAG requires minimum 4.5:1 contrast for normal text.
                      </motion.p>
                      <motion.p 
                          className="text-xs sm:text-base"
                          whileHover={{ x: 5 }}
                      >
                          Small Text (16px) - For secondary information that doesn't need as much emphasis.
                      </motion.p>
                      </motion.div>
                      
                      <motion.div 
                      className="p-4 sm:p-6 rounded-lg border border-opacity-20"
                      style={{ borderColor: textColor }}
                      variants={itemVariants}
                      >
                      <motion.p 
                          className="text-xs sm:text-sm"
                          whileHover={{ x: 5 }}
                      >
                          Fine Print (14px) - For disclaimers and legal text. Requires extra attention to contrast.
                      </motion.p>
                      </motion.div>
                  </motion.div>
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contrast Results */}
        <h2 className="text-xl font-bold mb-2">Contrast Results</h2>
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
                {contrastRatio ? `${contrastRatio}` : "N/A"}
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

        {/* Warning Message */}
        {(ratingInfo.level === 'very-poor' || ratingInfo.level === 'poor') && (
          <div className={`mt-4 p-3 rounded-md ${ratingInfo.level === 'very-poor' ? 'bg-red-50' : 'bg-yellow-50'}`}>
            <p className={`text-sm ${ratingInfo.level === 'very-poor' ? 'text-red-700' : 'text-yellow-700'}`}>
              <strong>Accessibility Issue:</strong> This color combination may be difficult to read. 
              Use the "Click to fix" button to automatically optimize colors for better contrast.
            </p>
          </div>
        )}

        {/* Copy Notification */}
        {copyNotification.visible && (
          <motion.div 
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              copyNotification.isSuccess 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ColorContrast;