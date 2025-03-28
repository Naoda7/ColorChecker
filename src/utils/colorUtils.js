// utils/colorUtils.js

/**
 * Converts hex color to RGB array
 * @param {string} hex - Hex color string (e.g. "#FFFFFF")
 * @returns {number[]} RGB array [r, g, b]
 */
export const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };
  
  /**
   * Converts HSL values to hex color
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color string
   */
  export const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  /**
   * Converts hex color to HSL array
   * @param {string} hex - Hex color string
   * @returns {number[]} HSL array [h, s, l]
   */
  export const hexToHsl = (hex) => {
    let [r, g, b] = hexToRgb(hex);
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
  
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
  
    return [h * 360, s * 100, l * 100];
  };
  
  /**
   * Calculates luminance for contrast ratio
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {number} Luminance value
   */
  export const getLuminance = (r, g, b) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  /**
   * Gets appropriate text color (black/white) for background
   * @param {string} hexColor - Background hex color
   * @returns {string} '#000000' or '#FFFFFF'
   */
  export const getContrastColor = (hexColor) => {
    const [r, g, b] = hexToRgb(hexColor);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };
  
  /**
   * Lightens a hex color by percentage
   * @param {string} hex - Hex color to lighten
   * @param {number} percent - Percentage to lighten (0-100)
   * @returns {string} RGB color string
   */
  export const lightenColor = (hex, percent) => {
    const [r, g, b] = hexToRgb(hex);
    const lighten = (value) => Math.min(255, value + (255 - value) * (percent / 100));
    return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
  };
  
  /**
   * Calculates contrast ratio between two colors
   * @param {string} color1 - First hex color
   * @param {string} color2 - Second hex color
   * @returns {number} Contrast ratio
   */
  export const getContrastRatio = (color1, color2) => {
    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);
    
    const luminance1 = getLuminance(r1, g1, b1);
    const luminance2 = getLuminance(r2, g2, b2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };
  
  /**
   * Generates a color variation based on an input color
   * @param {string} baseColor - Hex color to vary
   * @returns {string} New hex color
   */
  export const generateVariation = (baseColor) => {
    const [h, s, l] = hexToHsl(baseColor);
    const variationHue = (h + 45 + Math.random() * 90) % 360;
    const variationSaturation = Math.min(100, Math.max(20, s + (Math.random() * 40 - 20)));
    const variationLightness = Math.min(90, Math.max(10, l + (Math.random() * 30 - 15)));
    
    return hslToHex(variationHue, variationSaturation, variationLightness);
  };
  
  export default {
    hexToRgb,
    hslToHex,
    hexToHsl,
    getLuminance,
    getContrastColor,
    lightenColor,
    getContrastRatio,
    generateVariation
  };

  export const normalizeHex = (hex) => {
    if (!hex) return '#000000';
    let normalized = hex.startsWith('#') ? hex : `#${hex}`;
    // Konversi #abc ke #aabbcc
    if (normalized.length === 4) {
      normalized = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }
    return normalized.toUpperCase();
  };