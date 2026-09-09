import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useLabStore, LabMetadata, CoursePreset } from '../store';

const BUILT_IN_PRESETS: CoursePreset[] = [
  { id: 'custom', title: '-- Custom / Type Manually --', code: '', faculty: '' },
];

const metadataFields: { key: keyof LabMetadata; label: string; placeholder: string }[] = [
  { key: 'labNumber', label: 'Lab Number', placeholder: 'e.g., 1' },
  { key: 'title', label: 'Lab Title', placeholder: 'e.g., Lab 1: Linux Basics' },
  { key: 'assignmentType', label: 'Assignment Type', placeholder: 'e.g., ASSIGNMENT' },
  { key: 'courseCode', label: 'Course Code', placeholder: 'e.g., CS201' },
  { key: 'courseTitle', label: 'Course Title', placeholder: 'e.g., Linux Administration Lab' },
  { key: 'semester', label: 'Semester', placeholder: 'e.g., 4' },
  { key: 'academicYear', label: 'Academic Year', placeholder: 'e.g., 2025-2026' },
  { key: 'batch', label: 'Batch', placeholder: 'e.g., CSE' },
  { key: 'campus', label: 'Campus', placeholder: 'e.g., Nagercoil Campus' },
  { key: 'studentName', label: 'Student Name', placeholder: 'e.g., John Doe' },
  { key: 'rollNumber', label: 'Roll Number', placeholder: 'e.g., CB.EN.U4CSE20000' },
  { key: 'dateOfSubmission', label: 'Date of Submission', placeholder: 'e.g., 2026-06-10' },
  { key: 'coordinatorName', label: 'Coordinator Name', placeholder: 'e.g., Professor Name' },
];

interface FrontPageEditorProps {
  initiallyOpen?: boolean;
}

const FrontPageEditor: React.FC<FrontPageEditorProps> = ({ initiallyOpen = false }) => {
  const metadata = useLabStore((state) => state.metadata);
  const updateMetadata = useLabStore((state) => state.updateMetadata);
  const updateLogo = useLabStore((state) => state.updateLogo);
  const resetLogo = useLabStore((state) => state.resetLogo);
  const customCoursePresets = useLabStore((state) => state.customCoursePresets);
  const saveCoursePreset = useLabStore((state) => state.saveCoursePreset);
  const deleteCoursePreset = useLabStore((state) => state.deleteCoursePreset);

  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Merge built-in and custom presets into a single lookup
  const allPresets = [...BUILT_IN_PRESETS, ...customCoursePresets];

  // Clear the "Saved!" feedback after 2 seconds
  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    setSelectedPreset(presetId);

    if (presetId === 'custom') return;

    const preset = allPresets.find((p) => p.id === presetId);
    if (preset) {
      updateMetadata({
        courseTitle: preset.title,
        courseCode: preset.code,
        coordinatorName: preset.faculty,
      });
    }
  };

  const handleSavePreset = useCallback(() => {
    if (!metadata.courseTitle.trim()) return;
    saveCoursePreset({
      title: metadata.courseTitle,
      code: metadata.courseCode,
      faculty: metadata.coordinatorName,
    });
    setSaveStatus('saved');
  }, [metadata.courseTitle, metadata.courseCode, metadata.coordinatorName, saveCoursePreset]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      updateLogo(file);
    }
  };

  const canSave = metadata.courseTitle.trim().length > 0;

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden mb-6 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <h3 className="text-xl font-extrabold text-gray-800">Edit Cover Page Details</h3>
        <svg
          className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="mb-8 p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center gap-6">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-800 mb-1">Custom University Logo</h4>
              <p className="text-xs text-gray-500 mb-4">Upload a custom logo to replace the default asset. Will persist offline.</p>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose Image
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>

            {metadata.logoUrl && (
              <div className="flex flex-col items-center gap-2 border-l border-gray-200 pl-6">
                <img src={metadata.logoUrl} alt="Custom Logo" className="w-32 h-32 object-contain border border-gray-300 rounded-md bg-white p-1" />
                <button
                  onClick={resetLogo}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold underline"
                >
                  Reset to Default
                </button>
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Document Font</label>
            <select
              value={metadata.fontFamily || 'Helvetica'}
              onChange={(e) => updateMetadata({ fontFamily: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            >
              <option value="Helvetica">Helvetica (Standard Sans-Serif)</option>
              <option value="Times-Roman">Times-Roman (Formal Serif)</option>
              <option value="Courier">Courier (Monospace)</option>
            </select>
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Quick-Fill Course</label>
            <select
              value={selectedPreset}
              onChange={handlePresetChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            >
              <optgroup label="Built-in Courses">
                {BUILT_IN_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.title}
                  </option>
                ))}
              </optgroup>
              {customCoursePresets.length > 0 && (
                <optgroup label="Your Saved Courses">
                  {customCoursePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.title} ({preset.code})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select a course to auto-fill Course Title, Course Code, and Coordinator Name.</p>

            {/* Delete button for the currently selected custom preset */}
            {selectedPreset.startsWith('custom-') && (
              <button
                onClick={() => {
                  deleteCoursePreset(selectedPreset);
                  setSelectedPreset('custom');
                }}
                className="mt-1 self-start inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete this saved preset
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metadataFields.map((field) => {
              if (field.key === 'logoUrl') return null;
              return (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                  <input
                    type="text"
                    value={metadata[field.key] as string}
                    onChange={(e) => updateMetadata({ [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* Save as New Course Preset button */}
          <div className="mt-5">
            <button
              onClick={handleSavePreset}
              disabled={!canSave}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                saveStatus === 'saved'
                  ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                  : canSave
                    ? 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved! ✓
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Save as New Course Preset
                </>
              )}
            </button>
            {!canSave && (
              <p className="text-xs text-gray-400 mt-1">Enter a Course Title first to save a preset.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontPageEditor;

