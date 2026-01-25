import React from 'react';
import storeLayout from '../../data/storeLayout.json';
import '../../assets/StoreMap.css';

/**
 * StoreMap Component
 * 
 * Renders a store layout map with optional location markers.
 * The map is responsive and maintains aspect ratio.
 * 
 * @param {string} className - Additional CSS classes
 * @param {Array} markers - Array of marker objects: { x: col, y: row, type: 'location' | 'route', label?: string }
 */
const StoreMap = ({ className = '', markers = [] }) => {
  const { grid } = storeLayout;
  
  // Calculate grid dimensions
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Get cell color based on type
  const getCellColor = (cell) => {
    switch (cell) {
      case '.':
        return 'path';
      case '#':
        return 'wall';
      case '*':
        return 'obstacle';
      default:
        return 'path';
    }
  };

  // Render a marker at a specific position
  const renderMarker = (marker, index) => {
    const { x, y, type = 'location', label } = marker;
    const centerX = x + 0.5;
    const centerY = y + 0.5;

    if (type === 'location') {
      // Location pin marker using Material Symbols path
      return (
        <g key={`marker-${index}`} className="map-marker location-marker">
          {/* Location pin icon - scaled and centered on cell */}
          <g transform={`translate(${centerX}, ${centerY}) scale(0.035) translate(-12, -20)`}>
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              fill="#16a34a"
              stroke="#ffffff"
              strokeWidth="1"
            />
          </g>
        </g>
      );
    }

    if (type === 'route' && label) {
      // Route marker with number in circle
      return (
        <g key={`marker-${index}`} className="map-marker route-marker">
          <circle
            cx={centerX}
            cy={centerY}
            r={0.4}
            fill="#16a34a"
            stroke="#ffffff"
            strokeWidth={0.05}
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize={0.5}
            fontFamily="Montserrat, sans-serif"
            fontWeight="600"
          >
            {label}
          </text>
        </g>
      );
    }

    return null;
  };

  return (
    <div className={`store-map-container ${className}`}>
      <div className="store-map">
        <svg
          viewBox={`0 0 ${cols} ${rows}`}
          preserveAspectRatio="xMidYMid meet"
          className="store-map-svg"
        >
          {/* Grid cells - use slightly larger rects to prevent anti-aliasing gaps */}
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex}
                y={rowIndex}
                width={1.01}
                height={1.01}
                className={`cell-${getCellColor(cell)}`}
              />
            ))
          )}
          
          {/* Markers overlay */}
          {markers.map((marker, index) => renderMarker(marker, index))}
        </svg>
      </div>
    </div>
  );
};

export default StoreMap;

