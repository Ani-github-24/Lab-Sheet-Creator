import React, { ClipboardEvent, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useLabStore, LabQuestion } from '../store';
import FrontPageEditor from './FrontPageEditor';

interface ColabInserterProps {
  index: number;
}

const ColabInserter: React.FC<ColabInserterProps> = ({ index }) => {
  const addBlankQuestion = useLabStore((state) => state.addBlankQuestion);
  const addSubheading = useLabStore((state) => state.addSubheading);

  return (
    <div className="relative h-7 -my-2 flex items-center justify-center group/colab z-20">
      {/* Horizontal divider line on hover (Google Colab style) */}
      <div className="absolute inset-x-4 h-[1px] bg-black dark:bg-white/40 opacity-0 group-hover/colab:opacity-100 transition-opacity duration-150 pointer-events-none" />

      {/* Floating Buttons: Add Question & Add Headings */}
      <div className="opacity-0 group-hover/colab:opacity-100 transition-all duration-150 transform scale-90 group-hover/colab:scale-100 flex items-center gap-1.5 bg-[#dceeff] dark:bg-[#0f172a] p-1 rounded-full z-20 border border-black dark:border-white/30 shadow-none pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addBlankQuestion(index);
          }}
          className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] hover:bg-[#ffd731] dark:hover:bg-[#ffd731] text-black dark:text-white dark:hover:text-black text-[11px] font-bold uppercase tracking-[0.032em] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          title="Insert question here"
        >
          <span>＋</span>
          <span>Add Question</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addSubheading(index);
          }}
          className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-[#e9ccff] dark:bg-[#581c87] hover:bg-[#d9b3ff] dark:hover:bg-[#6b21a8] text-black dark:text-white text-[11px] font-bold uppercase tracking-[0.032em] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          title="Insert heading here"
        >
          <span>§</span>
          <span>Add Headings</span>
        </button>
      </div>
    </div>
  );
};

interface QuestionCardProps {
  q: LabQuestion;
  index: number;
  isLast: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ q, index, isLast }) => {
  const removeQuestion = useLabStore((state) => state.removeQuestion);
  const attachScreenshot = useLabStore((state) => state.attachScreenshot);
  const removeScreenshot = useLabStore((state) => state.removeScreenshot);
  const editQuestionText = useLabStore((state) => state.editQuestionText);
  const editQuestionPrefix = useLabStore((state) => state.editQuestionPrefix);
  const updateCodeSnippet = useLabStore((state) => state.updateCodeSnippet);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(q.questionText);
  const isSubheading = q.type === 'subheading';

  // Keep editText in sync with store changes when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setEditText(q.questionText);
    }
  }, [q.questionText, isEditing]);

  const handleSave = () => {
    editQuestionText(q.id, editText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter to save
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(q.questionText);
      setIsEditing(false);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Check for image in clipboard FIRST
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        const blob = items[i].getAsFile();
        if (blob) {
          attachScreenshot(q.id, blob);
          return;
        }
      }
    }

    // Otherwise check for plain text / code snippet
    const text = e.clipboardData.getData('text');
    if (text && text.trim()) {
      updateCodeSnippet(q.id, text);
      return;
    }
  };

  return (
    <Draggable draggableId={q.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex flex-col relative"
        >
          {/* Colab Inserter directly above this card */}
          <ColabInserter index={index} />

          {/* Main Card */}
          <div
            className={`rounded-[24px] p-6 border flex flex-col gap-4 mb-2 transition-all ${
              isSubheading
                ? 'bg-[#e9ccff] dark:bg-[#3b1d60] border-black dark:border-white/20 text-black dark:text-white'
                : 'bg-white dark:bg-[#1e293b] border-black dark:border-white/20 text-black dark:text-white'
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div
                {...provided.dragHandleProps}
                className="mt-1 cursor-grab active:cursor-grabbing text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors shrink-0"
                title="Drag to reorder"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path>
                </svg>
              </div>

              <div className="flex-1 flex flex-col items-start sm:flex-row gap-2">
                {!isSubheading && (
                  <input
                    value={q.prefix}
                    onChange={(e) => editQuestionPrefix(q.id, e.target.value)}
                    className="font-mono font-bold text-black dark:text-white w-14 bg-transparent border-b border-black/40 dark:border-white/40 focus:border-black dark:focus:border-white focus:outline-none transition-colors text-base"
                    placeholder="1."
                  />
                )}

                {isSubheading && (
                  <span className="px-2.5 py-0.5 rounded-full border border-black dark:border-white/30 bg-black dark:bg-[#ffd731] text-white dark:text-black text-[10px] font-bold uppercase tracking-[0.032em] shrink-0 self-center">
                    Section Header
                  </span>
                )}

                <div
                  onClick={() => !isEditing && setIsEditing(true)}
                  className={`w-full ${!isEditing ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-text rounded-[12px] p-1 transition-colors' : ''}`}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-1.5 w-full">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className={`w-full border border-black dark:border-white/30 rounded-[16px] p-3 text-black dark:text-white bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-y leading-relaxed ${
                          isSubheading ? 'font-bold min-h-[50px] text-lg' : 'min-h-[90px] text-sm'
                        }`}
                        autoFocus
                      />
                      <div className="flex items-center justify-between text-[11px] font-bold text-black/60 dark:text-white/60 px-1">
                        <span>
                          Press <kbd className="bg-white dark:bg-[#334155] text-black dark:text-white border border-black dark:border-white/30 rounded-full px-2 py-0.5 text-[10px] font-mono">Shift+Enter</kbd> to save
                        </span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSave();
                          }}
                          className="px-3 py-1 rounded-full border border-black dark:border-white/30 bg-[#55db9c] text-black text-[10px] font-bold uppercase tracking-[0.032em] hover:opacity-90 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-black dark:text-white leading-relaxed min-h-[1.5em] ${
                      isSubheading
                        ? 'font-display font-extrabold text-2xl uppercase tracking-tight'
                        : 'font-medium text-sm'
                    }`}>
                      {q.questionText || <span className="text-black/40 dark:text-white/40 italic">Click to type question...</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="px-3 py-1.5 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] text-black dark:text-white hover:bg-[#fb4903] hover:text-white dark:hover:bg-[#fb4903] dark:hover:text-white text-xs font-bold uppercase tracking-[0.032em] transition-colors cursor-pointer"
                  aria-label="Delete Question"
                >
                  Delete
                </button>
              </div>
            </div>

            {!isSubheading && (
              <div className="mt-1 flex flex-col gap-3">
                {(!q.screenshotUrl && !q.codeSnippet) && (
                  <div
                    tabIndex={0}
                    onPaste={handlePaste}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        attachScreenshot(q.id, file);
                      }
                    }}
                    className="border border-dashed border-black dark:border-white/30 rounded-[20px] p-6 text-center text-black dark:text-white bg-[#f8fafc] dark:bg-[#0f172a]/60 hover:bg-[#fff9d9] dark:hover:bg-[#1e293b] transition-colors cursor-pointer outline-none flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#334155] border border-black dark:border-white/30 flex items-center justify-center text-xs font-bold text-black dark:text-white">
                      📋
                    </div>
                    <p className="text-xs font-bold text-black dark:text-white uppercase tracking-[0.032em]">
                      Press <kbd className="bg-white dark:bg-[#334155] text-black dark:text-white border border-black dark:border-white/30 rounded-full px-2 py-0.5 text-[10px] mx-1">Ctrl+V</kbd> to paste screenshot or code
                    </p>
                    <label className="cursor-pointer text-[11px] font-bold underline uppercase tracking-[0.032em] text-black dark:text-white">
                      or browse image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) attachScreenshot(q.id, file);
                        }}
                      />
                    </label>
                  </div>
                )}

                {q.codeSnippet && (
                  <div className="relative group rounded-[16px] overflow-hidden border border-black dark:border-white/20 bg-black">
                    <div className="px-3 py-1.5 bg-black border-b border-white/20 flex items-center justify-between text-[11px] font-mono text-white/60">
                      <span>TERMINAL / CODE BLOCK</span>
                      <button
                        onClick={() => updateCodeSnippet(q.id, '')}
                        className="text-white hover:text-[#fb4903] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      value={q.codeSnippet}
                      onChange={(e) => updateCodeSnippet(q.id, e.target.value)}
                      className="w-full h-auto min-h-[140px] bg-black text-[#d4d4d4] p-4 font-mono text-xs focus:outline-none resize-y"
                      spellCheck={false}
                    />
                  </div>
                )}

                {q.screenshotUrl && (
                  <div className="relative group rounded-[16px] overflow-hidden border border-black dark:border-white/20 bg-white dark:bg-[#0f172a] p-2">
                    <img
                      src={q.screenshotUrl}
                      alt={`Screenshot for Question ${q.prefix}`}
                      className="w-full h-auto max-h-[400px] object-contain rounded-[12px] block"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeScreenshot(q.id)}
                        className="bg-white dark:bg-[#334155] text-black dark:text-white border border-black dark:border-white/30 px-4 py-2 rounded-full font-bold uppercase text-xs tracking-[0.032em] hover:bg-[#fb4903] hover:text-white dark:hover:bg-[#fb4903] dark:hover:text-white transition-all cursor-pointer"
                      >
                        Remove Screenshot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colab Inserter directly below the last card */}
          {isLast && (
            <ColabInserter index={index + 1} />
          )}
        </div>
      )}
    </Draggable>
  );
};

const BuilderPanel: React.FC = () => {
  const questions = useLabStore((state) => state.questions);
  const addBlankQuestion = useLabStore((state) => state.addBlankQuestion);
  const addSubheading = useLabStore((state) => state.addSubheading);
  const setQuestions = useLabStore((state) => state.setQuestions);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    const newQuestions = Array.from(questions);
    const [removed] = newQuestions.splice(startIndex, 1);
    newQuestions.splice(endIndex, 0, removed);

    setQuestions(newQuestions);
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="flex flex-col gap-4 flex-1">
        <FrontPageEditor />

        {questions.length === 0 ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-[28px] border border-black dark:border-white/20 p-10 text-center my-6 text-black dark:text-white">
            <div className="w-12 h-12 rounded-full bg-[#ffd731] border border-black mx-auto flex items-center justify-center text-xl font-bold mb-3">
              ✍️
            </div>
            <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-black dark:text-white">
              BLANK LAB SHEET
            </h3>
            <p className="text-xs text-black/60 dark:text-white/60 max-w-sm mx-auto mt-1 leading-relaxed">
              No questions yet. Click <strong>Add Question</strong> below or use <strong>Paste .md</strong> in the top toolbar to load your notes.
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col"
                >
                  {questions.map((q, index) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      index={index}
                      isLast={index === questions.length - 1}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Pill Action Buttons - Sticky to bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md border border-black dark:border-white/20 rounded-full p-2 flex gap-3 z-30">
        <button
          onClick={() => addBlankQuestion()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-black dark:border-white/30 bg-white dark:bg-[#334155] hover:bg-[#ffd731] dark:hover:bg-[#ffd731] text-black dark:text-white dark:hover:text-black text-xs font-bold tracking-[0.032em] uppercase transition-all cursor-pointer"
        >
          <span>＋</span>
          <span>Add Question</span>
        </button>
        <button
          onClick={() => addSubheading()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-black dark:border-white/30 bg-[#e9ccff] dark:bg-[#581c87] hover:bg-[#d9b3ff] dark:hover:bg-[#6b21a8] text-black dark:text-white text-xs font-bold tracking-[0.032em] uppercase transition-all cursor-pointer"
        >
          <span>§</span>
          <span>Add Headings</span>
        </button>
      </div>
    </div>
  );
};

export default BuilderPanel;
