
import React, { useState, useEffect } from 'react';
import { ElementData } from '../types';

interface ElementDetailsProps {
  element: ElementData;
  onClose: () => void;
  onSave: (element: ElementData) => void;
}

const DetailItem: React.FC<{ label: string; value: string | number | null; unit?: string }> = ({ label, value, unit }) => {
    const displayValue = value === null || value === undefined || value === '' ? 'N/A' : value;
    return (
        <div className="py-1 flex justify-between items-baseline gap-2">
            <span className="font-medium text-gray-400 whitespace-nowrap">{label}:</span>
            <span className="text-gray-100 text-right font-mono">{displayValue}{unit && ` ${unit}`}</span>
        </div>
    );
};

const EditableItem: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; isTextArea?: boolean; placeholder?: string }> = ({ label, name, value, onChange, type = 'text', isTextArea = false, placeholder }) => {
    const commonProps = {
        name: name,
        id: name,
        value: value === null || value === undefined ? '' : value,
        onChange: onChange,
        className: "w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500",
        autoComplete: "off",
        placeholder: placeholder
    };
    return (
        <div className="py-1 grid grid-cols-3 items-center gap-2">
            <label htmlFor={name} className="font-medium text-gray-400 whitespace-nowrap col-span-1">{label}:</label>
            {isTextArea ? (
                <textarea {...commonProps} rows={5} className={`${commonProps.className} col-span-2`} />
            ) : (
                <input type={type} {...commonProps} className={`${commonProps.className} col-span-2`} />
            )}
        </div>
    );
};


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2 border-b border-gray-600 pb-1">{title}</h3>
        <div className="flex flex-col gap-y-1">
            {children}
        </div>
    </div>
);

const ExternalLinkButton: React.FC<{ href: string; label: string; icon?: React.ReactNode; colorClass?: string }> = ({ href, label, icon, colorClass = "bg-gray-700 hover:bg-gray-600" }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${colorClass} text-white`}
    >
        {icon}
        {label}
    </a>
);


const ElementDetails: React.FC<ElementDetailsProps> = ({ element, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');
    const [editableElement, setEditableElement] = useState<ElementData>(element);

    useEffect(() => {
        setEditableElement(element);
        if (isEditing) {
            setIsEditing(false);
        }
    }, [element]);

    const speakElementName = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(element.name);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Trình duyệt của bạn không hỗ trợ chức năng đọc văn bản.');
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        const key = name as keyof ElementData;
        let finalValue: any = value;
        
        if (type === 'number') {
            finalValue = value === '' ? null : parseFloat(value);
            if (isNaN(finalValue)) {
                finalValue = null; 
            }
        }

        // Tự động trích xuất ID Youtube nếu người dùng dán link đầy đủ
        if (key === 'videoUrl' && typeof finalValue === 'string') {
             const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
             const match = finalValue.match(regExp);
             if (match && match[2].length === 11) {
                 finalValue = match[2];
             }
        }
        
        setEditableElement(prev => ({ ...prev, [key]: finalValue }));
    };

    const handleSave = () => {
        onSave(editableElement);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableElement(element);
        setIsEditing(false);
    };

    const getGroupDisplay = (group: number): string => {
        if (group < 1) return 'N/A';
        const groupMap: { [key: number]: string } = {
            1: 'IA', 2: 'IIA', 3: 'IIIB', 4: 'IVB', 5: 'VB', 6: 'VIB', 7: 'VIIB',
            8: 'VIIIB', 9: 'VIIIB', 10: 'VIIIB', 11: 'IB', 12: 'IIB',
            13: 'IIIA', 14: 'IVA', 15: 'VA', 16: 'VIA', 17: 'VIIA', 18: 'VIIIA'
        };
        return groupMap[group] || group.toString();
    };

    const getElementBlock = (el: ElementData): string => {
        const { category, group } = el;
        if (category.includes('lanthanide') || category.includes('actinide')) return 'f';
        if (group >= 1 && group <= 2) return 's';
        if (group >= 13 && group <= 18) return 'p';
        if (group >= 3 && group <= 12) return 'd';
        return 'N/A';
    };

    const getOuterElectronConfiguration = (config: string): string => {
        if (!config) return 'N/A';
        const strippedConfig = config.replace(/\[.*?\]\s*/, '');
        if (!strippedConfig) return config;

        const parts = strippedConfig.split(' ');
        let highestN = 0;
        parts.forEach(part => {
            const n = parseInt(part.charAt(0), 10);
            if (!isNaN(n) && n > highestN) {
                highestN = n;
            }
        });
        
        if (highestN === 0) return strippedConfig;

        const outerShellParts = parts.filter(part => {
            const n = parseInt(part.charAt(0), 10);
            return n === highestN;
        });

        return outerShellParts.join(' ');
    };

    const getDensity = (el: ElementData): string | null => {
        if (el.density === null) return null;
        if (el.phase === 'Gas') {
            return `${el.density} g/L`;
        }
        return `${el.density} g/cm³`;
    }

    const getPhaseVietnamese = (phase: string): string => {
        switch (phase.toLowerCase()) {
            case 'solid': return 'Rắn';
            case 'liquid': return 'Lỏng';
            case 'gas': return 'Khí';
            default: return phase;
        }
    }

    // Links generation
    const googleImageSearchUrl = `https://www.google.com/search?tbm=isch&q=${element.name}+element+chemistry`;
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=chemistry+element+${element.name}`;
    const wikiUrl = `https://vi.wikipedia.org/wiki/${element.name}`;
    const paddedAtomicNumber = element.atomicNumber.toString().padStart(3, '0');
    const periodicTableImageLink = `https://periodictable.com/Elements/${paddedAtomicNumber}/index.html`;
    const molviewLink = `https://artsexperiments.withgoogle.com/periodic-table/?q=${element.name}`;
    // Removed Sketchfab link as requested

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border-t-8 border-cyan-500 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <style>
                {`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
                `}
                </style>

                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                            {element.atomicNumber}. {element.name} 
                            <span className="text-cyan-400">({element.symbol})</span>
                        </h1>
                        <p className="text-lg text-gray-400 capitalize">{element.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className={`transition p-2 rounded-full ${isEditing ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-700'}`}
                            aria-label="Chỉnh sửa"
                            title="Chỉnh sửa thông tin"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition"
                            aria-label="Đóng"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {!isEditing && (
                    <div className="flex border-b border-gray-700 px-6">
                        <button
                            className={`py-3 px-4 font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                            onClick={() => setActiveTab('info')}
                        >
                            Thông tin cơ bản
                        </button>
                        <button
                            className={`py-3 px-4 font-medium border-b-2 transition-colors ${activeTab === 'media' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                            onClick={() => setActiveTab('media')}
                        >
                            Đa phương tiện & Ứng dụng
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 pt-4 overflow-y-auto custom-scrollbar">
                    {!isEditing ? (
                        activeTab === 'info' ? (
                            // INFO TAB
                            <>
                                <div className="mb-6 flex items-start gap-4">
                                    <div className="flex-1">
                                        <p className="text-gray-300 border-l-4 border-cyan-500 pl-4 italic text-lg leading-relaxed">
                                            {element.summary}
                                        </p>
                                    </div>
                                    <button
                                        onClick={speakElementName}
                                        className="shrink-0 bg-gray-700 hover:bg-cyan-600 text-white p-3 rounded-full transition shadow-lg"
                                        title="Đọc tên nguyên tố"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                    <div>
                                        <Section title="Thông tin chính">
                                            <DetailItem label="Tên nguyên tố" value={element.name} />
                                            <DetailItem label="Ký hiệu" value={element.symbol} />
                                            <DetailItem label="Số hiệu nguyên tử" value={element.atomicNumber} />
                                            <DetailItem label="Nguyên tử khối" value={element.atomicMass} unit="u" />
                                            <DetailItem label="Người phát hiện" value={element.discovered_by} />
                                        </Section>
                                        <Section title="Tính chất vật lý">
                                            <DetailItem label="Trạng thái (STP)" value={getPhaseVietnamese(element.phase)} />
                                            <DetailItem label="Nhiệt độ nóng chảy" value={element.melt} unit="K"/>
                                            <DetailItem label="Nhiệt độ sôi" value={element.boil} unit="K" />
                                            <DetailItem label="Mật độ" value={getDensity(element)} />
                                        </Section>
                                    </div>
                                    <div>
                                        <Section title="Vị trí & Hóa tính">
                                            <DetailItem label="Chu kì" value={element.period} />
                                            <DetailItem label="Nhóm" value={getGroupDisplay(element.group)} />
                                            <DetailItem label="Phân lớp" value={getElementBlock(element)} />
                                            <DetailItem label="Số oxi hóa" value={element.oxidationStates} />
                                            <DetailItem label="Bán kính nguyên tử" value={element.atomicRadius} unit="pm" />
                                            <DetailItem label="Độ âm điện" value={element.electronegativityPauling} />
                                        </Section>
                                        <Section title="Cấu hình electron">
                                            <DetailItem label="Cấu hình e (đầy đủ)" value={element.electronConfiguration} />
                                            <DetailItem label="Lớp ngoài cùng" value={getOuterElectronConfiguration(element.electronConfiguration)} />
                                        </Section>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // MEDIA TAB
                            <div className="space-y-8 animate-fade-in">
                                {/* State and Application Section */}
                                <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-lg relative">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                        <h3 className="text-xl font-bold text-cyan-400 flex items-center">
                                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                            Trạng thái & Ứng dụng thực tế
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-600">
                                                Nguồn: Dữ liệu chuẩn hóa CT GDPT 2018
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="p-2 bg-blue-900/50 rounded-lg">
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                                                </span>
                                                <h4 className="font-bold text-lg text-white">Trạng thái tự nhiên</h4>
                                            </div>
                                            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600 h-full relative min-h-[100px]">
                                                <p className="text-gray-300">
                                                    <span className="font-semibold text-cyan-300">Trạng thái (STP): </span>
                                                    {getPhaseVietnamese(element.phase)}
                                                </p>
                                                <p className="text-gray-300 mt-2 text-sm leading-relaxed whitespace-pre-line animate-fade-in">
                                                    {element.naturalOccurrence || "Đang cập nhật..."}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                             <div className="flex items-center gap-3 mb-2">
                                                <span className="p-2 bg-green-900/50 rounded-lg">
                                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                                </span>
                                                <h4 className="font-bold text-lg text-white">Ứng dụng</h4>
                                            </div>
                                            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600 min-h-[100px] h-full relative">
                                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line animate-fade-in">
                                                    {element.applications || "Đang cập nhật..."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Video
                                    </h3>
                                    {element.videoUrl ? (
                                        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg bg-black mb-3">
                                            <iframe 
                                                src={`https://www.youtube.com/embed/${element.videoUrl}`} 
                                                title={`Video về ${element.name}`}
                                                className="w-full h-[300px] md:h-[400px]"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-700 text-center mb-3">
                                            <p className="text-gray-400 mb-4">Chưa có video được ghim cho nguyên tố này.</p>
                                            <ExternalLinkButton 
                                                href={youtubeSearchUrl}
                                                label="Tìm video trên YouTube"
                                                colorClass="bg-red-600 hover:bg-red-500"
                                                icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Images & 3D Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            Hình ảnh minh họa
                                        </h3>
                                        {element.imageUrl ? (
                                            <div className="rounded-lg overflow-hidden shadow-lg mb-4">
                                                <img src={element.imageUrl} alt={element.name} className="w-full h-auto object-cover" />
                                            </div>
                                        ) : (
                                            <div className="grid gap-3">
                                                 <ExternalLinkButton 
                                                    href={wikiUrl}
                                                    label="Xem trên Wikipedia"
                                                    colorClass="bg-gray-600 hover:bg-gray-500"
                                                    icon={<span className="font-serif font-bold text-lg">W</span>}
                                                />
                                                <ExternalLinkButton 
                                                    href={periodicTableImageLink}
                                                    label="Ảnh mẫu đẹp (PeriodicTable.com)"
                                                    colorClass="bg-yellow-700 hover:bg-yellow-600"
                                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                                                />
                                                <ExternalLinkButton 
                                                    href={googleImageSearchUrl}
                                                    label="Tìm ảnh trên Google"
                                                    colorClass="bg-blue-600 hover:bg-blue-500"
                                                    icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.917 16.083c-2.258 0-4.083-1.825-4.083-4.083s1.825-4.083 4.083-4.083c1.103 0 2.024.402 2.735 1.067l-1.107 1.068c-.304-.292-.834-.632-1.628-.632-1.394 0-2.528 1.157-2.528 2.58 0 1.423 1.134 2.579 2.528 2.579 1.616 0 2.224-1.162 2.316-1.762h-2.316v-1.4h3.855c.036.204.064.408.064.677.001 2.688-1.797 4.083-3.919 4.083zm6.917-6.083h-1.5v1.5h-1.5v-1.5h-1.5v-1.5h1.5v-1.5h1.5v1.5h1.5v1.5z"/></svg>}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                                            Cấu trúc 3D & VR
                                        </h3>
                                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700 flex flex-col items-center text-center">
                                            <div className="w-24 h-24 bg-cyan-900/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                                            </div>
                                            <p className="text-gray-300 mb-4 text-sm">
                                                Khám phá cấu trúc tinh thể và mô hình nguyên tử trực quan.
                                            </p>
                                            <div className="flex flex-col gap-3 w-full">
                                                <ExternalLinkButton 
                                                    href={molviewLink}
                                                    label="Cấu trúc 3D (MolView)"
                                                    colorClass="bg-emerald-600 hover:bg-emerald-500 w-full"
                                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>}
                                                />
                                                <ExternalLinkButton 
                                                    href="https://hoahocabc.github.io/mo_phong_tao-ion/"
                                                    label="MÔ PHỎNG HÌNH THÀNH ION"
                                                    colorClass="bg-indigo-600 hover:bg-indigo-500 w-full"
                                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        // EDIT MODE
                        <div className="mt-4">
                            <Section title="Chỉnh sửa thông tin cơ bản">
                                <EditableItem label="Tên" name="name" value={editableElement.name} onChange={handleInputChange} />
                                <EditableItem label="Loại" name="category" value={editableElement.category} onChange={handleInputChange} />
                                <EditableItem label="Nguyên tử khối (u)" name="atomicMass" value={editableElement.atomicMass} onChange={handleInputChange} type="number" />
                                <EditableItem label="Người phát hiện" name="discovered_by" value={editableElement.discovered_by} onChange={handleInputChange} />
                                <EditableItem label="Trạng thái" name="phase" value={editableElement.phase} onChange={handleInputChange} />
                                <EditableItem label="Nóng chảy (K)" name="melt" value={editableElement.melt} onChange={handleInputChange} type="number" />
                                <EditableItem label="Sôi (K)" name="boil" value={editableElement.boil} onChange={handleInputChange} type="number" />
                                <EditableItem label="Mật độ" name="density" value={editableElement.density} onChange={handleInputChange} type="number" />
                                <EditableItem label="Số oxi hóa" name="oxidationStates" value={editableElement.oxidationStates} onChange={handleInputChange} />
                                <EditableItem label="Bán kính (pm)" name="atomicRadius" value={editableElement.atomicRadius} onChange={handleInputChange} type="number" />
                                <EditableItem label="Độ âm điện" name="electronegativityPauling" value={editableElement.electronegativityPauling} onChange={handleInputChange} type="number" />
                                <EditableItem label="Chu kì" name="period" value={editableElement.period} onChange={handleInputChange} type="number" />
                                <EditableItem label="Nhóm" name="group" value={editableElement.group} onChange={handleInputChange} type="number" />
                                <EditableItem label="Cấu hình e" name="electronConfiguration" value={editableElement.electronConfiguration} onChange={handleInputChange} />
                                <EditableItem label="Tóm tắt" name="summary" value={editableElement.summary} onChange={handleInputChange} isTextArea={true} />
                            </Section>
                            
                            <Section title="Đa phương tiện">
                                <EditableItem 
                                    label="Link Ảnh" 
                                    name="imageUrl" 
                                    value={editableElement.imageUrl} 
                                    onChange={handleInputChange} 
                                    placeholder="https://example.com/image.jpg"
                                />
                                <EditableItem 
                                    label="Youtube ID" 
                                    name="videoUrl" 
                                    value={editableElement.videoUrl} 
                                    onChange={handleInputChange} 
                                    placeholder="Ví dụ: dQw4w9WgXcQ (hoặc dán full link)"
                                />
                                <p className="text-xs text-gray-400 mt-1 ml-[33%]">
                                    Mẹo: Bạn có thể dán toàn bộ link Youtube, hệ thống sẽ tự lấy ID.
                                </p>
                                <div className="mt-4 p-3 bg-gray-700/50 rounded border border-gray-600">
                                    <p className="text-xs text-gray-400 italic">
                                        * Lưu ý: Thông tin về "Trạng thái tự nhiên" và "Ứng dụng" được cập nhật theo chuẩn giáo dục 2018.
                                    </p>
                                </div>
                            </Section>

                            <div className="mt-6 flex justify-end gap-4 sticky bottom-0 bg-gray-800 py-4 border-t border-gray-700">
                                <button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Hủy</button>
                                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg shadow-cyan-500/30">Lưu thay đổi</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ElementDetails;
