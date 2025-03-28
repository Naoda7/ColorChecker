import { useState, useCallback, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import quantize from 'quantize';
import { hslToHex, hexToRgb, normalizeHex, hexToHsl } from '../utils/colorUtils';
import { motion, AnimatePresence } from 'framer-motion';

const ImageColorExtractor = ({ onExtract, onClose }) => {
  const [image, setImage] = useState(null);
  const [colors, setColors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [error, setError] = useState(null);
  const [autoColorCount, setAutoColorCount] = useState(true);
  const [detectedColorCount, setDetectedColorCount] = useState(8);
  const [colorCount, setColorCount] = useState(8);
  const [extractionMode, setExtractionMode] = useState('normal');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Copy notification state matching ColorContrast.jsx
  const [copyNotification, setCopyNotification] = useState({
    visible: false,
    message: '',
    isSuccess: true
  });

  const getColorDistance = useCallback((color1, color2) => {
    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);
    return Math.sqrt(
      Math.pow(r2 - r1, 2) + 
      Math.pow(g2 - g1, 2) + 
      Math.pow(b2 - b1, 2)
    );
  }, []);

  const extractColors = useCallback(async (mode = 'normal') => {
    if (!image || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setExtractionMode(mode);
    
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = image;

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      const MAX_DIMENSION = mode === 'precise' ? 1500 : 800;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      if (mode === 'precise') {
        ctx.filter = 'blur(1px)';
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          const [h, s, l] = hexToHsl(normalizeHex(hex));
          const adjusted = hslToHex(h, Math.min(100, s * 1.2), l);
          const [nr, ng, nb] = hexToRgb(adjusted);
          data[i] = nr;
          data[i+1] = ng;
          data[i+2] = nb;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      const pixelData = ctx.getImageData(0, 0, width, height).data;
      const pixelArray = [];
      
      const sampleRate = mode === 'precise' ? 2 : Math.max(4, Math.floor(pixelData.length / (15000 * 4))) * 4;
      
      for (let i = 0; i < pixelData.length; i += sampleRate) {
        pixelArray.push([pixelData[i], pixelData[i+1], pixelData[i+2]]);
      }

      const uniqueColors = new Set();
      pixelArray.forEach(pixel => {
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
        uniqueColors.add(normalizeHex(hex));
      });
      
      const actualCount = Math.min(12, Math.max(2, uniqueColors.size));
      setDetectedColorCount(actualCount);
      
      const finalColorCount = autoColorCount ? actualCount : Math.min(12, Math.max(2, colorCount));

      const clusterCount = mode === 'precise' ? Math.min(24, finalColorCount * 2) : finalColorCount;
      let colorMap = quantize(pixelArray, clusterCount);
      
      let extractedColors = colorMap ? colorMap.palette().map(color => 
        normalizeHex(`#${((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1)}`)
      ) : [];

      if (extractedColors.length < 2) {
        extractedColors = Array(finalColorCount).fill().map((_, i) => {
          const hue = Math.floor((i * 360) / finalColorCount);
          return hslToHex(hue, 70 + Math.random() * 20, 50 + Math.random() * 20);
        });
      }

      const finalColors = extractedColors
        .slice(0, finalColorCount)
        .filter((color, index, self) => 
          self.findIndex(c => getColorDistance(c, color) < (mode === 'precise' ? 20 : 15)) === index
        )
        .sort((a, b) => {
          const [h1] = hexToHsl(normalizeHex(a));
          const [h2] = hexToHsl(normalizeHex(b));
          return h1 - h2;
        });

      setColors(finalColors);
      setSelectedColor(finalColors[0] || '#000000');
      setColorCount(finalColors.length);

    } catch (err) {
      console.error('Color extraction failed:', err);
      setError(mode === 'precise' ? 'Precise extraction failed. Using normal mode.' : 'Failed to extract colors. Using fallback palette.');
      setColors(Array(8).fill().map((_, i) => hslToHex(i * 45, 70, 50)));
    } finally {
      setIsLoading(false);
    }
  }, [image, colorCount, autoColorCount, isLoading, getColorDistance]);

  const handleApplyColors = useCallback(() => {
    if (colors.length === 0) {
      setError('No colors to apply');
      return;
    }
    onExtract(colors.map(color => normalizeHex(color)));
    onClose();
  }, [colors, onExtract, onClose]);

  const handleImageUpload = useCallback((file) => {
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG, WEBP)');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setColors([]);
      setExtractionMode('normal');
    };
    reader.readAsDataURL(file);
  }, []);

  // Updated copy function to match ColorContrast.jsx
  const handleCopyColor = useCallback((color) => {
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
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  }, [handleImageUpload]);

  // Prevent background scroll on mobile
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-70 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 sm:p-6 pb-2 sm:pb-4 border-b flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Image Color Extractor</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                {extractionMode === 'precise' 
                  ? 'Performing detailed color analysis...' 
                  : autoColorCount 
                    ? 'Analyzing image colors...' 
                    : `Extracting ${colorCount} colors...`}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">This may take a few seconds</p>
            </div>
          ) : !image ? (
            <div className="flex flex-col items-center justify-center py-4 sm:py-8">
              <div 
                ref={dropAreaRef}
                className={`w-[80%] h-full sm:h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 sm:p-6 mb-4 sm:mb-6 transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm sm:text-base text-gray-500 text-center mb-3 sm:mb-4">
                  {isDragging ? 'Drop image here' : 'Drag & drop image or click to upload'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Select Image
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 text-center max-w-xs sm:max-w-md">
                Supports JPEG, PNG, WEBP formats. Upload an image to automatically detect its color palette.
              </p>
            </div>
          ) : colors.length === 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Image Preview Only */}
              <div className="flex flex-col items-center">
                <div className="relative rounded-lg overflow-hidden w-full max-w-xs sm:max-w-md h-48 sm:h-64 mb-4 sm:mb-6">
                  <img 
                    src={image} 
                    className="absolute h-full w-full object-contain"
                    alt="Uploaded preview" 
                  />
                </div>

                <div className="w-full max-w-xs sm:max-w-md space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        Color Count: {colorCount}
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={autoColorCount}
                          onChange={() => setAutoColorCount(!autoColorCount)}
                          className="form-checkbox h-3 sm:h-4 w-3 sm:w-4 text-blue-600 transition duration-150 ease-in-out"
                        />
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-700">Auto-detect</span>
                      </label>
                    </div>
                    
                    {!autoColorCount && (
                      <div>
                        <input
                          type="range"
                          min="2"
                          max="12"
                          value={colorCount}
                          onChange={(e) => setColorCount(parseInt(e.target.value))}
                          className="w-full h-1 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-2xs sm:text-xs text-gray-500 mt-1">
                          <span>2</span>
                          <span>6</span>
                          <span>12</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setImage(null);
                        setColors([]);
                        setError(null);
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New Image
                    </button>

                    <button
                      onClick={() => extractColors('normal')}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Extract Colors
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 md:m-auto">
              {/* Image and Color Picker Row */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Image Preview */}
                <div className="lg:flex-1 flex justify-center">
                  <div className="relative w-full max-w-xs sm:max-w-md">
                    <img 
                      src={image} 
                      className="w-full h-auto max-h-48 sm:max-h-80 object-contain rounded-lg"
                      alt="Uploaded preview" 
                    />
                  </div>
                </div>

                {/* Color Inspector */}
                <div className="lg:flex-1 md:m-0 m-auto">
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      Color Inspector
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 md:pl-14">
                      <HexColorPicker 
                        color={selectedColor} 
                        onChange={setSelectedColor} 
                        className="w-full h-32 sm:h-40 md:m-0 m-auto rounded-md overflow-hidden border border-gray-300"
                      />
                      <div className="flex flex-col justify-between">
                        <div className="flex items-center mb-2 md:m-0 m-auto sm:mb-0">
                          <div 
                            className="w-8 h-8 rounded-md mr-2 sm:mr-3 border border-gray-200 shadow-sm"
                            style={{ backgroundColor: selectedColor }}
                          ></div>
                          <span className="font-mono text-xs sm:text-sm bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-gray-200">
                            {selectedColor}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyColor(selectedColor)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                          title="Copy color"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls Section */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                          Color Count: {colorCount}
                          {autoColorCount && detectedColorCount !== colorCount && (
                            <span className="text-2xs sm:text-xs text-gray-500 ml-1">
                              (Detected: {detectedColorCount})
                            </span>
                          )}
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={autoColorCount}
                            onChange={() => setAutoColorCount(!autoColorCount)}
                            className="form-checkbox h-3 sm:h-4 w-3 sm:w-4 text-blue-600 transition duration-150 ease-in-out"
                          />
                          <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-700">Auto-detect</span>
                        </label>
                      </div>
                      
                      {!autoColorCount && (
                        <div>
                          <input
                            type="range"
                            min="2"
                            max="12"
                            value={colorCount}
                            onChange={(e) => setColorCount(parseInt(e.target.value))}
                            className="w-full h-1 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-2xs sm:text-xs text-gray-500 mt-1">
                            <span>2</span>
                            <span>6</span>
                            <span>12</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          setImage(null);
                          setColors([]);
                          setError(null);
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        New Image
                      </button>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                          onClick={() => extractColors('normal')}
                          disabled={isLoading}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors flex items-center justify-center ${
                            isLoading
                              ? 'bg-gray-300 cursor-not-allowed'
                              : extractionMode === 'normal'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isLoading && extractionMode === 'normal' ? (
                            <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            'Normal'
                          )}
                        </button>
                        <button
                          onClick={() => extractColors('precise')}
                          disabled={isLoading}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors flex items-center justify-center ${
                            isLoading
                              ? 'bg-gray-300 cursor-not-allowed'
                              : extractionMode === 'precise'
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isLoading && extractionMode === 'precise' ? (
                            <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            'Precise'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Color Results */}
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 sm:mb-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                          Extracted Colors ({colors.length})
                        </label>
                        {extractionMode === 'precise' && (
                          <span className="text-2xs sm:text-xs bg-purple-100 text-purple-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                            Precise Mode
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-2">
                        {colors.map((color, i) => (
                          <div
                            key={`${color}-${i}`}
                            className="h-8 sm:h-10 rounded-md cursor-pointer shadow-sm relative group transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          >
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-2xs sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded mb-0.5 sm:mb-1 hidden group-hover:block whitespace-nowrap z-10">
                              {color}
                              <div className="absolute top-full left-1/2 w-1 sm:w-2 h-1 sm:h-2 bg-black transform -translate-x-1/2 rotate-45"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyColors}
                className="w-full sm:w-80 mx-auto px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Color Palette
              </button>
            </div>
          )}

          {error && (
            <div className={`mt-3 sm:mt-4 p-2 sm:p-3 rounded-md text-xs sm:text-sm ${
              error.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {error}
            </div>
          )}
        </div>

        {/* Copy Notification - matches ColorContrast.jsx */}
        <AnimatePresence>
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
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImageColorExtractor;