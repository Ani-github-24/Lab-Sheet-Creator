import React, { useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BuilderPanel from './components/BuilderPanel';
import PdfViewerPanel from './components/PdfViewerPanel';
import LabDocument from './components/LabDocument';
import { useLabStore } from './store';

function App() {
  const questions = useLabStore((state) => state.questions);
  const metadata = useLabStore((state) => state.metadata);
  const initializeStore = useLabStore((state) => state.initializeStore);
  const isInitialized = useLabStore((state) => state.isInitialized);
  const resetWorkspace = useLabStore((state) => state.resetWorkspace);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  if (!isInitialized) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-indigo-600 font-bold text-xl">Loading Lab Sheet...</div>;
  }

  return (
    <div className="flex h-screen w-full font-sans bg-gray-50 overflow-hidden">
      {/* Left Panel (50% Width) - PDF Reader */}
      <PdfViewerPanel />

      {/* Right Panel (50% Width) - Interactive Feed */}
      <div className="w-1/2 bg-[#f8fafc] flex flex-col h-full">
        <div className="p-8 pb-4 bg-white border-b border-gray-200 shadow-sm z-10 sticky top-0 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Editor</h2>
            <p className="text-gray-500 mt-2 font-medium text-lg">Manage and attach screenshots to your questions.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all questions and screenshots? Your metadata will be saved.')) {
                  resetWorkspace();
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Clear Workspace
            </button>

            <PDFDownloadLink
              document={<LabDocument metadata={metadata} questions={questions} />}
              fileName={`Lab_${metadata.labNumber}_${metadata.studentName.replace(/\s+/g, '_')}.pdf`}
            >
              {({ loading }) => (
                <button
                  disabled={loading || questions.length === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-sm transition-all
                  ${loading || questions.length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-95'
                    }
                `}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

        <div className="overflow-y-auto flex-1 bg-slate-50/50">
          <BuilderPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
