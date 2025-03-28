import React, { useRef, useEffect } from 'react';

const ProfessionalPreview = ({ 
  isPreviewVisible, 
  colors, 
  generationStyle,
  colorCount,
  MIN_COLORS,
  getContrastColor
}) => {
  const waveRef = useRef(null);
  const chartRef = useRef(null);
  
  if (!isPreviewVisible || colors.length < MIN_COLORS) return null;

  // Handle color assignments
  const [primaryColor, secondaryColor] = colors;
  const accentColor = colors[2] || secondaryColor;
  
  const textColor = getContrastColor(primaryColor);
  const secondaryTextColor = getContrastColor(secondaryColor);
  const accentTextColor = getContrastColor(accentColor);

  // Brand name logic
  const brandName = generationStyle === 'monochromatic' ? 'MONOCHROME' : 
                   generationStyle === 'warm' ? 'SUNSET' : 
                   generationStyle === 'cool' ? 'OCEANIC' : 
                   generationStyle === 'pastel' ? 'PASTELIZE' : 
                   generationStyle === 'dark' ? 'NOIR' : 
                   colors.length === 2 ? 'DUOTONE' : 'CHROMA';

  // Wave Animation Component
  const AnimatedWave = () => {
    useEffect(() => {
      let frameId;
      let progress = 0;
      const amplitude = 2;
      const frequency = 0.025;
      
      const animate = () => {
        if (waveRef.current) {
          progress += frequency;
          const paths = waveRef.current.querySelectorAll('path');
          paths.forEach((path, i) => {
            const waveHeight = amplitude * Math.sin(progress * (1 + i * 0.3));
            path.setAttribute('transform', `translate(0, ${waveHeight})`);
          });
        }
        frameId = requestAnimationFrame(animate);
      };
      
      animate();
      return () => cancelAnimationFrame(frameId);
    }, []);

    return (
      <svg 
        ref={waveRef}
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1440 120" 
        className="absolute top-[11rem] left-0 w-full h-60"
        preserveAspectRatio="none"
      >
        <path 
          fill={primaryColor} 
          fillOpacity="0.4" 
          d="M0,96L48,90.7C96,85,192,75,288,80C384,85,480,107,576,112C672,117,768,107,864,96C960,85,1056,75,1152,69.3C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
        ></path>
        <path 
          fill={primaryColor} 
          fillOpacity="0.3" 
          d="M0,96L48,101.3C96,107,192,117,288,117.3C384,117,480,107,576,112C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
        ></path>
      </svg>
    );
  };

  // Enhanced Chart Component
  const Chart = () => {
    useEffect(() => {
      if (!chartRef.current || colors.length < 2) return;

      const svg = chartRef.current;
      const width = 300;
      const height = 120;
      const margin = { top: 20, right: 20, bottom: 30, left: 30 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Clear previous chart
      svg.innerHTML = '';

      // Create scales
      const xScale = (value, index) => 
        margin.left + (index * innerWidth) / (colors.length - 1);
      
      const yScale = (value) => 
        margin.top + innerHeight - (value / 100) * innerHeight;

      // Create axes
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "path");
      xAxis.setAttribute("d", `M${margin.left},${height - margin.bottom} H${width - margin.right}`);
      xAxis.setAttribute("stroke", secondaryTextColor);
      xAxis.setAttribute("stroke-width", "1");
      svg.appendChild(xAxis);

      const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "path");
      yAxis.setAttribute("d", `M${margin.left},${margin.top} V${height - margin.bottom}`);
      yAxis.setAttribute("stroke", secondaryTextColor);
      yAxis.setAttribute("stroke-width", "1");
      svg.appendChild(yAxis);

      // Add grid lines
      for (let i = 0; i <= 100; i += 20) {
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gridLine.setAttribute("d", `M${margin.left},${yScale(i)} H${width - margin.right}`);
        gridLine.setAttribute("stroke", lightenColor(secondaryColor, 20));
        gridLine.setAttribute("stroke-width", "0.5");
        gridLine.setAttribute("stroke-dasharray", "2,2");
        svg.appendChild(gridLine);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", margin.left - 5);
        label.setAttribute("y", yScale(i) + 4);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("font-size", "8");
        label.setAttribute("fill", secondaryTextColor);
        label.textContent = `${i}%`;
        svg.appendChild(label);
      }

      // Create data points (using HSL lightness as values)
      const dataPoints = colors.map(color => {
        const hsl = hexToHsl(color);
        return {
          lightness: hsl[2], // Lightness value
          color: color
        };
      });

      // Create line path
      const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let pathData = `M${xScale(0, 0)},${yScale(dataPoints[0].lightness)}`;
      
      for (let i = 1; i < dataPoints.length; i++) {
        pathData += ` L${xScale(dataPoints[i].lightness, i)},${yScale(dataPoints[i].lightness)}`;
      }
      
      linePath.setAttribute("d", pathData);
      linePath.setAttribute("stroke", accentColor);
      linePath.setAttribute("stroke-width", "2");
      linePath.setAttribute("fill", "none");
      linePath.setAttribute("stroke-linecap", "round");
      linePath.setAttribute("stroke-linejoin", "round");
      svg.appendChild(linePath);

      // Create area path
      const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let areaData = `M${xScale(0, 0)},${height - margin.bottom} L${xScale(0, 0)},${yScale(dataPoints[0].lightness)}`;
      
      for (let i = 1; i < dataPoints.length; i++) {
        areaData += ` L${xScale(dataPoints[i].lightness, i)},${yScale(dataPoints[i].lightness)}`;
      }
      
      areaData += ` L${xScale(dataPoints[dataPoints.length - 1].lightness, dataPoints.length - 1)},${height - margin.bottom} Z`;
      
      areaPath.setAttribute("d", areaData);
      areaPath.setAttribute("fill", accentColor);
      areaPath.setAttribute("fill-opacity", "0.2");
      svg.appendChild(areaPath);

      // Create data points
      dataPoints.forEach((point, i) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", xScale(point.lightness, i));
        circle.setAttribute("cy", yScale(point.lightness));
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", point.color);
        circle.setAttribute("stroke", getContrastColor(point.color));
        circle.setAttribute("stroke-width", "1");
        svg.appendChild(circle);

        // Add tooltip
        circle.addEventListener('mouseover', () => {
          const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
          tooltip.setAttribute("x", xScale(point.lightness, i));
          tooltip.setAttribute("y", yScale(point.lightness) - 10);
          tooltip.setAttribute("text-anchor", "middle");
          tooltip.setAttribute("font-size", "8");
          tooltip.setAttribute("fill", getContrastColor(secondaryColor));
          tooltip.textContent = `${Math.round(point.lightness)}%`;
          tooltip.setAttribute("id", `tooltip-${i}`);
          svg.appendChild(tooltip);
        });

        circle.addEventListener('mouseout', () => {
          const tooltip = svg.querySelector(`#tooltip-${i}`);
          if (tooltip) svg.removeChild(tooltip);
        });
      });

      // Add title
      const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("x", width / 2);
      title.setAttribute("y", margin.top - 5);
      title.setAttribute("text-anchor", "middle");
      title.setAttribute("font-size", "9");
      title.setAttribute("font-weight", "bold");
      title.setAttribute("fill", secondaryTextColor);
      title.textContent = "Color Lightness Distribution";
      svg.appendChild(title);

    }, []);

    return (
      <div className="w-full h-32 mt-6 relative">
        <svg 
          ref={chartRef}
          viewBox="0 0 300 120" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        ></svg>
      </div>
    );
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-lg mb-4 transition-all duration-300 w-full max-w-4xl mx-auto">
      {/* Navbar */}
      <nav 
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: primaryColor,
          borderColor: lightenColor(primaryColor, 20)
        }}
      >
        <div className="flex items-center space-x-4">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-md"
            style={{ 
              backgroundColor: secondaryColor,
              color: secondaryTextColor
            }}
          >
            {brandName.charAt(0)}
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: textColor }}>
              Home
            </a>
            <a href="#" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: textColor }}>
              Products
            </a>
            {colors.length > 2 && (
              <>
                <a href="#" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: textColor }}>
                  About
                </a>
                <a href="#" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: textColor }}>
                  Contact
                </a>
              </>
            )}
          </div>
        </div>
        
        <button 
          className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all hover:scale-105"
          style={{ 
            backgroundColor: accentColor,
            color: accentTextColor
          }}
        >
          Get Started
        </button>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-12 text-center relative overflow-hidden min-h-96" style={{ backgroundColor: secondaryColor }}>
        {colors.length > 1 && <AnimatedWave />}
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 
            className="text-3xl font-bold mb-4 leading-tight"
            style={{ color: secondaryTextColor }}
          >
            {colors.length === 2 ? 'Dual-Tone Color Scheme' : 'Perfect Color Harmony'}
          </h1>
          <p 
            className="text-lg mb-8 opacity-90"
            style={{ color: secondaryTextColor }}
          >
            {colorCount}-Color {generationStyle} Palette
          </p>
          
          <Chart />
          
          <div className="flex gap-4 justify-center mt-8">
            <button
              className="px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: accentColor,
                color: accentTextColor
              }}
            >
              Try Free
            </button>
            <button
              className="px-6 py-2.5 rounded-lg font-semibold text-sm border-2 transition-all hover:opacity-80"
              style={{ 
                borderColor: secondaryTextColor,
                color: secondaryTextColor,
                backgroundColor: lightenColor(secondaryColor, 10)
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="px-6 py-6 border-t"
        style={{ 
          backgroundColor: primaryColor,
          borderColor: lightenColor(primaryColor, 20),
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <p 
            className="text-sm text-center font-medium"
            style={{ color: textColor }}
          >
            © {new Date().getFullYear()} {brandName}
            <span className="block text-xs mt-1 opacity-80">
              {colors.length === 2 ? 'Minimal Color Solutions' : 'Professional Color Palette'}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper functions
function lightenColor(hex, percent) {
  const [r, g, b] = hexToRgb(hex);
  const lighten = (value) => Math.min(255, value + (255 - value) * (percent / 100));
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function hexToHsl(hex) {
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
}

export default ProfessionalPreview;