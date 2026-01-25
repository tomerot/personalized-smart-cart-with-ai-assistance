import React from 'react';
import storeLayout from '../../data/storeLayout.json';
import '../../assets/StoreMap.css';

const StoreMap = ({ className = '' }) => {
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
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex}
                y={rowIndex}
                width={1}
                height={1}
                className={`cell-${getCellColor(cell)}`}
              />
            ))
          )}
        </svg>
      </div>
    </div>
  );
};

export default StoreMap;

