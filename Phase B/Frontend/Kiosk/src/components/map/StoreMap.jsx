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
 * @param {Array} markers - Array of marker objects: 
 *   - { x: col, y: row, type: 'location' } - Simple green dot
 *   - { x: col, y: row, type: 'route', label: string } - Green circle with label
 *   - { x: col, y: row, type: 'numbered', label: string, color: string } - Custom colored circle with number
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
          {markers.map((marker, index) => {
            const { x, y, type = 'location', label, color } = marker;
            const centerX = x + 0.5;
            const centerY = y + 0.5;
            
            if (type === 'location') {
              // Simple filled circle marker
              return (
                <g key={`marker-${index}`} className="map-marker location-marker">
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={0.35}
                    fill={color || "#16a34a"}
                    stroke="#ffffff"
                    strokeWidth={0.08}
                  />
                </g>
              );
            }
            
            if (type === 'route' && label) {
              return (
                <g key={`marker-${index}`} className="map-marker route-marker">
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={0.4}
                    fill={color || "#16a34a"}
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

            if (type === 'numbered' && label) {
              // Numbered marker with custom color (for shopping route)
              const markerColor = color || "#16a34a";
              return (
                <g key={`marker-${index}`} className="map-marker numbered-marker">
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={0.45}
                    fill={markerColor}
                    stroke="#ffffff"
                    strokeWidth={0.06}
                  />
                  <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize={0.55}
                    fontFamily="Montserrat, sans-serif"
                    fontWeight="700"
                  >
                    {label}
                  </text>
                </g>
              );
            }
            
            return null;
          })}
        </svg>
      </div>
    </div>
  );
};

export default StoreMap;

