
import React from 'react';
import { ElementData } from '../types';

interface ElementCellProps {
  element: ElementData;
  onClick: () => void;
  variant?: 'default' | 'compact' | 'list';
}

const categoryColors: { [key: string]: string } = {
  'diatomic nonmetal': 'bg-green-700 hover:bg-green-600',
  'noble gas': 'bg-purple-800 hover:bg-purple-700',
  'alkali metal': 'bg-red-700 hover:bg-red-600',
  'alkaline earth metal': 'bg-orange-600 hover:bg-orange-500',
  'metalloid': 'bg-teal-600 hover:bg-teal-500',
  'polyatomic nonmetal': 'bg-green-600 hover:bg-green-500',
  'post-transition metal': 'bg-blue-700 hover:bg-blue-600',
  'transition metal': 'bg-yellow-600 hover:bg-yellow-500',
  'lanthanide': 'bg-indigo-600 hover:bg-indigo-500',
  'actinide': 'bg-pink-700 hover:bg-pink-600',
  'unknown, probably transition metal': 'bg-gray-600 hover:bg-gray-500',
  'unknown, probably post-transition metal': 'bg-gray-600 hover:bg-gray-500',
  'unknown, probably metalloid': 'bg-gray-600 hover:bg-gray-500',
  'unknown, probably noble gas': 'bg-gray-600 hover:bg-gray-500',
};

const ElementCell: React.FC<ElementCellProps> = ({ element, onClick, variant = 'default' }) => {
  const colorClass = categoryColors[element.category] || 'bg-gray-700 hover:bg-gray-600';
  
  // List View Rendering
  if (variant === 'list') {
      return (
          <div 
            onClick={onClick}
            className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer transform transition-transform hover:scale-[1.02] ${colorClass} bg-opacity-90`}
          >
              <div className="w-12 text-center font-bold text-xl border-r border-white/20 pr-3 mr-3">
                  {element.atomicNumber}
              </div>
              <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-lg">{element.name}</h3>
                      <span className="font-mono font-bold text-yellow-300 text-xl">{element.symbol}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-200 mt-1">
                      <span className="capitalize">{element.category}</span>
                      <span>{element.atomicMass.toFixed(2)} u</span>
                  </div>
              </div>
          </div>
      );
  }

  // Grid Layout Positioning
  const gridPosition = {
    gridColumnStart: element.xpos,
    gridRowStart: element.ypos,
  };

  // Compact View (For "Fit to Screen" overview)
  if (variant === 'compact') {
      return (
        <div
            style={gridPosition}
            className={`p-0.5 md:p-1 border-[0.5px] border-gray-800 rounded-sm cursor-pointer flex flex-col items-center justify-center aspect-square ${colorClass}`}
            onClick={onClick}
            title={`${element.atomicNumber}. ${element.name}`}
        >
            <span className="text-[0.5rem] leading-none opacity-80 hidden sm:block">{element.atomicNumber}</span>
            <span className="text-[0.6rem] sm:text-xs font-bold leading-tight">{element.symbol}</span>
        </div>
      );
  }

  // Default View (Standard Table)
  return (
    <div
      style={gridPosition}
      className={`p-1 md:p-2 border border-gray-700 rounded-md cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-110 hover:z-10 relative flex flex-col justify-between h-full min-h-[3.5rem] md:min-h-[5rem] ${colorClass}`}
      onClick={onClick}
    >
      <div className="flex justify-between text-[0.6rem] md:text-xs text-gray-300 leading-none">
        <span>{element.atomicNumber}</span>
      </div>
      <div className="text-center flex-1 flex flex-col justify-center">
        <h2 className="text-sm md:text-xl font-bold">{element.symbol}</h2>
        <p className="text-[0.5rem] md:text-xs truncate hidden sm:block">{element.name}</p>
      </div>
    </div>
  );
};

export default ElementCell;
