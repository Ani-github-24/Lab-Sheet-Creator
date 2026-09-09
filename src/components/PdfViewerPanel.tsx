import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useLabStore } from '../store';

// Set up worker using Vite's URL handling for local node_modules resolving
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PdfViewerPanel: React.FC = () => {
  const file = useLabStore((state) => state.pdfFile);
  const setFile = useLabStore((state) => state.setPdfFile);
  const [numPages, setNumPages] = useState<number>(0);
  const addQuestion = useLabStore((state) => state.addQuestion);

  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });

  const containerRef = useRef<HTMLDivElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTooltipState((prev) => ({ ...prev, visible: false }));
      return;
    }

    const text = selection.toString().trim();
    if (text.length === 0) {
      setTooltipState((prev) => ({ ...prev, visible: false }));
      return;
    }

    // Only show tooltip if selection is within the PDF container
    const range = selection.getRangeAt(0);
    const container = documentContainerRef.current;
    if (container && container.contains(range.commonAncestorContainer)) {
      const rect = range.getBoundingClientRect();
      const parentRect = containerRef.current?.getBoundingClientRect();

      if (parentRect) {
        const scrollTop = containerRef.current?.scrollTop || 0;
        const scrollLeft = containerRef.current?.scrollLeft || 0;

        const x = rect.left - parentRect.left + scrollLeft + rect.width / 2;
        const y = rect.top - parentRect.top + scrollTop - 10;

        setTooltipState({
          visible: true,
          x,
          y,
          text,
        });
      }
    } else {
      setTooltipState((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [handleSelection]);

  const handleAddQuestion = () => {
    if (tooltipState.text) {
      const parsedQuestions = tooltipState.text.split(/\n(?=\s*\d+[\.\)])/);

      parsedQuestions.forEach(q => {
        const cleanedText = q.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!cleanedText) return;

        const prefixMatch = cleanedText.match(/^(\d+[\.\)])\s*(.*)/);
        if (prefixMatch) {
          const customPrefix = prefixMatch[1];
          const actualText = prefixMatch[2];
          addQuestion(actualText, customPrefix);
        } else {
          addQuestion(cleanedText);
        }
      });

      window.getSelection()?.removeAllRanges();
      setTooltipState((prev) => ({ ...prev, visible: false }));
    }
  };

  return (
    <div className="w-1/2 bg-gray-200 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col relative h-full">
      {/* Header */}
      <div className="p-4 px-6 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 shadow-sm z-10 sticky top-0 shrink-0">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight">Lab Sheet Creator</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm">Highlight text in your PDF to add it as a question.</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8 relative" ref={containerRef}>
        {!file ? (
          <div className="flex items-center justify-center h-full">
            <label className="flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-gray-400 dark:border-gray-600 border-dashed rounded-2xl cursor-pointer bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all shadow-sm">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 mb-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-2 text-lg text-gray-700 dark:text-gray-300 font-bold">Click to upload PDF</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">or drag and drop your lab sheet here</p>
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={onFileChange} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center" ref={documentContainerRef}>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-pulse text-xl font-bold text-indigo-500 dark:text-indigo-400">Loading PDF Document...</div>
                </div>
              }
              className="w-full flex flex-col items-center"
            >
              {Array.from(new Array(numPages), (_, index) => (
                <div key={`page_${index + 1}`} className="mb-6 shadow-xl rounded-lg overflow-hidden bg-white">
                  <Page
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={containerRef.current ? containerRef.current.clientWidth - 64 : 600}
                  />
                </div>
              ))}
            </Document>
          </div>
        )}

        {/* Tooltip */}
        {tooltipState.visible && (
          <div
            className="absolute z-50 transform -translate-x-1/2 -translate-y-full pb-2 pointer-events-auto"
            style={{
              left: `${tooltipState.x}px`,
              top: `${tooltipState.y}px`
            }}
          >
            <button
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={handleAddQuestion}
              className="bg-gray-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all animate-in fade-in zoom-in duration-200"
            >
              <span>+ Add to Lab Sheet</span>
            </button>
            {/* Arrow */}
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-900 dark:border-t-indigo-600 absolute left-1/2 -translate-x-1/2 bottom-0"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewerPanel;
