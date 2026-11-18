import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useLabStore, LabMetadata, CoursePreset } from '../store';

const BUILT_IN_PRESETS: CoursePreset[] = [
  { id: 'custom', title: '-- Custom / Type Manually --', code: '', faculty: '' },
];

const metadataFields: { key: keyof LabMetadata; label: string; placeholder: string }[] = [
  { key: 'labNumber', label: 'Lab Number', placeholder: 'e.g., 1' },
  { key: 'title', label: 'Lab Title', placeholder: 'e.g., Lab 1: Linux Basics' },
  { key: 'assignmentType', label: 'Assignment Type', placeholder: 'e.g., LAB' },
  { key: 'courseCode', label: 'Course Code', placeholder: 'e.g., 21CSE211' },
  { key: 'courseTitle', label: 'Course Title', placeholder: 'e.g., Operating Systems Lab' },
  { key: 'semester', label: 'Semester', placeholder: 'e.g., 4' },
  { key: 'academicYear', label: 'Academic Year', placeholder: 'e.g., 2025-2026' },
  { key: 'batch', label: 'Batch', placeholder: 'e.g., CSE-A' },
  { key: 'campus', label: 'Campus', placeholder: 'e.g., Amrita School of Computing' },
  { key: 'studentName', label: 'Student Name', placeholder: 'e.g., John Doe' },
  { key: 'rollNumber', label: 'Roll Number', placeholder: 'e.g., CB.EN.U4CSE21001' },
  { key: 'dateOfSubmission', label: 'Date of Submission', placeholder: 'e.g., 2026-06-15' },
  { key: 'coordinatorName', label: 'Coordinator Name', placeholder: 'e.g., Dr. Faculty Name' },
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

  const isDuplicate = customCoursePresets.some(
    (p) => p.title === metadata.courseTitle && p.code === metadata.courseCode && p.faculty === metadata.coordinatorName
  );
  const canSave = metadata.courseTitle.trim().length > 0 && !isDuplicate;

  return (
    <div className="bg-white rounded-[24px] border border-black overflow-hidden mb-4 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-[#f8fafc] transition-colors focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#55db9c] border border-black"></span>
          <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-black">
            Edit Cover Page Details
          </h3>
        </div>
        <span className="w-8 h-8 rounded-full border border-black flex items-center justify-center font-bold text-xs text-black">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-black bg-white space-y-6">
          {/* Custom Logo Upload Card */}
          <div className="p-4 border border-black rounded-[20px] bg-[#dceeff] flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h4 className="text-xs font-bold text-black uppercase tracking-[0.032em] mb-0.5">
                University Logo Asset
              </h4>
              <p className="text-xs text-black/70 mb-3">
                Upload a custom university logo image. Automatically preserved offline.
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full border border-black cursor-pointer hover:bg-neutral-800 transition-colors text-xs font-bold tracking-[0.032em] uppercase">
                <span>📁</span>
                Choose Image
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>

            {metadata.logoUrl && (
              <div className="flex flex-col items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-black pt-3 sm:pt-0 sm:pl-4">
                <img src={metadata.logoUrl} alt="Custom Logo" className="w-24 h-24 object-contain border border-black rounded-[14px] bg-white p-1" />
                <button
                  onClick={resetLogo}
                  className="text-[11px] text-[#fb4903] hover:underline font-bold uppercase tracking-[0.032em] cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            )}
          </div>

          {/* Document Font Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-black uppercase tracking-[0.032em]">
              PDF Typography
            </label>
            <select
              value={metadata.fontFamily || 'Helvetica'}
              onChange={(e) => updateMetadata({ fontFamily: e.target.value as any })}
              className="w-full border border-black rounded-full px-4 py-2.5 text-xs text-black bg-white font-bold uppercase tracking-[0.032em] focus:outline-none cursor-pointer"
            >
              <option value="Helvetica">Helvetica (Standard Clean Sans)</option>
              <option value="Times-Roman">Times-Roman (Formal Serif)</option>
              <option value="Courier">Courier (Monospace Terminal)</option>
            </select>
          </div>

          {/* Quick-Fill Course Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-black uppercase tracking-[0.032em]">
              Quick-Fill Course Preset
            </label>
            <select
              value={selectedPreset}
              onChange={handlePresetChange}
              className="w-full border border-black rounded-full px-4 py-2.5 text-xs text-black bg-white font-bold uppercase tracking-[0.032em] focus:outline-none cursor-pointer"
            >
              <optgroup label="Default Courses">
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

            {selectedPreset.startsWith('custom-') && (
              <button
                onClick={() => {
                  deleteCoursePreset(selectedPreset);
                  setSelectedPreset('custom');
                }}
                className="mt-1 self-start text-[11px] text-[#fb4903] font-bold uppercase tracking-[0.032em] hover:underline cursor-pointer"
              >
                Delete this saved preset
              </button>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {metadataFields.map((field) => {
              if (field.key === 'logoUrl') return null;
              return (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-black uppercase tracking-[0.032em]">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={metadata[field.key] as string}
                    onChange={(e) => updateMetadata({ [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-black rounded-full px-4 py-2 text-xs text-black bg-white font-medium focus:outline-none placeholder:text-black/40"
                  />
                </div>
              );
            })}
          </div>

          {/* Save Preset Button */}
          <div className="pt-2">
            <button
              onClick={handleSavePreset}
              disabled={!canSave}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-[0.032em] uppercase border border-black transition-all ${
                saveStatus === 'saved'
                  ? 'bg-[#55db9c] text-black cursor-default'
                  : canSave
                    ? 'bg-white hover:bg-[#ffd731] text-black cursor-pointer'
                    : 'bg-[#e9e9e9] text-black/40 border-black/30 cursor-not-allowed'
              }`}
            >
              {saveStatus === 'saved' ? '✓ Saved as Course Preset!' : '＋ Save Current Course as Preset'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontPageEditor;
