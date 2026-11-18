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
  const togglePdfViewer = useLabStore((state) => state.togglePdfViewer);

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
    <div className="w-1/2 bg-[#f0f6fc] dark:bg-[#0f172a] border-r border-black dark:border-white/20 flex flex-col relative h-full">
      {/* Header */}
      <div className="p-4 px-6 bg-white dark:bg-[#1e293b] border-b border-black dark:border-white/20 z-10 sticky top-0 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4da2ff] border border-black"></span>
          <div>
            <h2 className="font-display font-extrabold text-xl uppercase tracking-tight text-black dark:text-white leading-none">
              PDF READER
            </h2>
            <p className="text-[11px] font-bold text-black/60 dark:text-white/60 uppercase tracking-[0.032em] mt-0.5">
              Highlight text to extract questions
            </p>
          </div>
        </div>

        {/* Circular close button */}
        <button
          onClick={togglePdfViewer}
          className="w-8 h-8 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#fb4903] hover:text-white dark:hover:bg-[#fb4903] dark:hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
          title="Hide PDF viewer"
          aria-label="Hide PDF viewer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#dceeff] dark:bg-[#0f172a]/70 p-6 relative" ref={containerRef}>
        {!file ? (
          <div className="flex items-center justify-center h-full">
            <label className="flex flex-col items-center justify-center w-full max-w-md h-64 border border-dashed border-black dark:border-white/30 rounded-[24px] cursor-pointer bg-white dark:bg-[#1e293b] hover:bg-[#fff9d9] dark:hover:bg-[#334155] transition-all p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4da2ff] border border-black text-white flex items-center justify-center text-xl mb-3">
                📄
              </div>
              <p className="text-sm text-black dark:text-white font-bold uppercase tracking-[0.032em]">
                Click to Upload Lab PDF
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1 font-medium">
                or drag and drop your assignment manual here
              </p>
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
                  <div className="font-display font-extrabold text-xl uppercase text-black dark:text-white tracking-tight">
                    LOADING PDF DOCUMENT...
                  </div>
                </div>
              }
              className="w-full flex flex-col items-center"
            >
              {Array.from(new Array(numPages), (_, index) => (
                <div key={`page_${index + 1}`} className="mb-6 rounded-[20px] border border-black dark:border-white/20 overflow-hidden bg-white shadow-sm">
                  <Page
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={containerRef.current ? containerRef.current.clientWidth - 48 : 550}
                  />
                </div>
              ))}
            </Document>
          </div>
        )}

        {/* Action Tooltip */}
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
              className="bg-black hover:bg-[#ffd731] hover:text-black text-white px-5 py-2 rounded-full border border-black text-xs font-bold uppercase tracking-[0.032em] flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>＋ Add to Lab Sheet</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewerPanel;
