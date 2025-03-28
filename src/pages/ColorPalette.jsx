import { useState, useEffect, useRef, useCallback } from 'react';
import ProfessionalPreview from '../components/ProfessionalPreview';
import ImageColorExtractor from '../components/ImageColorExtractor';
import { 
  EyeIcon, 
  EyeOffIcon,
  GenerateIcon,
  StyleIcon,
  RemoveIcon,
  AddIcon,
  BrowseIcon,
  CopyIcon,
  EditIcon,
  ExportIcon
} from '../components/Icons';
import {
  hexToRgb,
  hslToHex,
  hexToHsl,
  getContrastColor,
  lightenColor,
  getContrastRatio,
  generateVariation,
  normalizeHex
} from '../utils/colorUtils';

const ColorPalette = () => {
  const [colors, setColors] = useState([]);
  const [colorCount, setColorCount] = useState(5);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [generationStyle, setGenerationStyle] = useState('auto');
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isImageExtractorOpen, setIsImageExtractorOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [paletteName, setPaletteName] = useState('My Palette');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const MIN_COLORS = 2;
  const MAX_COLORS = 12;

  const styleMenuRef = useRef(null);
  const exportMenuRef = useRef(null);
  const nameInputRef = useRef(null);

  const GENERATION_STYLES = [
    { id: 'auto', name: 'Auto', description: 'Smart color selection' },
    { id: 'monochromatic', name: 'Mono', description: 'Single hue variations' },
    { id: 'analogous', name: 'Analog', description: 'Adjacent colors' },
    { id: 'complementary', name: 'Complement', description: 'Opposite colors' },
    { id: 'triadic', name: 'Triadic', description: 'Three colors' },
    { id: 'tetradic', name: 'Tetradic', description: 'Four colors' },
    { id: 'warm', name: 'Warm', description: 'Reds/oranges' },
    { id: 'cool', name: 'Cool', description: 'Blues/greens' },
    { id: 'pastel', name: 'Pastel', description: 'Soft colors' },
    { id: 'vibrant', name: 'Vibrant', description: 'Bright colors' },
    { id: 'dark', name: 'Dark', description: 'Dark theme colors' },
  ];

  const EXPORT_FORMATS = [
    { id: 'css', name: 'CSS Variables', extension: 'css' },
    { id: 'scss', name: 'SCSS Variables', extension: 'scss' },
    { id: 'json', name: 'JSON', extension: 'json' },
    { id: 'tailwind', name: 'Tailwind Config', extension: 'js' },
    { id: 'android', name: 'Android XML', extension: 'xml' }
  ];

  const generateDark = useCallback(() => {
    const baseHue = Math.floor(Math.random() * 360);
    return [
      hslToHex(baseHue, 70, 10),
      hslToHex(baseHue, 65, 15),
      hslToHex(baseHue, 60, 20),
      hslToHex(baseHue, 55, 25),
      hslToHex(baseHue, 50, 30),
      hslToHex(baseHue, 45, 35),
      hslToHex(baseHue, 40, 40),
      hslToHex(baseHue, 35, 45),
      hslToHex(baseHue, 30, 50),
      hslToHex(baseHue, 25, 55),
      hslToHex(baseHue, 20, 60),
      hslToHex(baseHue, 15, 65)
    ];
  }, []);

  const generateMonochromatic = useCallback((baseHue) => [
    hslToHex(baseHue, 90, 10),
    hslToHex(baseHue, 85, 20),
    hslToHex(baseHue, 80, 30),
    hslToHex(baseHue, 75, 40),
    hslToHex(baseHue, 70, 50),
    hslToHex(baseHue, 65, 60),
    hslToHex(baseHue, 60, 70),
    hslToHex(baseHue, 55, 80),
    hslToHex(baseHue, 50, 20),
    hslToHex(baseHue, 45, 40),
    hslToHex(baseHue, 40, 60),
    hslToHex(baseHue, 35, 80)
  ], []);

  const generateAnalogous = useCallback((baseHue) => [
    hslToHex(baseHue, 90, 40),
    hslToHex((baseHue + 15) % 360, 85, 50),
    hslToHex((baseHue - 15) % 360, 85, 50),
    hslToHex((baseHue + 30) % 360, 80, 60),
    hslToHex((baseHue - 30) % 360, 80, 35),
    hslToHex((baseHue + 45) % 360, 75, 45),
    hslToHex((baseHue - 45) % 360, 75, 45),
    hslToHex(baseHue, 70, 70),
    hslToHex((baseHue + 20) % 360, 65, 55),
    hslToHex((baseHue - 20) % 360, 65, 55),
    hslToHex(baseHue, 60, 30),
    hslToHex(baseHue, 55, 50)
  ], []);

  const generateComplementary = useCallback((baseHue) => [
    hslToHex(baseHue, 90, 40),
    hslToHex((baseHue + 180) % 360, 90, 50),
    hslToHex(baseHue, 85, 60),
    hslToHex((baseHue + 180) % 360, 85, 30),
    hslToHex((baseHue + 20) % 360, 80, 70),
    hslToHex((baseHue + 200) % 360, 80, 40),
    hslToHex(baseHue, 75, 20),
    hslToHex((baseHue + 180) % 360, 75, 60),
    hslToHex((baseHue - 20) % 360, 70, 50),
    hslToHex((baseHue + 160) % 360, 70, 50),
    hslToHex(baseHue, 65, 80),
    hslToHex((baseHue + 180) % 360, 65, 20)
  ], []);

  const generateTriadic = useCallback((baseHue) => [
    hslToHex(baseHue, 90, 40),
    hslToHex((baseHue + 120) % 360, 90, 50),
    hslToHex((baseHue + 240) % 360, 90, 50),
    hslToHex(baseHue, 85, 60),
    hslToHex((baseHue + 120) % 360, 85, 30),
    hslToHex((baseHue + 240) % 360, 85, 70),
    hslToHex(baseHue, 80, 20),
    hslToHex((baseHue + 120) % 360, 80, 60),
    hslToHex((baseHue + 240) % 360, 80, 40),
    hslToHex(baseHue, 75, 80),
    hslToHex((baseHue + 120) % 360, 75, 50),
    hslToHex((baseHue + 240) % 360, 75, 30)
  ], []);

  const generateTetradic = useCallback((baseHue) => [
    hslToHex(baseHue, 90, 40),
    hslToHex((baseHue + 90) % 360, 90, 50),
    hslToHex((baseHue + 180) % 360, 90, 50),
    hslToHex((baseHue + 270) % 360, 90, 40),
    hslToHex(baseHue, 85, 60),
    hslToHex((baseHue + 90) % 360, 85, 70),
    hslToHex((baseHue + 180) % 360, 85, 30),
    hslToHex((baseHue + 270) % 360, 85, 50),
    hslToHex(baseHue, 80, 20),
    hslToHex((baseHue + 90) % 360, 80, 40),
    hslToHex((baseHue + 180) % 360, 80, 60),
    hslToHex((baseHue + 270) % 360, 80, 30)
  ], []);

  const generateWarm = useCallback(() => {
    const hues = [0, 15, 30, 45, 60, 20, 40, 10, 50, 25, 55, 5];
    return hues.map(hue => hslToHex(
      hue + Math.floor(Math.random() * 10),
      70 + Math.floor(Math.random() * 20),
      40 + Math.floor(Math.random() * 40)
    ));
  }, []);

  const generateCool = useCallback(() => {
    const hues = [180, 195, 210, 225, 240, 200, 220, 190, 230, 205, 235, 185];
    return hues.map(hue => hslToHex(
      hue + Math.floor(Math.random() * 10),
      70 + Math.floor(Math.random() * 20),
      40 + Math.floor(Math.random() * 40)
    ));
  }, []);

  const generatePastel = useCallback((baseHue) => [
    hslToHex(baseHue, 50, 85),
    hslToHex((baseHue + 30) % 360, 45, 80),
    hslToHex((baseHue + 60) % 360, 40, 75),
    hslToHex((baseHue + 90) % 360, 35, 85),
    hslToHex((baseHue + 120) % 360, 30, 80),
    hslToHex((baseHue + 150) % 360, 25, 85),
    hslToHex((baseHue + 180) % 360, 20, 80),
    hslToHex((baseHue + 210) % 360, 15, 85),
    hslToHex((baseHue + 240) % 360, 10, 80),
    hslToHex((baseHue + 270) % 360, 5, 85),
    hslToHex((baseHue + 300) % 360, 10, 80),
    hslToHex((baseHue + 330) % 360, 15, 85)
  ], []);

  const generateVibrant = useCallback((baseHue) => [
    hslToHex(baseHue, 100, 50),
    hslToHex((baseHue + 30) % 360, 100, 60),
    hslToHex((baseHue + 60) % 360, 100, 50),
    hslToHex((baseHue + 90) % 360, 100, 60),
    hslToHex((baseHue + 120) % 360, 100, 50),
    hslToHex((baseHue + 150) % 360, 100, 60),
    hslToHex((baseHue + 180) % 360, 100, 50),
    hslToHex((baseHue + 210) % 360, 100, 60),
    hslToHex((baseHue + 240) % 360, 100, 50),
    hslToHex((baseHue + 270) % 360, 100, 60),
    hslToHex((baseHue + 300) % 360, 100, 50),
    hslToHex((baseHue + 330) % 360, 100, 60)
  ], []);

  const generatePaletteWithStyle = useCallback((baseHue, style) => {
    switch(style) {
      case 'monochromatic': return generateMonochromatic(baseHue);
      case 'analogous': return generateAnalogous(baseHue);
      case 'complementary': return generateComplementary(baseHue);
      case 'triadic': return generateTriadic(baseHue);
      case 'tetradic': return generateTetradic(baseHue);
      default: return generateAnalogous(baseHue);
    }
  }, [generateAnalogous, generateComplementary, generateMonochromatic, generateTetradic, generateTriadic]);

  const generateHarmoniousColor = useCallback((existingColors, baseHue) => {
    if (existingColors.length === 0) {
      return hslToHex(baseHue, 70, 50);
    }
    
    let totalH = 0;
    let totalS = 0;
    let totalL = 0;
    
    existingColors.forEach(color => {
      const [h, s, l] = hexToHsl(color);
      totalH += h;
      totalS += s;
      totalL += l;
    });
    
    const avgH = totalH / existingColors.length;
    const avgS = totalS / existingColors.length;
    const avgL = totalL / existingColors.length;
    
    const hueVariation = (existingColors.length * 30) % 360;
    const newH = (avgH + hueVariation) % 360;
    
    return hslToHex(
      newH,
      Math.min(100, Math.max(20, avgS + (Math.random() * 20 - 10))),
      Math.min(90, Math.max(10, avgL + (Math.random() * 20 - 10)))
    );
  }, []);

  const generatePalette = useCallback(() => {
    let newColors = [];
    const baseHue = Math.floor(Math.random() * 360);
    
    switch(generationStyle) {
      case 'monochromatic':
        newColors = generateMonochromatic(baseHue);
        break;
      case 'analogous':
        newColors = generateAnalogous(baseHue);
        break;
      case 'complementary':
        newColors = generateComplementary(baseHue);
        break;
      case 'triadic':
        newColors = generateTriadic(baseHue);
        break;
      case 'tetradic':
        newColors = generateTetradic(baseHue);
        break;
      case 'warm':
        newColors = generateWarm();
        break;
      case 'cool':
        newColors = generateCool();
        break;
      case 'pastel':
        newColors = generatePastel(baseHue);
        break;
      case 'vibrant':
        newColors = generateVibrant(baseHue);
        break;
      case 'dark':
        newColors = generateDark();
        break;
      case 'auto':
      default: {
        const autoStyles = ['analogous', 'complementary', 'triadic'];
        const selectedStyle = autoStyles[Math.floor(Math.random() * autoStyles.length)];
        newColors = generatePaletteWithStyle(baseHue, selectedStyle);
        break;
      }
    }
    
    while (newColors.length < colorCount) {
      const baseHueForNewColor = newColors.length > 0 ? hexToHsl(newColors[0])[0] : baseHue;
      newColors.push(generateHarmoniousColor(newColors, baseHueForNewColor));
    }
    
    setColors(newColors.slice(0, colorCount));
  }, [generationStyle, colorCount, generateMonochromatic, generateAnalogous, 
      generateComplementary, generateTriadic, generateTetradic, generateWarm, 
      generateCool, generatePastel, generateVibrant, generateDark, 
      generatePaletteWithStyle, generateHarmoniousColor]);

  const handleColorExtraction = useCallback((extractedColors) => {
    if (!extractedColors || extractedColors.length === 0) return;
    
    const normalizedColors = extractedColors.map(color => normalizeHex(color));
    setColors(normalizedColors);
    setColorCount(normalizedColors.length);
    setIsImageExtractorOpen(false);
    
    setTimeout(() => {
      setColors([...normalizedColors]);
    }, 50);
  }, []);

  const addColor = useCallback(() => {
    if (colorCount < MAX_COLORS) {
      const baseHue = colors.length > 0 ? hexToHsl(colors[Math.floor(colors.length/2)])[0] : Math.floor(Math.random() * 360);
      const newColor = generateHarmoniousColor(colors, baseHue);
      setColors(prev => [...prev, newColor]);
      setColorCount(prev => prev + 1);
    }
  }, [colorCount, colors, generateHarmoniousColor]);

  const removeColor = useCallback(() => {
    if (colorCount > MIN_COLORS) {
      setColors(prev => prev.slice(0, -1));
      setColorCount(prev => prev - 1);
    }
  }, [colorCount]);

  const regenerateColor = useCallback((index) => {
    const newColors = [...colors];
    const maxAttempts = 10;
    const minContrast = 1.5;
    
    let newColor;
    let validColorFound = false;
    
    for (let attempt = 0; attempt < maxAttempts && !validColorFound; attempt++) {
      newColor = generateVariation(newColors[index]);
      
      validColorFound = !newColors.some((color, i) => {
        return i !== index && getContrastRatio(newColor, color) < minContrast;
      });
    }
    
    newColors[index] = newColor;
    setColors(newColors);
  }, [colors]);

  const toggleStyleMenu = useCallback(() => {
    setIsStyleMenuOpen(!isStyleMenuOpen);
  }, [isStyleMenuOpen]);

  const handleStyleSelect = useCallback((styleId) => {
    setGenerationStyle(styleId);
    setIsStyleMenuOpen(false);
  }, []);

  const copyToClipboard = useCallback((text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const exportPalette = (format) => {
    let content = '';
    const formattedName = paletteName.replace(/\s+/g, '_').toLowerCase();

    switch(format) {
      case 'css':
        content = `:root {\n${colors.map((color, i) => `  --${formattedName}-${i+1}: ${color};`).join('\n')}\n}`;
        break;
      case 'scss':
        content = `$${formattedName}: (\n${colors.map((color, i) => `  ${i+1}: ${color}`).join(',\n')}\n);`;
        break;
      case 'json':
        content = JSON.stringify({
          name: paletteName,
          colors,
          generationStyle,
          createdAt: new Date().toISOString()
        }, null, 2);
        break;
      case 'tailwind':
        content = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${formattedName}': {\n${colors.map((color, i) => `          ${i+1}: '${color}'`).join(',\n')}\n        }\n      }\n    }\n  }\n}`;
        break;
      case 'android':
        content = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n` +
          colors.map((color, i) => `  <color name="${formattedName}_${i+1}">${color}</color>`).join('\n') +
          `\n</resources>`;
        break;
    }

    downloadFile(content, `${formattedName}.${EXPORT_FORMATS.find(f => f.id === format).extension}`);
    setIsExportMenuOpen(false);
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chunkColors = (arr, size) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target)) {
        setIsStyleMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    generatePalette();
  }, [generatePalette]);

  useEffect(() => {
    if (colors.length !== colorCount) {
      generatePalette();
    }
  }, [colorCount, colors.length, generatePalette]);

  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameInput]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PalettePop!</h1>
          <p className='text-lg text-center text-gray-600 mb-8'>
            Find your ideal color combinations instantly! Generate professional palettes, extract colors from images, preview in UI mockups, and export to CSS/SCSS/Tailwind - all in one seamless workflow
            </p>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-colors flex items-center"
          >
            {isPreviewVisible ? (
              <>
                <EyeOffIcon className="h-5 w-5 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <EyeIcon className="h-5 w-5 mr-2" />
                Show Preview
              </>
            )}
          </button>
        </div>

        <ProfessionalPreview 
          isPreviewVisible={isPreviewVisible}
          colors={colors}
          generationStyle={generationStyle}
          colorCount={colorCount}
          MIN_COLORS={MIN_COLORS}
          getContrastColor={getContrastColor}
        />
        <div className="flex justify-center items-center my-4">
          {showNameInput ? (
            <input
              ref={nameInputRef}
              type="text"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              onBlur={() => setShowNameInput(false)}
              onKeyDown={(e) => e.key === 'Enter' && setShowNameInput(false)}
              className="text-lg text-center font-medium bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 mx-2"
            />
          ) : (
            <>
              <h2 
                className="text-lg font-medium text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setShowNameInput(true)}
              >
                {paletteName}
              </h2>
              <button 
                onClick={() => setShowNameInput(true)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Edit palette name"
              >
                <EditIcon className="h-4 w-4" /> 
              </button>
            </>
          )}
        </div>
        <div className="mb-6">
          <div className="flex flex-col items-center">
            {chunkColors(colors, 6).map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center w-full mb-1.5">
                <div className="inline-flex flex-wrap justify-center gap-1.5">
                  {row.map((color, index) => {
                    const actualIndex = rowIndex * 6 + index;
                    return (
                      <div 
                        key={actualIndex} 
                        className="w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-between p-2 rounded-md relative group transition-all duration-200 hover:shadow-inner"
                        style={{ backgroundColor: color }}
                      >
                        <span 
                          className="px-2 py-1 rounded text-xs font-mono font-bold shadow"
                          style={{ 
                            backgroundColor: getContrastColor(color) === '#000000' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                            color: getContrastColor(color)
                          }}
                        >
                          {color}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => regenerateColor(actualIndex)}
                            className="bg-white bg-opacity-90 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium shadow hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                            title="Regenerate"
                          >
                            ↻
                          </button>
                          {actualIndex > 0 && (
                            <button
                              onClick={() => {
                                const newColors = [...colors];
                                [newColors[actualIndex], newColors[actualIndex-1]] = [newColors[actualIndex-1], newColors[actualIndex]];
                                setColors(newColors);
                              }}
                              className="bg-white bg-opacity-90 text-gray-800 px-1.5 py-0.5 rounded-full text-xs font-medium shadow hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}
                          {actualIndex < colors.length - 1 && (
                            <button
                              onClick={() => {
                                const newColors = [...colors];
                                [newColors[actualIndex], newColors[actualIndex+1]] = [newColors[actualIndex+1], newColors[actualIndex]];
                                setColors(newColors);
                              }}
                              className="bg-white bg-opacity-90 text-gray-800 px-1.5 py-0.5 rounded-full text-xs font-medium shadow hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button
              onClick={generatePalette}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md transition-colors flex items-center"
            >
              <GenerateIcon className="h-5 w-5 mr-1" />
              Generate
            </button>
            
            <div className="relative" ref={styleMenuRef}>
              <button
                onClick={toggleStyleMenu}
                className="px-4 py-2 bg-blue-100 text-blue-800 hover:text-blue-100 hover:bg-blue-800  rounded-md transition-colors flex items-center"
              >
                <StyleIcon className="h-5 w-5 mr-1" />
                Style
              </button>
              
              {isStyleMenuOpen && (
                <div className="absolute z-10 bottom-full mb-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1 max-h-96 overflow-y-auto">
                    {GENERATION_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => handleStyleSelect(style.id)}
                        className={`block w-full text-left px-4 py-2 text-sm ${generationStyle === style.id ? 
                          'bg-blue-100 text-blue-800' : 
                          'text-gray-700 hover:bg-gray-100'}`}
                      >
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsImageExtractorOpen(true)}
              className="px-4 py-2 bg-blue-100 text-blue-800 hover:text-blue-100 hover:bg-blue-800 rounded-md transition-colors flex items-center"
            >
              <BrowseIcon className="h-5 w-5 mr-1" />
              Browse
            </button>

            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-4 py-2 bg-blue-100 text-blue-800 hover:text-blue-100 hover:bg-blue-800 rounded-md transition-colors flex items-center"
              >
                <ExportIcon className="h-5 w-5 mr-1" />
                Export
              </button>
              
              {isExportMenuOpen && (
                <div className="absolute z-10 bottom-full mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {EXPORT_FORMATS.map(format => (
                      <button
                        key={format.id}
                        onClick={() => exportPalette(format.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={removeColor}
              disabled={colorCount <= MIN_COLORS}
              className={`px-3 py-2 rounded-md ${colorCount <= MIN_COLORS ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-800'} text-blue-800 hover:text-blue-100 transition-colors flex items-center justify-center`}
            >
              <RemoveIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={addColor}
              disabled={colorCount >= MAX_COLORS}
              className={`px-3 py-2 rounded-md ${colorCount >= MAX_COLORS ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-800'} text-blue-800 hover:text-blue-100 transition-colors flex items-center justify-center`}
            >
              <AddIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">Color Information</h2>
          <div className={`grid ${colors.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3`}>
            {colors.map((color, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg group relative" style={{ backgroundColor: lightenColor(color, 90) }}>
                <div 
                  className="w-10 h-10 rounded-md flex-shrink-0 border border-gray-200 shadow-sm"
                  style={{ backgroundColor: color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-bold truncate">{color}</p>
                    <button 
                      onClick={() => copyToClipboard(color, index)}
                      className="text-gray-400 hover:text-gray-700 ml-2 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? (
                        <span className="text-xs text-green-500">Copied!</span>
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">RGB: {hexToRgb(color).join(', ')}</p>
                  <p className="text-xs mt-1">
                    <span className="font-medium">Contrast:</span> {getContrastRatio(color, '#FFFFFF').toFixed(2)}:1
                  </p>
                  <p className="text-xs mt-1">
                    <span className="font-medium">HSL:</span> {hexToHsl(color).map(v => Math.round(v)).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isImageExtractorOpen && (
        <ImageColorExtractor 
          onExtract={handleColorExtraction}
          onClose={() => setIsImageExtractorOpen(false)}
        />
      )}
    </div>
  );
};

export default ColorPalette;