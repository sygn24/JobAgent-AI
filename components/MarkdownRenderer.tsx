import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { PhotoIcon, BriefcaseIcon, AcademicCapIcon, UserIcon, LightningIcon, RefreshIcon } from './Icons';

interface MarkdownRendererProps {
  content: string;
  photoUrl?: string | null;
  themeColor?: string;
  onPhotoClick?: () => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  photoUrl, 
  themeColor = 'from-indigo-500 via-purple-500 to-pink-500',
  onPhotoClick
}) => {
  
  // State for Photo Dimensions (px) - Default approx 40mm x 50mm
  const [dims, setDims] = useState({ w: 151, h: 189 });
  // State for Photo Position (margins in px)
  const [margins, setMargins] = useState({ top: 0, right: 0 });

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startDims = useRef({ w: 0, h: 0 });
  const startMargins = useRef({ top: 0, right: 0 });
  const hasMoved = useRef(false);

  // Split content into Header (Name/Contact) and Body (Sections)
  const { headerContent, bodyContent } = useMemo(() => {
    const splitRegex = /(\n##\s|\n---\n)/;
    const splitIndex = content.search(splitRegex);
    
    if (splitIndex !== -1) {
      return {
        headerContent: content.slice(0, splitIndex),
        bodyContent: content.slice(splitIndex)
      };
    }
    return { headerContent: content, bodyContent: '' };
  }, [content]);

  // Helper to extract text from React children to determine icon
  const getSectionIcon = (children: React.ReactNode) => {
    let text = "";
    React.Children.forEach(children, child => {
        if (typeof child === 'string') text += child;
    });
    text = text.toLowerCase();
    
    const iconClass = `w-6 h-6 mr-2 opacity-80`;

    if (text.includes('工作') || text.includes('经历') || text.includes('experience') || text.includes('work')) {
        return <BriefcaseIcon className={iconClass} />;
    }
    if (text.includes('教育') || text.includes('学历') || text.includes('education') || text.includes('university')) {
        return <AcademicCapIcon className={iconClass} />;
    }
    if (text.includes('技能') || text.includes('专长') || text.includes('skill') || text.includes('ability')) {
        return <LightningIcon className={iconClass} />;
    }
    if (text.includes('简介') || text.includes('关于') || text.includes('about') || text.includes('profile')) {
        return <UserIcon className={iconClass} />;
    }
    return null;
  };

  // Theme Helpers
  const getThemeColors = () => {
    if (themeColor.includes('blue')) return { 
        text: 'text-blue-900', 
        border: 'border-blue-200', 
        borderDark: 'border-blue-300',
        bg: 'bg-blue-50',
        marker: 'marker:text-blue-500',
        link: 'text-blue-600 decoration-blue-300',
        gradientStart: 'text-blue-600',
        dot: '#93c5fd'
    };
    if (themeColor.includes('emerald')) return { 
        text: 'text-emerald-900', 
        border: 'border-emerald-200',
        borderDark: 'border-emerald-300', 
        bg: 'bg-emerald-50',
        marker: 'marker:text-emerald-500',
        link: 'text-emerald-600 decoration-emerald-300',
        gradientStart: 'text-emerald-600',
        dot: '#6ee7b7'
    };
    return { 
        text: 'text-indigo-900', 
        border: 'border-indigo-200', 
        borderDark: 'border-indigo-300',
        bg: 'bg-indigo-50',
        marker: 'marker:text-indigo-500',
        link: 'text-indigo-600 decoration-indigo-300',
        gradientStart: 'text-indigo-600',
        dot: '#a5b4fc'
    };
  };

  const theme = getThemeColors();

  // Mouse Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
        setMargins({ top: startMargins.current.top + dy, right: startMargins.current.right - dx });
      } else if (isResizing) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setDims({ w: Math.max(50, startDims.current.w + dx), h: Math.max(50, startDims.current.h + dy) });
      }
    };
    const handleMouseUp = () => {
      if (isDragging && !hasMoved.current && onPhotoClick) onPhotoClick();
      setIsDragging(false); setIsResizing(false); document.body.style.cursor = 'default';
    };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, onPhotoClick]);

  const handleMouseDownContainer = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    if ((e.target as HTMLElement).closest('.reset-btn')) return;
    setIsDragging(true); hasMoved.current = false; dragStartPos.current = { x: e.clientX, y: e.clientY }; startMargins.current = { ...margins }; document.body.style.cursor = 'move';
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setIsResizing(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; startDims.current = { ...dims }; document.body.style.cursor = 'nwse-resize';
  };

  const resetPhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDims({ w: 151, h: 189 });
      setMargins({ top: 0, right: 0 });
  };

  // Shared components config
  const markdownComponents = {
    h1: ({node, ...props}: any) => (
        <div className="mb-4 relative inline-block">
            <h1 className={`text-4xl font-extrabold ${theme.text} leading-tight tracking-tight relative z-10 break-words`} {...props} />
            <div className={`h-1.5 w-full bg-gradient-to-r ${themeColor} opacity-30 mt-1 rounded-full`}></div>
        </div>
    ),
    h2: ({node, children, ...props}: any) => (
        <div className={`flex items-center mt-8 mb-4 border-b-2 ${theme.border} pb-1`}>
            <span className={`${theme.gradientStart}`}>{getSectionIcon(children)}</span>
            <h2 className={`text-lg font-bold uppercase tracking-wider ${theme.text} break-words`} {...props}>
                {children}
            </h2>
        </div>
    ),
    h3: ({node, ...props}: any) => <h3 className="text-base font-bold text-gray-800 mt-4 mb-2 flex items-center break-words" {...props} />,
    h4: ({node, ...props}: any) => <h4 className="text-sm font-semibold text-gray-600 mt-2 mb-1 break-words" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-2 text-gray-700 leading-relaxed text-sm text-justify break-words whitespace-pre-wrap" {...props} />,
    ul: ({node, ...props}: any) => <ul className="ml-1 mb-3 text-gray-700 space-y-1.5" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal ml-5 mb-3 text-gray-700 space-y-1.5" {...props} />,
    li: ({node, ...props}: any) => (
        <li className={`relative pl-4 text-sm leading-6 flex items-start group`}>
            <span className={`absolute left-0 top-[0.6rem] w-1.5 h-1.5 rounded-full ${theme.bg.replace('50', '400')} group-hover:scale-125 transition-transform`}></span>
            <span className="break-words">{props.children}</span>
        </li>
    ),
    strong: ({node, ...props}: any) => <strong className={`font-bold ${theme.text}`} {...props} />,
    blockquote: ({node, ...props}: any) => (
        <blockquote className={`border-l-4 ${theme.border.replace('200', '400')} pl-4 py-3 pr-3 italic text-gray-600 my-5 ${theme.bg} rounded-r-lg shadow-sm text-sm relative break-words`} {...props}>
            <span className="absolute top-0 left-1 text-2xl leading-none opacity-20 font-serif">"</span>
            {props.children}
        </blockquote>
    ),
    a: ({node, ...props}: any) => <a className={`hover:underline underline-offset-2 transition-colors font-medium ${theme.link} break-all`} target="_blank" rel="noopener noreferrer" {...props} />,
    hr: ({node, ...props}: any) => (
        <div className="relative clear-both py-4">
            <div className={`border-t border-dashed ${theme.border} w-full`}></div>
        </div>
    ),
  };

  return (
    <div className="relative break-words h-full flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 w-full">
      
      {/* --- Background Decorations --- */}
      <div className={`absolute -top-[15mm] -left-[15mm] -right-[15mm] h-6 bg-gradient-to-r ${themeColor} opacity-90 z-0`}></div>
      <div className="absolute -top-[15mm] -left-[15mm] -right-[15mm] -bottom-[15mm] z-0 opacity-15 pointer-events-none mix-blend-multiply"
           style={{ backgroundImage: `radial-gradient(${theme.dot} 1.5px, transparent 1.5px)`, backgroundSize: '24px 24px' }}></div>
      <div className={`absolute -top-[15mm] -left-[15mm] w-24 h-24 border-t-4 border-l-4 ${theme.borderDark} opacity-20 rounded-tl-none pointer-events-none z-0`}></div>
      <div className={`absolute -top-[15mm] -left-[15mm] w-32 h-32 bg-gradient-to-br ${themeColor} opacity-5 blur-2xl pointer-events-none z-0`}></div>
      <div className={`absolute -bottom-[15mm] -right-[15mm] w-24 h-24 border-b-4 border-r-4 ${theme.borderDark} opacity-20 rounded-br-none pointer-events-none z-0`}></div>
      <div className={`absolute -bottom-[15mm] -right-[15mm] w-40 h-40 bg-gradient-to-tl ${themeColor} opacity-5 blur-3xl pointer-events-none z-0`}></div>
      <div className={`absolute -bottom-[30px] -left-[30px] w-48 h-48 rounded-full opacity-[0.03] bg-gradient-to-tr ${themeColor} pointer-events-none blur-xl z-0`}></div>

      {/* --- Main Content --- */}
      <div className="markdown-content flex-grow relative pt-4 z-10 w-full">
        
        {/* HEADER SECTION (Flex Layout) */}
        <div className="flex flex-row justify-between items-start mb-2 min-h-[140px]">
            {/* Left: Text Content */}
            <div className="flex-1 pr-8 min-w-0">
                <ReactMarkdown components={markdownComponents}>
                    {headerContent}
                </ReactMarkdown>
            </div>

            {/* Right: Photo Container */}
            <div className="shrink-0 relative" style={{ marginRight: '-10px' }}> 
                <div 
                    className={`relative z-20 group rounded-lg print:shadow-none
                    ${!photoUrl ? 'bg-slate-50 border-2 border-dashed border-slate-300' : 'bg-white shadow-lg border border-gray-100'}
                    ${isDragging ? 'cursor-move opacity-90 ring-2 ring-indigo-300' : 'cursor-move'}
                    `}
                    style={{ 
                        width: `${dims.w}px`, 
                        height: `${dims.h}px`, 
                        marginTop: `${margins.top}px`, 
                        marginRight: `${margins.right}px`, 
                        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s, border-color 0.2s' 
                    }}
                    onMouseDown={handleMouseDownContainer}
                    title="拖拽调整微调位置，点击更换照片"
                >
                    {photoUrl ? (
                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover rounded-lg pointer-events-none" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 group-hover:text-indigo-500 transition-colors duration-300 select-none">
                            <PhotoIcon className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-medium text-center leading-tight opacity-70">上传照片</span>
                        </div>
                    )}
                    {/* Resize Handle */}
                    <div 
                        className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30 print:hidden"
                        onMouseDown={handleMouseDownResize}
                        title="拖动调整大小"
                    >
                        <div className="w-2.5 h-2.5 bg-white border border-gray-400 rounded-sm shadow-sm hover:bg-indigo-100"></div>
                    </div>

                    {/* Reset Button */}
                    <button 
                        onClick={resetPhoto}
                        className="reset-btn absolute -top-2 -right-2 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-30 print:hidden"
                        title="重置图片位置和大小"
                    >
                        <RefreshIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>

        {/* BODY SECTION (Flow Layout) */}
        <div className="w-full">
            <ReactMarkdown components={markdownComponents}>
                {bodyContent}
            </ReactMarkdown>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="h-6"></div>
    </div>
  );
};

export default MarkdownRenderer;