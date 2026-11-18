import React, { useState, useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useLabStore, LabMetadata } from '../store';
import LabDocument from './LabDocument';
import { parseMarkdownToLab, SAMPLE_MARKDOWN } from '../utils/markdownParser';
import { getPdfFileName } from '../utils/pdfFileName';

interface MarkdownConverterProps {
  variant?: 'inline' | 'modal';
  onClose?: () => void;
  onSuccessOpenEditor?: () => void;
}

export const MarkdownConverter: React.FC<MarkdownConverterProps> = ({
  variant = 'inline',
  onClose,
  onSuccessOpenEditor,
}) => {
  const metadata = useLabStore((state) => state.metadata);
  const updateMetadata = useLabStore((state) => state.updateMetadata);
  const importQuestions = useLabStore((state) => state.importQuestions);
  const completeSetup = useLabStore((state) => state.completeSetup);
  const toggleFrontPage = useLabStore((state) => state.toggleFrontPage);

  const [markdownText, setMarkdownText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Parse markdown in real-time
  const parseResult = useMemo(() => {
    return parseMarkdownToLab(markdownText);
  }, [markdownText]);

  // Merge store metadata with any YAML frontmatter parsed from markdown
  const effectiveMetadata: LabMetadata = useMemo(() => {
    return {
      ...metadata,
      ...parseResult.metadataUpdates,
    };
  }, [metadata, parseResult.metadataUpdates]);

  const pdfFileName = useMemo(() => {
    return getPdfFileName(effectiveMetadata);
  }, [effectiveMetadata]);

  const handleLoadSample = () => {
    setMarkdownText(SAMPLE_MARKDOWN.trim());
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMarkdownText(text);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleClear = () => {
    setMarkdownText('');
  };

  const handleOpenInEditor = () => {
    if (Object.keys(parseResult.metadataUpdates).length > 0) {
      updateMetadata(parseResult.metadataUpdates);
    }
    if (parseResult.questions.length > 0) {
      importQuestions(parseResult.questions, importMode);
    }
    completeSetup();
    if (onSuccessOpenEditor) {
      onSuccessOpenEditor();
    }
  };

  const hasContent = parseResult.questions.length > 0;
  const hasFrontmatter = Object.keys(parseResult.metadataUpdates).length > 0;

  const content = (
    <div className="flex flex-col gap-4 text-black dark:text-white">
      {/* Top Banner / Explainer */}
      <div className="bg-[#dceeff] dark:bg-[#0f172a] border border-black dark:border-white/20 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-black dark:bg-[#ffd731]"></span>
            <h3 className="font-display font-extrabold text-base uppercase tracking-tight text-black dark:text-white">
              PASTE MARKDOWN (.MD) TO PDF
            </h3>
          </div>
          <p className="text-xs text-black/70 dark:text-white/70 font-medium mt-0.5">
            Headings, questions, and code blocks are automatically parsed with the university cover page.
          </p>
        </div>

        {/* Cover Page status badge & toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFrontPage}
            className={`px-3 py-1.5 rounded-full border border-black dark:border-white/30 text-xs font-bold uppercase tracking-[0.032em] transition-all cursor-pointer ${
              effectiveMetadata.includeFrontPage
                ? 'bg-[#55db9c] text-black'
                : 'bg-[#e9e9e9] dark:bg-[#334155] text-black/60 dark:text-white/60'
            }`}
          >
            {effectiveMetadata.includeFrontPage ? '✓ Cover Page Included' : '✕ Cover Page Skipped'}
          </button>
        </div>
      </div>

      {/* Editor & Preview Tabs with Toolbar */}
      <div className="flex flex-col border border-black dark:border-white/20 rounded-[24px] overflow-hidden bg-white dark:bg-[#1e293b]">
        <div className="flex flex-wrap items-center justify-between border-b border-black dark:border-white/20 px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] gap-2">
          {/* Pill Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1 rounded-full border border-black dark:border-white/30 text-xs font-bold uppercase tracking-[0.032em] transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#e9e9e9] dark:hover:bg-[#475569]'
              }`}
            >
              Markdown Text
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              disabled={!hasContent}
              className={`px-3.5 py-1 rounded-full border border-black dark:border-white/30 text-xs font-bold uppercase tracking-[0.032em] transition-all ${
                activeTab === 'preview'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : hasContent
                    ? 'bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#e9e9e9] dark:hover:bg-[#475569] cursor-pointer'
                    : 'bg-[#e9e9e9] dark:bg-[#334155]/40 text-black/40 dark:text-white/40 border-black/30 dark:border-white/20 cursor-not-allowed'
              }`}
            >
              Preview ({parseResult.questions.length})
            </button>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePasteClipboard}
              className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] hover:bg-[#ffd731] dark:hover:bg-[#ffd731] text-black dark:text-white dark:hover:text-black text-xs font-bold uppercase tracking-[0.032em] transition-colors cursor-pointer flex items-center gap-1"
              title="Paste from system clipboard"
            >
              <span>📋</span> Paste
            </button>
            <button
              onClick={handleLoadSample}
              className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-[#e9ccff] dark:bg-[#581c87] hover:bg-[#d9b3ff] dark:hover:bg-[#6b21a8] text-black dark:text-white text-xs font-bold uppercase tracking-[0.032em] transition-colors cursor-pointer"
              title="Load example markdown lab report"
            >
              ★ Load Sample
            </button>
            {markdownText && (
              <button
                onClick={handleClear}
                className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] hover:bg-[#fb4903] hover:text-white dark:hover:bg-[#fb4903] dark:hover:text-white text-black dark:text-white text-xs font-bold uppercase tracking-[0.032em] transition-colors cursor-pointer"
                title="Clear markdown text"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === 'editor' ? (
          <div className="p-2 bg-white dark:bg-[#0f172a]">
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder={`# Lab 1: Linux Process Management

## Section 1: Process Creation
1. Write a C program to create a child process using fork().
\`\`\`c
#include <stdio.h>
#include <unistd.h>
int main() {
    fork();
    printf("PID: %d\\n", getpid());
    return 0;
}
\`\`\`

2. Explain orphan process...
`}
              className="w-full h-72 p-4 font-mono text-xs sm:text-sm bg-white dark:bg-[#0f172a] text-black dark:text-white border-none resize-y focus:outline-none leading-relaxed placeholder:text-black/30 dark:placeholder:text-white/30"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="p-4 max-h-72 overflow-y-auto space-y-2.5 bg-[#f8fafc] dark:bg-[#0f172a]/60">
            {parseResult.questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className={`p-3.5 rounded-[16px] border text-xs ${
                  q.type === 'subheading'
                    ? 'bg-[#e9ccff] dark:bg-[#3b1d60] border-black dark:border-white/20 font-bold text-black dark:text-white'
                    : 'bg-white dark:bg-[#1e293b] border-black dark:border-white/20 text-black dark:text-white'
                }`}
              >
                {q.type === 'subheading' ? (
                  <div className="text-sm font-display font-extrabold uppercase flex items-center gap-2">
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-black dark:bg-[#ffd731] text-white dark:text-black font-mono">
                      Section
                    </span>
                    {q.questionText}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      {q.prefix && (
                        <span className="font-mono font-bold text-black dark:text-white shrink-0">
                          {q.prefix}
                        </span>
                      )}
                      <span className="font-medium whitespace-pre-wrap">{q.questionText || <em className="text-black/40 dark:text-white/40">No question text</em>}</span>
                    </div>
                    {q.codeSnippet && (
                      <div className="bg-black p-2.5 rounded-[10px] text-[#d4d4d4] font-mono text-[11px] overflow-x-auto border border-black dark:border-white/20">
                        <pre><code>{q.codeSnippet}</code></pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Statistics Bar */}
        <div className="border-t border-black dark:border-white/20 px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.032em] text-black dark:text-white">
          <div className="flex items-center gap-3">
            <span><strong>{parseResult.stats.subheadingsCount}</strong> Sections</span>
            <span>•</span>
            <span><strong>{parseResult.stats.questionsCount}</strong> Questions</span>
            <span>•</span>
            <span><strong>{parseResult.stats.codeBlocksCount}</strong> Code Blocks</span>
          </div>

          {hasFrontmatter && (
            <span className="text-black bg-[#ffd731] px-2 py-0.5 rounded-full border border-black text-[10px]">
              ★ Frontmatter Applied
            </span>
          )}
        </div>
      </div>

      {/* Target Filename Preview & Import Mode */}
      <div className="p-3.5 rounded-[20px] bg-[#f8fafc] dark:bg-[#0f172a] border border-black dark:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-black dark:text-white uppercase tracking-[0.032em]">Generated File:</span>
          <code className="font-mono bg-white dark:bg-[#1e293b] px-2.5 py-1 rounded-full border border-black dark:border-white/30 text-black dark:text-white font-bold">
            {pdfFileName}
          </code>
        </div>

        {variant === 'modal' && (
          <div className="flex items-center gap-3">
            <span className="font-bold uppercase tracking-[0.032em] text-black dark:text-white">Mode:</span>
            <label className="inline-flex items-center gap-1 cursor-pointer font-bold text-xs uppercase text-black dark:text-white">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-black focus:ring-black"
              />
              Replace Current
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer font-bold text-xs uppercase text-black dark:text-white">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
                className="text-black focus:ring-black"
              />
              Append
            </label>
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        {/* PDF Download Button - Filled Primary CTA */}
        <PDFDownloadLink
          document={<LabDocument metadata={effectiveMetadata} questions={parseResult.questions} />}
          fileName={pdfFileName}
          className="w-full sm:flex-1"
        >
          {({ loading }) => (
            <button
              disabled={loading || !hasContent}
              className={`w-full py-3.5 px-6 rounded-full font-bold tracking-[0.032em] uppercase border border-black dark:border-white/30 transition-all text-xs flex items-center justify-center gap-2 ${
                loading || !hasContent
                  ? 'bg-[#e9e9e9] dark:bg-[#334155]/40 text-black/40 dark:text-white/40 border-black/30 dark:border-white/20 cursor-not-allowed'
                  : 'bg-black hover:bg-neutral-800 text-white cursor-pointer active:scale-95'
              }`}
            >
              {loading ? (
                <span>GENERATING PDF...</span>
              ) : (
                <>
                  <span>⬇</span>
                  <span>Convert & Download PDF (with Front Page)</span>
                </>
              )}
            </button>
          )}
        </PDFDownloadLink>

        {/* Load into Editor Button - Outlined Ghost Button */}
        <button
          onClick={handleOpenInEditor}
          disabled={!hasContent}
          className={`w-full sm:flex-1 py-3.5 px-6 rounded-full font-bold tracking-[0.032em] uppercase transition-all text-xs flex items-center justify-center gap-2 border border-black dark:border-white/30 ${
            !hasContent
              ? 'bg-[#e9e9e9] dark:bg-[#334155]/40 text-black/40 dark:text-white/40 border-black/30 dark:border-white/20 cursor-not-allowed'
              : 'bg-white dark:bg-[#334155] hover:bg-[#ffd731] dark:hover:bg-[#ffd731] text-black dark:text-white dark:hover:text-black cursor-pointer active:scale-95'
          }`}
        >
          <span>✏️</span>
          <span>Open & Edit in Workspace</span>
        </button>
      </div>
    </div>
  );

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-[28px] border border-black dark:border-white/20 max-w-3xl w-full p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col text-black dark:text-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black dark:border-white/20 shrink-0">
            <div>
              <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight text-black dark:text-white">
                IMPORT MARKDOWN (.MD)
              </h2>
              <p className="text-xs text-black/60 dark:text-white/60 font-medium mt-0.5">
                Paste notes to generate a PDF or populate your questions.
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#fb4903] hover:text-white dark:hover:bg-[#fb4903] dark:hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                aria-label="Close dialog"
              >
                ✕
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto py-4 flex-1">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default MarkdownConverter;
