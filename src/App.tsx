import { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BuilderPanel from './components/BuilderPanel';
import PdfViewerPanel from './components/PdfViewerPanel';
import LabDocument from './components/LabDocument';
import FrontPageEditor from './components/FrontPageEditor';
import { useLabStore } from './store';

function App() {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const questions = useLabStore((state) => state.questions);
  const metadata = useLabStore((state) => state.metadata);
  const initializeStore = useLabStore((state) => state.initializeStore);
  const isInitialized = useLabStore((state) => state.isInitialized);
  const resetWorkspace = useLabStore((state) => state.resetWorkspace);
  const isSetupComplete = useLabStore((state) => state.isSetupComplete);
  const completeSetup = useLabStore((state) => state.completeSetup);
  const undo = useLabStore((state) => state.undo);
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
  body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
  pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
  img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin: 1rem 0; }
  h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 0.5rem; }
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
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all shadow-sm border border-gray-200 dark:border-gray-600"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  if (!isInitialized) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 font-bold text-xl">Loading Lab Sheet...</div>;
  }

  if (!isSetupComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors">
        <div className="w-full max-w-3xl">
          <div className="flex justify-end mb-4">
            <DarkModeToggle />
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-8 pb-0">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight text-center">Setup Lab Sheet</h1>
              <p className="text-gray-500 dark:text-gray-400 text-center text-lg mb-8">Please verify your cover page details before starting the lab.</p>
            </div>
            <div className="px-8 pb-8">
              <FrontPageEditor initiallyOpen={true} />
              <button
                onClick={completeSetup}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
              >
                Confirm Details & Start Lab
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full font-sans bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Left Panel (50% Width) - PDF Reader */}
      <PdfViewerPanel />

      {/* Right Panel (50% Width) - Interactive Feed */}
      <div className="w-1/2 bg-[#f8fafc] dark:bg-gray-900 flex flex-col h-full">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 sticky top-0 shrink-0">
          {/* Top row: Title + Dark Mode Toggle */}
          <div className="flex justify-between items-center p-4 px-6 pb-2">
            <div>
              <h2 className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight">Editor</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 font-medium text-sm">Manage and attach screenshots to your questions.</p>
            </div>
            <DarkModeToggle />
          </div>

          {/* Bottom row: Action Buttons */}
          <div className="flex items-center gap-2 px-6 pb-3 pt-1">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all questions and screenshots? Your metadata will be saved.')) {
                  resetWorkspace();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm active:scale-95 text-xs"
              title="Clear all questions and screenshots"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Clear
            </button>

            <button
              onClick={generateHtmlBackup}
              disabled={questions.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all text-xs
                ${questions.length === 0
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white shadow-sm active:scale-95'
                }`}
              title="Download text backup if PDF engine fails"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Backup
            </button>

            <PDFDownloadLink
              document={<LabDocument metadata={metadata} questions={questions} />}
              fileName={`Lab_${metadata.labNumber}_${metadata.courseCode}_${metadata.studentName.replace(/\s+/g, '_')}.pdf`}
            >
              {({ loading }) => (
                <button
                  onClick={() => {
                    setHasDownloaded(true);
                    setTimeout(() => setShowFeedbackDialog(true), 500);
                  }}
                  disabled={loading || questions.length === 0}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-white shadow-sm transition-all text-xs
                  ${loading || questions.length === 0
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-95'
                    }
                `}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {hasDownloaded && (
          <div className="m-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl relative shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-10">
            <div className="text-emerald-800 dark:text-emerald-300 font-medium text-sm pr-6">
              🎉 PDF Generated Successfully! If this tool saved you time today, please consider giving it a star on GitHub.
            </div>
            <a
              href="https://github.com/Ani-github-24/Lab-Sheet-Creator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 font-bold text-sm shadow-sm transition-all whitespace-nowrap"
            >
              ⭐ Star on GitHub
            </a>
            <button
              onClick={() => setHasDownloaded(false)}
              className="absolute top-2 right-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 bg-slate-50/50 dark:bg-gray-900/50">
          <BuilderPanel />
        </div>
      </div>

      {/* Post-Download Feedback Dialog */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Was the PDF formatted correctly?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sometimes complex layouts or very large code blocks can cause the PDF engine to glitch.
            </p>
            
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={() => setShowFeedbackDialog(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95"
              >
                Yes (Looks Good)
              </button>
              
              <button
                onClick={() => {
                  generateHtmlBackup();
                  setShowFeedbackDialog(false);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Download Backup
              </button>

              <button
                onClick={() => setShowFeedbackDialog(false)}
                className="w-full bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-600 transition-all active:scale-95"
              >
                Try Again (Adjust layout)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
