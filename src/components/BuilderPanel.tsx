import React, { ClipboardEvent, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useLabStore, LabQuestion } from '../store';
import FrontPageEditor from './FrontPageEditor';

const QuestionCard: React.FC<{ q: LabQuestion; index: number }> = ({ q, index }) => {
  const removeQuestion = useLabStore((state) => state.removeQuestion);
  const attachScreenshot = useLabStore((state) => state.attachScreenshot);
  const removeScreenshot = useLabStore((state) => state.removeScreenshot);
  const editQuestionText = useLabStore((state) => state.editQuestionText);
  const editQuestionPrefix = useLabStore((state) => state.editQuestionPrefix);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(q.questionText);
  const isSubheading = q.type === 'subheading';

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        const blob = items[i].getAsFile();
        if (blob) {
          attachScreenshot(q.id, blob);
        }
        break;
      }
    }
  };

  // Edit logic is now handled directly via onMouseLeave on the container

  return (
    <Draggable draggableId={q.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white shadow-sm rounded-xl p-6 border ${isSubheading ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'} flex flex-col gap-4 transition-all hover:shadow-md mb-2`}
        >
          <div className="flex justify-between items-start gap-4">
            <div 
              {...provided.dragHandleProps}
              className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Drag to reorder"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
            </div>
            <div className="flex-1 text-lg flex flex-col items-start sm:flex-row">
          {!isSubheading && (
            <input
              value={q.prefix}
              onChange={(e) => editQuestionPrefix(q.id, e.target.value)}
              className="font-bold text-gray-800 mr-2 w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="1."
            />
          )}
          <div 
            onMouseEnter={() => setIsEditing(true)}
            onMouseLeave={() => {
              editQuestionText(q.id, editText);
              setIsEditing(false);
            }}
            className="w-full"
          >
            {isEditing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y mt-2 ${isSubheading ? 'font-bold min-h-[60px]' : 'min-h-[100px]'}`}
                autoFocus
              />
            ) : (
              <div className={`text-gray-700 leading-relaxed cursor-text min-h-[1.5em] p-1 border border-transparent hover:border-gray-200 rounded transition-colors ${isSubheading ? 'font-extrabold text-xl block w-full border-b-2 border-indigo-200 pb-2 mb-2' : ''}`}>
                {q.questionText || <span className="text-gray-400 italic">Hover to edit</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Edit button removed in favor of hover-to-edit */}
          <button
            onClick={() => removeQuestion(q.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors text-center w-full"
            aria-label="Delete Question"
          >
            Delete
          </button>
        </div>
      </div>

      {!isSubheading && (
        <div className="mt-2">
          {!q.screenshotUrl ? (
          <div
            tabIndex={0}
            onPaste={handlePaste}
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer outline-none"
          >
            <p className="font-medium">
              Click here to focus, then press{' '}
              <kbd className="bg-gray-100 border border-gray-200 text-gray-700 rounded-md px-2 py-1 font-mono text-sm shadow-sm mx-1">
                Ctrl+V
              </kbd>{' '}
              to paste your terminal screenshot
            </p>
          </div>
        ) : (
          <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={q.screenshotUrl}

              alt={`Screenshot for Question ${q.prefix}`}
              className="w-full h-auto object-contain block"
            />
            <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <button
                onClick={() => removeScreenshot(q.id)}
                className="bg-white text-red-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow-lg transform hover:scale-105 active:scale-95"
              >
                Remove Screenshot
              </button>
            </div>
          </div>
        )}
      </div>
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
    <div className="flex flex-col min-h-full">
      <div className="flex flex-col gap-6 p-6 pb-24 flex-1">
        <FrontPageEditor />
      {questions.length === 0 ? (
        <div className="text-gray-400 text-center mt-12 text-lg">
          No questions yet. Add one from the left panel or start with a blank question.
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions-list">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="flex flex-col gap-2"
              >
                {questions.map((q, index) => (
                  <QuestionCard 
                    key={q.id} 
                    q={q} 
                    index={index} 
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      </div>

      {/* Action Buttons - Sticky to bottom */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex gap-4 z-20 mt-auto">
        <button
          onClick={addBlankQuestion}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Blank Question
        </button>
        <button
          onClick={addSubheading}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 hover:text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          Add Subheading
        </button>
      </div>
    </div>
  );
};

export default BuilderPanel;
