import { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BuilderPanel from './components/BuilderPanel';
import PdfViewerPanel from './components/PdfViewerPanel';
import LabDocument from './components/LabDocument';
import FrontPageEditor from './components/FrontPageEditor';
import MarkdownConverter from './components/MarkdownConverter';
import { useLabStore } from './store';
import { getPdfFileName } from './utils/pdfFileName';

function App() {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  // Default with blank lab sheet as requested
  const [homeMode, setHomeMode] = useState<'pdf' | 'markdown' | 'blank'>('blank');

  const questions = useLabStore((state) => state.questions);
  const metadata = useLabStore((state) => state.metadata);
  const initializeStore = useLabStore((state) => state.initializeStore);
  const isInitialized = useLabStore((state) => state.isInitialized);
  const resetWorkspace = useLabStore((state) => state.resetWorkspace);
  const isSetupComplete = useLabStore((state) => state.isSetupComplete);
  const completeSetup = useLabStore((state) => state.completeSetup);
  const undo = useLabStore((state) => state.undo);
  const toggleFrontPage = useLabStore((state) => state.toggleFrontPage);
  const showPdfViewer = useLabStore((state) => state.showPdfViewer);
  const setShowPdfViewer = useLabStore((state) => state.setShowPdfViewer);
  const togglePdfViewer = useLabStore((state) => state.togglePdfViewer);
  const isDarkMode = useLabStore((state) => state.isDarkMode);
  const toggleDarkMode = useLabStore((state) => state.toggleDarkMode);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Sync dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const generateHtmlBackup = async () => {
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lab Backup - ${metadata.labNumber}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #000; background: #ffffff; }
  pre { background: #000000; color: #ffffff; padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid #000000; }
  img { max-width: 100%; height: auto; border: 1px solid #000000; border-radius: 12px; margin: 1rem 0; }
  h1 { border-bottom: 2px solid #000000; padding-bottom: 0.5rem; }
  h2 { margin-top: 2rem; }
</style>
</head>
<body>
  <h1>${metadata.title} (Lab ${metadata.labNumber})</h1>
  <ul>
    <li><strong>Course:</strong> ${metadata.courseCode} - ${metadata.courseTitle}</li>
    <li><strong>Student:</strong> ${metadata.studentName} (${metadata.rollNumber})</li>
    <li><strong>Batch/Semester:</strong> ${metadata.batch} / ${metadata.semester}</li>
  </ul>
  <hr />
`;

    for (const q of questions) {
      if (q.type === 'subheading') {
        htmlContent += `\n<h2>${q.questionText}</h2>\n`;
      } else {
        htmlContent += `\n<p><strong>${q.prefix}</strong> ${q.questionText}</p>\n`;
        if (q.codeSnippet) {
          htmlContent += `<pre><code>${q.codeSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`;
        }
        if (q.screenshotUrl) {
          try {
            const base64Img = await blobUrlToBase64(q.screenshotUrl);
            htmlContent += `<img src="${base64Img}" alt="Screenshot for ${q.prefix}" />\n`;
          } catch (e) {
            console.error("Failed to convert image for backup", e);
            htmlContent += `<p><em>[Image failed to load in backup]</em></p>\n`;
          }
        }
      }
    }

    htmlContent += `
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_${metadata.labNumber}_${metadata.courseCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dark mode toggle button component
  const DarkModeToggle = () => (
    <button
      onClick={toggleDarkMode}
      className={`p-1.5 rounded-full border border-black dark:border-white/30 transition-all cursor-pointer flex items-center justify-center shrink-0 ${
        isDarkMode
          ? 'bg-[#334155] text-[#ffd731] hover:bg-[#475569]'
          : 'bg-white text-black hover:bg-[#e9e9e9]'
      }`}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  // Marquee announcement strip at very top
  const MarqueeStrip = () => (
    <div className="w-full bg-black text-white text-[11px] sm:text-[12px] font-bold tracking-[0.032em] uppercase py-1.5 overflow-hidden border-b border-black select-none shrink-0 z-30">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
        <span>★ LAB SHEET CREATOR</span>
        <span>•</span>
        <span>INFLATABLE STICKER UNIVERSE ON PASTEL PAPER</span>
        <span>•</span>
        <span>AUTOMATIC UNIVERSITY COVER PAGES</span>
        <span>•</span>
        <span>PASTE MARKDOWN OR HIGHLIGHT PDF</span>
        <span>•</span>
        <span>ONE-CLICK INSTANT EXPORT</span>
        <span>★ LAB SHEET CREATOR</span>
        <span>•</span>
        <span>INFLATABLE STICKER UNIVERSE ON PASTEL PAPER</span>
        <span>•</span>
        <span>AUTOMATIC UNIVERSITY COVER PAGES</span>
        <span>•</span>
        <span>PASTE MARKDOWN OR HIGHLIGHT PDF</span>
        <span>•</span>
        <span>ONE-CLICK INSTANT EXPORT</span>
      </div>
    </div>
  );

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#dceeff] dark:bg-[#0f172a] text-black dark:text-white font-display font-extrabold text-3xl tracking-tight">
        LOADING LAB SHEET CREATOR...
      </div>
    );
  }

  // Home Page (Setup Screen) - Single screen, NO SCROLL!
  if (!isSetupComplete) {
    return (
      <div className="h-screen overflow-hidden flex flex-col font-sans bg-[#dceeff] dark:bg-[#0f172a] text-black dark:text-white selection:bg-[#ffd731] selection:text-black">
        {/* Full-bleed Marquee */}
        <MarqueeStrip />

        {/* Top Navigation Menu Bar with App Name */}
        <header className="px-6 py-3 flex items-center justify-between border-b border-black dark:border-white/20 bg-white dark:bg-[#1e293b] shrink-0 z-20">
          {/* App Name in menu bar */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] flex items-center justify-center font-display font-extrabold text-lg text-black dark:text-white">
              ⚡
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl uppercase tracking-tight leading-none text-black dark:text-white">
                LAB SHEET CREATOR
              </h1>
              <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full border border-black dark:border-white/30 bg-[#ffd731] text-black text-[10px] font-bold tracking-[0.032em] uppercase">
                Paper Edition
              </span>
            </div>
          </div>

          {/* Cover Page Options & Dark Mode in Menu Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFrontPage}
              className={`px-3 py-1.5 rounded-full border border-black dark:border-white/30 text-xs font-bold uppercase tracking-[0.032em] transition-all cursor-pointer flex items-center gap-1.5 ${
                metadata.includeFrontPage
                  ? 'bg-[#55db9c] text-black'
                  : 'bg-[#e9e9e9] dark:bg-[#334155] text-black/60 dark:text-white/60'
              }`}
              title="Toggle Cover Page"
            >
              <span>{metadata.includeFrontPage ? '✓' : '✕'}</span>
              <span className="hidden sm:inline">Cover Page:</span>
              <span>{metadata.includeFrontPage ? 'Included' : 'Skipped'}</span>
            </button>

            {metadata.includeFrontPage && (
              <button
                onClick={() => setShowCoverModal(true)}
                className="px-3.5 py-1.5 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] hover:bg-[#ffd731] dark:hover:bg-[#475569] text-black dark:text-white text-xs font-bold uppercase tracking-[0.032em] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Edit University Cover Page details"
              >
                <span>⚙</span>
                <span className="hidden sm:inline">Edit Cover Details</span>
              </button>
            )}

            {/* Dark Mode Toggle Button */}
            <DarkModeToggle />
          </div>
        </header>

        {/* Main Viewport Content - Fits on single screen with NO SCROLL */}
        <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 max-w-4xl w-full mx-auto">
          {/* Main Card Surface */}
          <div className="w-full bg-white dark:bg-[#1e293b] rounded-[28px] border border-black dark:border-white/20 p-6 sm:p-8 flex flex-col justify-between">
            {/* Section Heading */}
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full border border-black dark:border-white/30 bg-[#dceeff] dark:bg-[#334155] text-[11px] font-bold tracking-[0.032em] uppercase mb-2 text-black dark:text-white">
                ★ Select Mode
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-black dark:text-white leading-none">
                CHOOSE CREATION MODE
              </h2>
              <p className="text-xs text-black/70 dark:text-white/70 font-medium mt-1">
                Pick an option below to start your lab sheet. Blank Sheet is selected by default.
              </p>
            </div>

            {/* 3 Mode Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
              {/* Option 1: Blank Lab Sheet (DEFAULT) */}
              <button
                type="button"
                onClick={() => setHomeMode('blank')}
                className={`p-4 rounded-[22px] border border-black dark:border-white/30 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  homeMode === 'blank'
                    ? 'bg-[#ffd731] text-black ring-2 ring-black dark:ring-white'
                    : 'bg-white dark:bg-[#0f172a] hover:bg-[#fff9d9] dark:hover:bg-[#1e293b] text-black dark:text-white'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-black text-white border border-black flex items-center justify-center font-bold text-xs mb-2.5">
                    ✍️
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-tight">Blank Sheet</h4>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-full">
                      Default
                    </span>
                  </div>
                  <p className="text-[11px] opacity-75 mt-1 leading-relaxed font-medium">
                    Clean full-width editor. Add questions, code, and paste screenshots manually.
                  </p>
                </div>
                {homeMode === 'blank' && (
                  <span className="mt-2.5 inline-flex items-center text-[11px] font-bold uppercase tracking-[0.032em]">
                    ● Selected
                  </span>
                )}
              </button>

              {/* Option 2: Paste Markdown */}
              <button
                type="button"
                onClick={() => setHomeMode('markdown')}
                className={`p-4 rounded-[22px] border border-black dark:border-white/30 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  homeMode === 'markdown'
                    ? 'bg-[#e9ccff] text-black ring-2 ring-black dark:ring-white'
                    : 'bg-white dark:bg-[#0f172a] hover:bg-[#f5e6ff] dark:hover:bg-[#1e293b] text-black dark:text-white'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-black text-white border border-black flex items-center justify-center font-bold text-xs mb-2.5">
                    📝
                  </div>
                  <h4 className="font-bold text-sm tracking-tight">Paste Markdown</h4>
                  <p className="text-[11px] opacity-75 mt-1 leading-relaxed font-medium">
                    Paste .md text with code blocks. Generates PDF with front page or loads into editor.
                  </p>
                </div>
                {homeMode === 'markdown' && (
                  <span className="mt-2.5 inline-flex items-center text-[11px] font-bold uppercase tracking-[0.032em]">
                    ● Selected
                  </span>
                )}
              </button>

              {/* Option 3: PDF to Highlight */}
              <button
                type="button"
                onClick={() => setHomeMode('pdf')}
                className={`p-4 rounded-[22px] border border-black dark:border-white/30 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  homeMode === 'pdf'
                    ? 'bg-[#dceeff] text-black ring-2 ring-black dark:ring-white'
                    : 'bg-white dark:bg-[#0f172a] hover:bg-[#eef6ff] dark:hover:bg-[#1e293b] text-black dark:text-white'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-black text-white border border-black flex items-center justify-center font-bold text-xs mb-2.5">
                    📑
                  </div>
                  <h4 className="font-bold text-sm tracking-tight">Highlight PDF</h4>
                  <p className="text-[11px] opacity-75 mt-1 leading-relaxed font-medium">
                    Split-screen mode: upload lab manual PDF, highlight text to create questions.
                  </p>
                </div>
                {homeMode === 'pdf' && (
                  <span className="mt-2.5 inline-flex items-center text-[11px] font-bold uppercase tracking-[0.032em]">
                    ● Selected
                  </span>
                )}
              </button>
            </div>

            {/* Action CTA Button based on selected mode */}
            <div>
              {homeMode === 'blank' && (
                <button
                  onClick={() => {
                    setShowPdfViewer(false);
                    completeSetup();
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold tracking-[0.032em] uppercase py-3.5 px-8 rounded-full border border-black dark:border-white/30 transition-all active:scale-[0.99] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Blank Lab Sheet</span>
                  <span className="text-base">→</span>
                </button>
              )}

              {homeMode === 'pdf' && (
                <button
                  onClick={() => {
                    setShowPdfViewer(true);
                    completeSetup();
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold tracking-[0.032em] uppercase py-3.5 px-8 rounded-full border border-black dark:border-white/30 transition-all active:scale-[0.99] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start with PDF Highlighter</span>
                  <span className="text-base">→</span>
                </button>
              )}

              {homeMode === 'markdown' && (
                <button
                  onClick={() => setShowMarkdownModal(true)}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold tracking-[0.032em] uppercase py-3.5 px-8 rounded-full border border-black dark:border-white/30 transition-all active:scale-[0.99] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Markdown (.md) Converter</span>
                  <span className="text-base">→</span>
                </button>
              )}

              {/* Bottom Quick Info Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] font-bold uppercase tracking-[0.032em] text-black/60 dark:text-white/60 pt-3">
                <span>Lab #{metadata.labNumber || '1'}</span>
                <span>•</span>
                <span>Course: {metadata.courseCode || 'Not Set'}</span>
                <span>•</span>
                <span>Student: {metadata.studentName || 'Not Set'}</span>
              </div>
            </div>
          </div>
        </main>

        {/* Cover Page Details Modal */}
        {showCoverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
            <div className="bg-white dark:bg-[#1e293b] rounded-[28px] border border-black dark:border-white/20 max-w-2xl w-full p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col text-black dark:text-white">
              <div className="flex items-center justify-between pb-3 border-b border-black dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#55db9c] border border-black"></span>
                  <h3 className="font-display font-extrabold text-xl uppercase tracking-tight">
                    EDIT UNIVERSITY COVER DETAILS
                  </h3>
                </div>
                <button
                  onClick={() => setShowCoverModal(false)}
                  className="w-8 h-8 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] hover:bg-[#fb4903] hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto py-4 flex-1">
                <FrontPageEditor initiallyOpen={true} />
              </div>

              <div className="pt-3 border-t border-black dark:border-white/10 flex justify-end">
                <button
                  onClick={() => setShowCoverModal(false)}
                  className="px-6 py-2.5 rounded-full border border-black dark:border-white/30 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-[0.032em] cursor-pointer"
                >
                  Save & Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Markdown Modal when chosen from home */}
        {showMarkdownModal && (
          <MarkdownConverter
            variant="modal"
            onClose={() => setShowMarkdownModal(false)}
            onSuccessOpenEditor={() => {
              setShowPdfViewer(false);
              setShowMarkdownModal(false);
              completeSetup();
            }}
          />
        )}
      </div>
    );
  }

  // Interactive Editor Workspace
  return (
    <div className="flex flex-col h-screen w-full font-sans bg-[#dceeff] dark:bg-[#0f172a] text-black dark:text-white overflow-hidden selection:bg-[#ffd731] selection:text-black">
      {/* Marquee Banner */}
      <MarqueeStrip />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Optional PDF Reader */}
        {showPdfViewer && (
          <PdfViewerPanel />
        )}

        {/* Right/Main Panel - Interactive Editor */}
        <div className={`${showPdfViewer ? 'w-1/2' : 'w-full'} bg-[#dceeff] dark:bg-[#0f172a] flex flex-col h-full transition-all duration-200`}>
          {/* Top Header */}
          <div className="bg-white dark:bg-[#1e293b] border-b border-black dark:border-white/20 z-10 sticky top-0 shrink-0">
            {/* Top row: Brand, Info, & Dark Mode Toggle */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] flex items-center justify-center font-display font-extrabold text-sm text-black dark:text-white">
                  ⚡
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-black dark:text-white leading-none">
                    LAB SHEET CREATOR
                  </h2>
                  <p className="text-[11px] font-bold text-black/60 dark:text-white/60 uppercase tracking-[0.032em] mt-0.5">
                    Lab {metadata.labNumber || '1'} • {metadata.courseCode || 'Course'} • {questions.length} Questions
                  </p>
                </div>
              </div>

              {/* Status pill badge & Dark Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-[#55db9c] text-black text-[11px] font-bold tracking-[0.032em] uppercase">
                  ● Live Editor
                </span>
                <DarkModeToggle />
              </div>
            </div>

            {/* Bottom row: Pill Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-white dark:bg-[#1e293b]">
              <div className="flex flex-wrap items-center gap-2">
                {/* Toggle PDF panel button */}
                <button
                  onClick={togglePdfViewer}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.032em] uppercase border border-black dark:border-white/30 transition-all cursor-pointer flex items-center gap-1.5 ${
                    showPdfViewer
                      ? 'bg-[#ffd731] text-black'
                      : 'bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#e9e9e9] dark:hover:bg-[#475569]'
                  }`}
                  title={showPdfViewer ? 'Hide PDF side panel' : 'Open PDF to highlight questions'}
                >
                  <span>📑</span>
                  <span>{showPdfViewer ? 'PDF Panel: ON' : '+ Add PDF to Highlight'}</span>
                </button>

                {/* Paste Markdown button */}
                <button
                  onClick={() => setShowMarkdownModal(true)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.032em] uppercase border border-black dark:border-white/30 bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#e9ccff] dark:hover:bg-[#475569] transition-all cursor-pointer flex items-center gap-1.5"
                  title="Paste Markdown notes or convert to PDF"
                >
                  <span>📝</span>
                  <span>Paste .md</span>
                </button>

                {/* Clear Workspace button */}
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all questions and screenshots? Your metadata will be saved.')) {
                      resetWorkspace();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.032em] uppercase border border-black dark:border-white/30 bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#fb4903] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  title="Clear all questions"
                >
                  <span>🗑</span>
                  <span>Clear</span>
                </button>

                {/* HTML Backup button */}
                <button
                  onClick={generateHtmlBackup}
                  disabled={questions.length === 0}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.032em] uppercase border border-black dark:border-white/30 transition-all flex items-center gap-1.5 ${
                    questions.length === 0
                      ? 'bg-[#e9e9e9] dark:bg-[#334155] text-black/40 dark:text-white/40 border-black/30 cursor-not-allowed'
                      : 'bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#e9e9e9] dark:hover:bg-[#475569] cursor-pointer'
                  }`}
                  title="Download HTML backup"
                >
                  <span>💾</span>
                  <span>Backup</span>
                </button>
              </div>

              {/* Filled Primary CTA: Download PDF */}
              <div>
                <PDFDownloadLink
                  document={<LabDocument metadata={metadata} questions={questions} />}
                  fileName={getPdfFileName(metadata)}
                >
                  {({ loading }) => (
                    <button
                      onClick={() => {
                        setHasDownloaded(true);
                        setTimeout(() => setShowFeedbackDialog(true), 500);
                      }}
                      disabled={loading || questions.length === 0}
                      className={`px-5 py-2 rounded-full text-xs font-bold tracking-[0.032em] uppercase border border-black dark:border-white/30 transition-all flex items-center gap-2 ${
                        loading || questions.length === 0
                          ? 'bg-[#e9e9e9] dark:bg-[#334155] text-black/40 dark:text-white/40 border-black/30 cursor-not-allowed'
                          : 'bg-black text-white hover:bg-neutral-800 cursor-pointer active:scale-95'
                      }`}
                    >
                      {loading ? (
                        <span>GENERATING...</span>
                      ) : (
                        <>
                          <span>⬇</span>
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>

          {/* Download Success Banner */}
          {hasDownloaded && (
            <div className="m-4 p-4 bg-[#55db9c] border border-black rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-10 text-black">
              <div className="font-bold text-xs uppercase tracking-[0.032em]">
                🎉 PDF Generated Successfully!
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/Ani-github-24/Lab-Sheet-Creator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-white text-black border border-black rounded-full font-bold text-xs uppercase tracking-[0.032em] hover:bg-black hover:text-white transition-all"
                >
                  ⭐ Star on GitHub
                </a>
                <button
                  onClick={() => setHasDownloaded(false)}
                  className="w-7 h-7 rounded-full bg-white border border-black flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-black hover:text-white"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Builder Panel Container */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            <div className={showPdfViewer ? 'w-full h-full' : 'max-w-4xl mx-auto w-full h-full'}>
              <BuilderPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Post-Download Feedback Dialog */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-2xs z-50 p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-[28px] border border-black dark:border-white/20 max-w-md w-full p-8 text-center space-y-5 text-black dark:text-white">
            <div className="w-12 h-12 rounded-full bg-[#ffd731] border border-black mx-auto flex items-center justify-center text-xl font-bold">
              ✨
            </div>
            <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight">
              PDF FORMATTED CORRECTLY?
            </h3>
            <p className="text-xs font-medium text-black/70 dark:text-white/70 leading-relaxed">
              Large terminal outputs or code blocks may wrap differently depending on character widths.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowFeedbackDialog(false)}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold tracking-[0.032em] uppercase py-3 px-4 rounded-full border border-black transition-all cursor-pointer text-xs"
              >
                Yes, Looks Great!
              </button>
              <button
                onClick={() => {
                  generateHtmlBackup();
                  setShowFeedbackDialog(false);
                }}
                className="w-full bg-white dark:bg-[#334155] hover:bg-[#ffd731] dark:hover:bg-[#475569] text-black dark:text-white font-bold tracking-[0.032em] uppercase py-3 px-4 rounded-full border border-black dark:border-white/30 transition-all cursor-pointer text-xs"
              >
                Download HTML Backup
              </button>
              <button
                onClick={() => setShowFeedbackDialog(false)}
                className="w-full bg-[#e9e9e9] dark:bg-[#475569] hover:bg-[#cccccc] dark:hover:bg-[#64748b] text-black dark:text-white font-bold tracking-[0.032em] uppercase py-3 px-4 rounded-full border border-black dark:border-white/30 transition-all cursor-pointer text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Import Modal */}
      {showMarkdownModal && (
        <MarkdownConverter
          variant="modal"
          onClose={() => setShowMarkdownModal(false)}
          onSuccessOpenEditor={() => setShowMarkdownModal(false)}
        />
      )}
    </div>
  );
}

export default App;
