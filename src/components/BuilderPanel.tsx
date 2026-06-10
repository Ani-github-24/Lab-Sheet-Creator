import React, { ClipboardEvent, useState } from 'react';
import { useLabStore, LabQuestion } from '../store';
import FrontPageEditor from './FrontPageEditor';

const QuestionCard: React.FC<{ q: LabQuestion }> = ({ q }) => {
  const removeQuestion = useLabStore((state) => state.removeQuestion);
  const attachScreenshot = useLabStore((state) => state.attachScreenshot);
  const removeScreenshot = useLabStore((state) => state.removeScreenshot);
  const editQuestionText = useLabStore((state) => state.editQuestionText);
  const editQuestionPrefix = useLabStore((state) => state.editQuestionPrefix);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(q.questionText);

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

  const handleSaveEdit = () => {
    if (editText.trim()) {
      editQuestionText(q.id, editText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 flex flex-col gap-4 transition-all hover:shadow-md"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 text-lg">
          <input
            value={q.prefix}
            onChange={(e) => editQuestionPrefix(q.id, e.target.value)}
            className="font-bold text-gray-800 mr-2 w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors"
            placeholder="1."
          />
          {isEditing ? (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[100px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditText(q.questionText);
                    setIsEditing(false);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <span className="text-gray-700 leading-relaxed">{q.questionText}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors text-center w-full"
              aria-label="Edit Question"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => removeQuestion(q.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors text-center w-full"
            aria-label="Delete Question"
          >
            Delete
          </button>
        </div>
      </div>

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
    </div>
  );
};

const BuilderPanel: React.FC = () => {
  const questions = useLabStore((state) => state.questions);

  return (
    <div className="flex flex-col gap-6 p-6">
      <FrontPageEditor />
      {questions.length === 0 ? (
        <div className="text-gray-400 text-center mt-12 text-lg">
          No questions yet. Add one from the left panel.
        </div>
      ) : (
        questions.map((q) => <QuestionCard key={q.id} q={q} />)
      )}
    </div>
  );
};

export default BuilderPanel;
