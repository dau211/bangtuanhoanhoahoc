
// FIX: Add TypeScript definitions for the Web Speech API (SpeechRecognition) to resolve compilation errors.
// The browser's SpeechRecognition API is not part of the standard TypeScript DOM library, so these definitions are needed for the code to compile correctly.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};
declare var webkitSpeechRecognition: {
  new (): SpeechRecognition;
};


import React, { useState, useRef } from 'react';
import { ElementData } from './types';
import PeriodicTable from './components/PeriodicTable';
import ElementDetails from './components/ElementDetails';
import QuizModal from './components/QuizModal';
import { elements as defaultElements } from './data/elements';

interface CustomWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
declare const window: CustomWindow;

const App: React.FC = () => {
  const [elements, setElements] = useState<ElementData[]>(() => {
    // Tải dữ liệu tùy chỉnh từ localStorage khi khởi tạo
    try {
      const customDataJSON = localStorage.getItem('customElementData');
      if (customDataJSON) {
        const customData = JSON.parse(customDataJSON) as { [key: number]: Partial<ElementData> };
        // Hợp nhất dữ liệu mặc định với dữ liệu tùy chỉnh
        return defaultElements.map(el => ({
          ...el,
          ...(customData[el.atomicNumber] || {})
        }));
      }
    } catch (error) {
      console.error("Không thể tải dữ liệu tùy chỉnh từ localStorage", error);
    }
    return defaultElements;
  });
  
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleElementClick = (element: ElementData) => {
    setSelectedElement(element);
  };

  const handleCloseDetails = () => {
    setSelectedElement(null);
  };

  const handleSaveElement = (updatedElement: ElementData) => {
    // Cập nhật trạng thái danh sách nguyên tố
    const newElements = elements.map(el => 
      el.atomicNumber === updatedElement.atomicNumber ? updatedElement : el
    );
    setElements(newElements);

    // Cập nhật ngay lập tức nguyên tố đang được chọn
    setSelectedElement(updatedElement);

    // Lưu thay đổi vào localStorage
    try {
      const customDataJSON = localStorage.getItem('customElementData');
      const customData = customDataJSON ? JSON.parse(customDataJSON) as { [key: number]: Partial<ElementData> } : {};
      
      customData[updatedElement.atomicNumber] = updatedElement;

      localStorage.setItem('customElementData', JSON.stringify(customData));
    } catch (error) {
      console.error("Không thể lưu dữ liệu tùy chỉnh vào localStorage", error);
    }
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('Trình duyệt không hỗ trợ nhận dạng giọng nói.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('Đang nghe... Vui lòng nói tên một nguyên tố bằng tiếng Anh.');
    };

    recognition.onresult = (event) => {
      const spokenName = event.results[0][0].transcript.trim();
      const formattedName = spokenName.charAt(0).toUpperCase() + spokenName.slice(1).toLowerCase();
      
      const foundElement = elements.find(el => el.name.toLowerCase() === formattedName.toLowerCase());

      if (foundElement) {
        handleElementClick(foundElement);
        setVoiceStatus(`Đã tìm thấy: ${formattedName}`);
      } else {
        setVoiceStatus(`Không tìm thấy nguyên tố "${spokenName}". Vui lòng thử lại.`);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setVoiceStatus('Không nhận diện được giọng nói. Vui lòng thử lại.');
      } else {
        setVoiceStatus(`Đã xảy ra lỗi: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    recognition.start();
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 font-sans">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider">
          Bảng Tuần Hoàn Các Nguyên Tố Hóa Học
        </h1>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
            <p className="text-gray-400">Tra cứu hoặc luyện tập kiến thức.</p>
            <div className="flex gap-2">
                <button
                  onClick={handleVoiceSearch}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 ${
                    isListening 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                  aria-label={isListening ? "Dừng nghe" : "Bắt đầu tìm kiếm bằng giọng nói"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                  </svg>
                  {isListening ? 'Đang nghe...' : 'Tìm bằng giọng nói'}
                </button>
                
                <button
                  onClick={() => setIsQuizOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-400"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                   Luyện tập
                </button>
            </div>
        </div>
        {voiceStatus && <p className="text-cyan-300 mt-2 h-5 transition-opacity duration-300">{voiceStatus}</p>}

      </header>
      <main>
        <PeriodicTable elements={elements} onElementClick={handleElementClick} />
      </main>
      
      {selectedElement && (
        <ElementDetails 
          element={selectedElement} 
          onClose={handleCloseDetails}
          onSave={handleSaveElement} 
        />
      )}

      {isQuizOpen && (
        <QuizModal 
          elements={elements} 
          onClose={() => setIsQuizOpen(false)} 
        />
      )}

      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Hóa học phổ thông</p>
      </footer>
    </div>
  );
};

export default App;
