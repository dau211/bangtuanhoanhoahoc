
import React, { useState, useEffect, useRef } from 'react';
import { ElementData } from '../types';

interface QuizModalProps {
  elements: ElementData[];
  onClose: () => void;
}

interface QuizState {
  atomicNumber: string;
  protons: string;
  electrons: string;
  neutrons: string;
  massNumber: string;
  valenceElectrons: string;
  electronConfiguration: string;
}

type ValidationState = {
  [key in keyof QuizState]?: boolean;
};

type QuizViewMode = 'default' | 'compact' | 'rotate';

// Mapping cho chỉ số trên
const SUPERSCRIPTS: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
};

// Mapping ngược để validate
const REVERSE_SUPERSCRIPTS: { [key: string]: string } = Object.entries(SUPERSCRIPTS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as { [key: string]: string });

const QuizModal: React.FC<QuizModalProps> = ({ elements, onClose }) => {
  const [currentElement, setCurrentElement] = useState<ElementData | null>(null);
  const [answers, setAnswers] = useState<QuizState>({
    atomicNumber: '',
    protons: '',
    electrons: '',
    neutrons: '',
    massNumber: '',
    valenceElectrons: '',
    electronConfiguration: ''
  });
  const [validation, setValidation] = useState<ValidationState>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [viewMode, setViewMode] = useState<QuizViewMode>('default');
  
  // Ref để focus lại input cấu hình electron khi bấm phím ảo
  const configInputRef = useRef<HTMLInputElement>(null);

  // Chọn ngẫu nhiên một nguyên tố khi component mount hoặc khi chuyển câu hỏi
  const generateQuestion = () => {
    const randomIndex = Math.floor(Math.random() * elements.length);
    setCurrentElement(elements[randomIndex]);
    setAnswers({
      atomicNumber: '',
      protons: '',
      electrons: '',
      neutrons: '',
      massNumber: '',
      valenceElectrons: '',
      electronConfiguration: ''
    });
    setValidation({});
    setShowResult(false);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const calculateValenceElectrons = (config: string): number => {
    const cleanConfig = config.replace(/\[.*?\]/g, '').trim();
    const parts = cleanConfig.split(' ');
    
    let maxN = 0;
    
    parts.forEach(part => {
        if(!part) return;
        const match = part.match(/^(\d+)[spdf](\d+)$/);
        if (match) {
            const n = parseInt(match[1]);
            if (n > maxN) maxN = n;
        }
    });

    if (maxN === 0) {
        const fullParts = config.split(' ');
        fullParts.forEach(part => {
             const match = part.match(/^(\d+)[spdf](\d+)$/);
             if (match) {
                 const n = parseInt(match[1]);
                 if (n > maxN) maxN = n;
             }
        });
    }

    let totalValence = 0;
    const configToScan = config.includes('[') ? config.split(']')[1] : config;
    const subshells = configToScan.trim().split(' ');
    
    subshells.forEach(sub => {
        const match = sub.match(/^(\d+)[spdf](\d+)$/);
        if (match) {
            const n = parseInt(match[1]);
            const e = parseInt(match[2]);
            if (n === maxN) {
                totalValence += e;
            }
        }
    });
    
    if (totalValence === 0 && currentElement) {
        const g = currentElement.group;
        if (g <= 2) return g;
        if (g >= 13 && g <= 18) return g - 10;
        return 2; 
    }

    return totalValence;
  };

  // Hàm chuẩn hóa input trước khi so sánh
  const normalizeConfigInput = (input: string): string => {
      // 1. Chuyển đổi tất cả ký tự superscript về số thường
      let normalized = input.split('').map(char => REVERSE_SUPERSCRIPTS[char] || char).join('');
      // 2. Xóa khoảng trắng và chuyển về chữ thường
      return normalized.replace(/\s+/g, '').toLowerCase();
  };

  const handleSubmit = () => {
    if (!currentElement) return;

    const massNum = Math.round(currentElement.atomicMass);
    const neutronNum = massNum - currentElement.atomicNumber;
    const valenceNum = calculateValenceElectrons(currentElement.electronConfiguration);

    // Chuẩn hóa đáp án đúng từ dữ liệu
    const correctConfigNormalized = currentElement.electronConfiguration.replace(/\s+/g, '').toLowerCase();
    // Chuẩn hóa câu trả lời của người dùng (xử lý cả superscript và số thường)
    const userConfigNormalized = normalizeConfigInput(answers.electronConfiguration);

    const checks: ValidationState = {
      atomicNumber: parseInt(answers.atomicNumber) === currentElement.atomicNumber,
      protons: parseInt(answers.protons) === currentElement.atomicNumber,
      electrons: parseInt(answers.electrons) === currentElement.atomicNumber,
      massNumber: parseInt(answers.massNumber) === massNum,
      neutrons: parseInt(answers.neutrons) === neutronNum,
      valenceElectrons: parseInt(answers.valenceElectrons) === valenceNum,
      electronConfiguration: userConfigNormalized === correctConfigNormalized
    };

    setValidation(checks);
    setShowResult(true);

    const correctCount = Object.values(checks).filter(v => v).length;
    if (correctCount === 7) {
        setScore(s => s + 10);
    }
  };

  const handleInputChange = (field: keyof QuizState, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  // Hàm chèn ký tự vào ô cấu hình electron
  const insertConfigChar = (char: string) => {
      setAnswers(prev => ({ ...prev, electronConfiguration: prev.electronConfiguration + char }));
      configInputRef.current?.focus();
  };

  const deleteLastConfigChar = () => {
      setAnswers(prev => ({ ...prev, electronConfiguration: prev.electronConfiguration.slice(0, -1) }));
      configInputRef.current?.focus();
  };

  const getInputClass = (field: keyof QuizState) => {
    const baseClass = `w-full bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono transition-all text-center font-bold tracking-wide placeholder-gray-500 ${
        viewMode === 'compact' ? 'px-2 py-1 text-sm' : 'px-3 py-3 text-lg md:text-xl'
    }`;
    
    if (!showResult) return `${baseClass} border-gray-600`;
    return validation[field] 
      ? `${baseClass} border-green-500 bg-green-900/20 text-green-300` 
      : `${baseClass} border-red-500 bg-red-900/20 text-red-300`;
  };

  if (!currentElement) return null;

  // Change: Converted Components to Render Functions to avoid re-mounting on state change (which causes focus loss)
  const renderQuizViewControls = () => (
      <div className="flex justify-center gap-2 mb-4 bg-gray-900/50 p-2 rounded-lg">
          <button 
            onClick={() => setViewMode('default')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${viewMode === 'default' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
          >
              Mặc định
          </button>
          <button 
            onClick={() => setViewMode('compact')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${viewMode === 'compact' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
          >
              Thu nhỏ
          </button>
          <button 
            onClick={() => setViewMode('rotate')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${viewMode === 'rotate' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
          >
              Xoay ngang
          </button>
      </div>
  );

  const renderVirtualKeyboard = () => (
      <div className="mt-2 grid gap-2">
          {/* Hàng 1: Khí hiếm & Orbitals */}
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar justify-center md:justify-start">
              {['[He]', '[Ne]', '[Ar]', '[Kr]', 's', 'p', 'd', 'f'].map(char => (
                  <button
                    key={char}
                    onClick={() => insertConfigChar(char)}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-bold min-w-[40px] shadow active:translate-y-0.5 transition-transform"
                  >
                      {char}
                  </button>
              ))}
          </div>
          {/* Hàng 2: Số mũ */}
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar justify-center md:justify-start items-center">
              <span className="text-xs text-gray-400 mr-1 whitespace-nowrap">Mũ:</span>
              {['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹⁴'].map(char => (
                  <button
                    key={char}
                    onClick={() => insertConfigChar(char)}
                    className="px-3 py-2 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 rounded text-sm font-bold min-w-[36px] shadow active:translate-y-0.5 transition-transform text-cyan-200"
                  >
                      {char}
                  </button>
              ))}
               <button
                    onClick={deleteLastConfigChar}
                    className="px-3 py-2 bg-red-900/50 hover:bg-red-800 border border-red-700 rounded text-sm font-bold min-w-[40px] shadow active:translate-y-0.5 transition-transform text-red-200 ml-auto"
                  >
                      ⌫
                  </button>
          </div>
      </div>
  );

  const renderQuizContent = () => (
      <div className={`flex flex-col h-full ${viewMode === 'rotate' ? 'w-[80vw] mx-auto' : ''}`}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <div>
            <h2 className={`${viewMode === 'compact' ? 'text-lg' : 'text-2xl'} font-bold text-cyan-400`}>Luyện tập</h2>
            {viewMode !== 'compact' && <p className="text-gray-400 text-xs">Điền thông tin nguyên tố</p>}
          </div>
          <div className="text-right flex items-center gap-4">
             <div>
                <span className="block text-xs text-gray-500">Điểm</span>
                <span className={`${viewMode === 'compact' ? 'text-lg' : 'text-xl'} font-bold text-green-400`}>{score}</span>
             </div>
             {/* Only show close button here if not rotated (rotated view has its own close) */}
             {viewMode !== 'rotate' && (
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
             )}
          </div>
        </div>

        {viewMode !== 'rotate' && renderQuizViewControls()}

        <div className={`mb-4 text-center ${viewMode === 'compact' ? 'p-2' : 'p-4'} bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center gap-4`}>
          <span className={`${viewMode === 'compact' ? 'text-4xl' : 'text-6xl'} font-bold text-white`}>{currentElement.symbol}</span>
          <div className="text-left">
              <span className={`block ${viewMode === 'compact' ? 'text-lg' : 'text-xl'} text-cyan-300 font-bold`}>{currentElement.name}</span>
              <span className="text-xs text-gray-500 uppercase">{currentElement.category}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {/* Numeric Inputs Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-3 ${viewMode === 'compact' ? 'gap-2' : 'gap-4'} mb-4`}>
                <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">Số hiệu (Z)</label>
                    <input type="number" inputMode="numeric" value={answers.atomicNumber} onChange={(e) => handleInputChange('atomicNumber', e.target.value)} className={getInputClass('atomicNumber')} disabled={showResult} placeholder="?"/>
                    {showResult && !validation.atomicNumber && <p className="text-xs text-red-400 text-center mt-1">Đúng: {currentElement.atomicNumber}</p>}
                </div>
                 <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">Số khối (A)</label>
                    <input type="number" inputMode="numeric" value={answers.massNumber} onChange={(e) => handleInputChange('massNumber', e.target.value)} className={getInputClass('massNumber')} disabled={showResult} placeholder="?"/>
                    {showResult && !validation.massNumber && <p className="text-xs text-red-400 text-center mt-1">Đúng: {Math.round(currentElement.atomicMass)}</p>}
                </div>
                 <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">Số Neutron</label>
                    <input type="number" inputMode="numeric" value={answers.neutrons} onChange={(e) => handleInputChange('neutrons', e.target.value)} className={getInputClass('neutrons')} disabled={showResult} placeholder="?"/>
                    {showResult && !validation.neutrons && <p className="text-xs text-red-400 text-center mt-1">Đúng: {Math.round(currentElement.atomicMass) - currentElement.atomicNumber}</p>}
                </div>
                <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">Proton (p)</label>
                    <input type="number" inputMode="numeric" value={answers.protons} onChange={(e) => handleInputChange('protons', e.target.value)} className={getInputClass('protons')} disabled={showResult} placeholder="?"/>
                     {showResult && !validation.protons && <p className="text-xs text-red-400 text-center mt-1">Đúng: {currentElement.atomicNumber}</p>}
                </div>
                <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">Electron (e)</label>
                    <input type="number" inputMode="numeric" value={answers.electrons} onChange={(e) => handleInputChange('electrons', e.target.value)} className={getInputClass('electrons')} disabled={showResult} placeholder="?"/>
                     {showResult && !validation.electrons && <p className="text-xs text-red-400 text-center mt-1">Đúng: {currentElement.atomicNumber}</p>}
                </div>
                <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">E lớp ngoài</label>
                    <input type="number" inputMode="numeric" value={answers.valenceElectrons} onChange={(e) => handleInputChange('valenceElectrons', e.target.value)} className={getInputClass('valenceElectrons')} disabled={showResult} placeholder="?"/>
                    {showResult && !validation.valenceElectrons && <p className="text-xs text-red-400 text-center mt-1">Đúng: {calculateValenceElectrons(currentElement.electronConfiguration)}</p>}
                </div>
            </div>
            
            <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">Cấu hình Electron</label>
                <div className="relative">
                     <input 
                        ref={configInputRef}
                        type="text" 
                        value={answers.electronConfiguration} 
                        onChange={(e) => handleInputChange('electronConfiguration', e.target.value)} 
                        className={`${getInputClass('electronConfiguration')} text-left pl-4`} // Override text-center
                        disabled={showResult} 
                        placeholder="VD: 1s² 2s² hoặc [He] 2s¹"
                    />
                    {/* Nút xóa nhanh */}
                    {answers.electronConfiguration && !showResult && (
                        <button 
                            onClick={() => setAnswers(prev => ({...prev, electronConfiguration: ''}))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            &times;
                        </button>
                    )}
                </div>
                
                {/* Bàn phím ảo */}
                {!showResult && renderVirtualKeyboard()}

                {showResult && !validation.electronConfiguration && (
                    <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                        <p className="text-xs text-red-400">Đáp án đúng:</p>
                        <p className="font-mono font-bold text-white tracking-wide">
                            {currentElement.electronConfiguration.split(/([spdf]\d+)/g).map((part, idx) => {
                                const match = part.match(/^([spdf])(\d+)$/);
                                return match ? <span key={idx}>{match[1]}<sup>{match[2]}</sup></span> : part;
                            })}
                        </p>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-auto pt-2 border-t border-gray-700">
          {/* In rotated mode, the 'Close' button in view controls handles exit */}
          {viewMode !== 'rotate' && (
              <button onClick={onClose} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm">Đóng</button>
          )}
          
          {!showResult ? (
            <button onClick={handleSubmit} className="flex-1 md:flex-none px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition shadow-lg shadow-cyan-500/30 text-base">Kiểm tra</button>
          ) : (
            <button onClick={generateQuestion} className="flex-1 md:flex-none px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition shadow-lg shadow-purple-500/30 flex items-center justify-center text-base">
                Câu tiếp theo
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </button>
          )}
        </div>
      </div>
  );

  // Render logic for different modes
  if (viewMode === 'rotate') {
      return (
         <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center overflow-hidden">
             {/* Exit Rotate Mode Button */}
             <button 
                onClick={() => setViewMode('default')}
                className="absolute top-4 right-4 z-[60] bg-gray-800 text-white p-3 rounded-full shadow-lg border border-gray-600 hover:bg-gray-700"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

             <div 
                className="origin-center transform rotate-90 overflow-hidden bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700"
                style={{ width: '90vh', height: '90vw' }}
             >
                 {renderQuizContent()}
             </div>
             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-pulse pointer-events-none rotate-90">
                Chế độ xoay ngang
            </div>
         </div>
      );
  }

  // Default / Compact Modal Render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl p-6 border border-gray-700 transition-all duration-300 ${viewMode === 'compact' ? 'max-h-[95vh]' : 'max-h-[90vh]'} flex flex-col`} 
        onClick={e => e.stopPropagation()}
      >
          {renderQuizContent()}
      </div>
    </div>
  );
};

export default QuizModal;
