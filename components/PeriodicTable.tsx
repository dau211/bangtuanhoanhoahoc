
import React, { useState } from 'react';
import { ElementData } from '../types';
import ElementCell from './ElementCell';

interface PeriodicTableProps {
  elements: ElementData[];
  onElementClick: (element: ElementData) => void;
}

type ViewMode = 'scroll' | 'fit' | 'list' | 'rotate';

const PeriodicTable: React.FC<PeriodicTableProps> = ({ elements, onElementClick }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('scroll');

  const ViewControl = ({ mode, label, icon }: { mode: ViewMode, label: string, icon: React.ReactNode }) => (
      <button
          onClick={() => setViewMode(mode)}
          className={`flex flex-col md:flex-row items-center justify-center p-2 md:px-4 md:py-2 rounded-lg transition-all text-xs md:text-sm font-medium w-full md:w-auto gap-2 ${
              viewMode === mode 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'
          }`}
      >
          {icon}
          <span>{label}</span>
      </button>
  );

  return (
    <div className="w-full">
        {/* View Controls - Visible on all screens now */}
        <div className="grid grid-cols-4 md:flex md:justify-center gap-2 mb-4 px-1">
            <ViewControl 
                mode="scroll" 
                label="Cuộn" 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>}
            />
            <ViewControl 
                mode="fit" 
                label="Tổng quan" 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>}
            />
            <ViewControl 
                mode="list" 
                label="Danh sách" 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>}
            />
             <ViewControl 
                mode="rotate" 
                label="Xoay ngang" 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>}
            />
        </div>

        {/* Rotate Mode Overlay */}
        {viewMode === 'rotate' && (
             <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 right-4 z-50">
                    <button 
                        onClick={() => setViewMode('scroll')}
                        className="bg-gray-800 text-white p-3 rounded-full shadow-lg border border-gray-600 hover:bg-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                {/* 
                  Transform logic: 
                  Rotate 90 degrees. 
                  Width becomes Height (100vh). 
                  Height becomes Width (100vw).
                  Overflow-y-auto becomes horizontal scroll visually.
                */}
                <div 
                    className="origin-center transform rotate-90 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gray-900"
                    style={{ width: '100vh', height: '100vw' }}
                >
                     <div className="p-8 min-h-[600px] flex items-center justify-center">
                         <div 
                            className="grid gap-1 mx-auto"
                            style={{ 
                                gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', 
                                gridTemplateRows: 'repeat(10, minmax(0, 1fr))',
                                width: '1200px' // Fixed width large enough for detail
                            }}
                        >
                        {elements.map((element) => (
                            <ElementCell
                            key={element.atomicNumber}
                            element={element}
                            onClick={() => onElementClick(element)}
                            variant="default"
                            />
                        ))}
                        </div>
                     </div>
                </div>
                {/* Overlay Text Hint */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-pulse pointer-events-none rotate-90 md:rotate-0">
                    Cuộn để xem toàn bộ bảng
                </div>
             </div>
        )}

        {/* List Mode View */}
        {viewMode === 'list' ? (
            <div className="flex flex-col gap-1 pb-10">
                {elements.map((element) => (
                    <ElementCell
                        key={element.atomicNumber}
                        element={element}
                        onClick={() => onElementClick(element)}
                        variant="list"
                    />
                ))}
            </div>
        ) : viewMode !== 'rotate' && (
            // Standard Grid View (Scroll or Fit)
            <div className={viewMode === 'fit' ? 'w-full' : 'w-full overflow-x-auto custom-scrollbar pb-4'}>
                <div 
                className={`grid gap-0.5 md:gap-1 mx-auto ${viewMode === 'fit' ? 'w-full' : ''}`}
                style={{ 
                    gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', 
                    gridTemplateRows: 'repeat(10, minmax(0, 1fr))',
                    // If scroll mode: fix min width to ensure cells aren't squashed.
                    // If fit mode: width is auto/100% to squeeze into screen.
                    minWidth: viewMode === 'scroll' ? '900px' : 'auto', 
                    maxWidth: viewMode === 'scroll' ? '1200px' : 'none'
                }}
                >
                {elements.map((element) => (
                    <ElementCell
                    key={element.atomicNumber}
                    element={element}
                    onClick={() => onElementClick(element)}
                    variant={viewMode === 'fit' ? 'compact' : 'default'}
                    />
                ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default PeriodicTable;
