import { create } from 'zustand';
import { db, DBQuestion } from './db';

export interface LabMetadata {
  campus: string;
  assignmentType: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  semester: string;
  academicYear: string;
  batch: string;
  studentName: string;
  rollNumber: string;
  dateOfSubmission: string;
  coordinatorName: string;
  logoUrl: string | null;
}

export interface LabQuestion {
  id: string;
  prefix: string;
  questionText: string;
  screenshotUrl: string | null;
  type?: 'question' | 'subheading';
}

export interface LabState {
  metadata: LabMetadata;
  questions: LabQuestion[];
  isInitialized: boolean;
  isSetupComplete: boolean;
  completeSetup: () => void;
  initializeStore: () => Promise<void>;
  updateMetadata: (fields: Partial<LabMetadata>) => void;
  addQuestion: (text: string, prefix?: string) => void;
  removeQuestion: (id: string) => void;
  editQuestionText: (id: string, newText: string) => void;
  editQuestionPrefix: (id: string, newPrefix: string) => void;
  attachScreenshot: (id: string, file: Blob) => void;
  removeScreenshot: (id: string) => void;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  resetWorkspace: () => void;
  updateLogo: (file: Blob) => void;
  resetLogo: () => void;
  addBlankQuestion: () => void;
  addSubheading: () => void;
  moveQuestion: (id: string, direction: 'up' | 'down') => void;
}

const getNextPrefix = (questions: LabQuestion[]): string => {
  if (questions.length === 0) return '1.';
  const lastQ = questions[questions.length - 1];
  if (lastQ.type === 'subheading') return '1.';

  const match = lastQ.prefix.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return lastQ.prefix.replace(/\d+/, String(num + 1));
  }
  return 'Q.';
};

const defaultMetadata: LabMetadata = {
  campus: "",
  assignmentType: "",
  title: "",
  courseCode: "",
  courseTitle: "",
  semester: "",
  academicYear: "",
  batch: "",
  studentName: "",
  rollNumber: "",
  dateOfSubmission: "",
  coordinatorName: "",
  logoUrl: null,
};

export const useLabStore = create<LabState>((set, get) => ({
  metadata: defaultMetadata,
  questions: [],
  isInitialized: false,
  isSetupComplete: false,
  completeSetup: () => set({ isSetupComplete: true }),
  pdfFile: null,

  setPdfFile: (file) => set({ pdfFile: file }),

  resetWorkspace: () => {
    set((state) => {
      // Clear questions from IndexedDB
      db.questions.clear().catch(console.error);

      // Revoke object URLs to prevent memory leaks
      state.questions.forEach((q) => {
        if (q.screenshotUrl) URL.revokeObjectURL(q.screenshotUrl);
      });

      return { questions: [], pdfFile: null };
    });
  },

  initializeStore: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    try {
      // Load metadata
      const dbMetadata = await db.metadata.get(1);
      const initialMetadata = dbMetadata ? { ...dbMetadata } : defaultMetadata;
      if (dbMetadata) delete (initialMetadata as any).id;

      if (dbMetadata && dbMetadata.logoBlob) {
        initialMetadata.logoUrl = URL.createObjectURL(dbMetadata.logoBlob);
      } else {
        initialMetadata.logoUrl = null;
      }

      // Load questions
      const dbQuestions = await db.questions.orderBy('order').toArray();
      const initialQuestions: LabQuestion[] = dbQuestions.map((q) => ({
        id: q.id,
        prefix: q.prefix || String(q.order) + ".",
        questionText: q.questionText,
        screenshotUrl: q.imageBlob ? URL.createObjectURL(q.imageBlob) : null,
        type: q.type || 'question',
      }));

      set({
        metadata: initialMetadata as LabMetadata,
        questions: initialQuestions,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to initialize store from DB:", error);
      // Fallback to defaults
      set({ isInitialized: true });
    }
  },

  updateMetadata: (fields) => {
    set((state) => {
      const newMetadata = { ...state.metadata, ...fields };
      // Save to Dexie asynchronously
      db.metadata.put({ ...newMetadata, id: 1 }).catch(console.error);
      return { metadata: newMetadata };
    });
  },

  updateLogo: (file) => {
    set((state) => {
      const url = URL.createObjectURL(file);

      if (state.metadata.logoUrl) {
        URL.revokeObjectURL(state.metadata.logoUrl);
      }

      const newMetadata = { ...state.metadata, logoUrl: url };

      // Update Dexie asynchronously
      db.metadata.update(1, { logoBlob: file }).catch(console.error);

      return { metadata: newMetadata };
    });
  },

  resetLogo: () => {
    set((state) => {
      if (state.metadata.logoUrl) {
        URL.revokeObjectURL(state.metadata.logoUrl);
      }
      const newMetadata = { ...state.metadata, logoUrl: null };

      // Update Dexie asynchronously
      db.metadata.update(1, { logoBlob: null }).catch(console.error);

      return { metadata: newMetadata };
    });
  },

  addQuestion: (text, customPrefix) => {
    set((state) => {
      const order = state.questions.length + 1;
      const newQuestion: LabQuestion = {
        id: crypto.randomUUID(),
        prefix: customPrefix || getNextPrefix(state.questions),
        questionText: text,
        screenshotUrl: null,
        type: 'question',
      };

      const newDbQuestion: DBQuestion = {
        id: newQuestion.id,
        order: order,
        prefix: newQuestion.prefix,
        questionText: newQuestion.questionText,
        imageBlob: null,
        type: 'question',
      };

      db.questions.put(newDbQuestion).catch(console.error);

      return {
        questions: [...state.questions, newQuestion],
      };
    });
  },

  addBlankQuestion: () => {
    set((state) => {
      const order = state.questions.length + 1;
      const newQuestion: LabQuestion = {
        id: crypto.randomUUID(),
        prefix: getNextPrefix(state.questions),
        questionText: '',
        screenshotUrl: null,
        type: 'question',
      };

      const newDbQuestion: DBQuestion = {
        id: newQuestion.id,
        order: order,
        prefix: newQuestion.prefix,
        questionText: newQuestion.questionText,
        imageBlob: null,
        type: 'question',
      };

      db.questions.put(newDbQuestion).catch(console.error);

      return {
        questions: [...state.questions, newQuestion],
      };
    });
  },

  addSubheading: () => {
    set((state) => {
      const order = state.questions.length + 1;
      const newQuestion: LabQuestion = {
        id: crypto.randomUUID(),
        prefix: '',
        questionText: 'New Section',
        screenshotUrl: null,
        type: 'subheading',
      };

      const newDbQuestion: DBQuestion = {
        id: newQuestion.id,
        order: order,
        prefix: newQuestion.prefix,
        questionText: newQuestion.questionText,
        imageBlob: null,
        type: 'subheading',
      };

      db.questions.put(newDbQuestion).catch(console.error);

      return {
        questions: [...state.questions, newQuestion],
      };
    });
  },

  moveQuestion: (id, direction) => {
    set((state) => {
      const index = state.questions.findIndex((q) => q.id === id);
      if (index === -1) return state;
      if (direction === 'up' && index === 0) return state;
      if (direction === 'down' && index === state.questions.length - 1) return state;

      const newQuestions = [...state.questions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      // Swap
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

      // Update Dexie
      db.transaction('rw', db.questions, async () => {
        const promises = newQuestions.map(async (q, idx) => {
          const dbQ = await db.questions.get(q.id);
          if (dbQ) {
            await db.questions.update(q.id, { order: idx + 1 });
          }
        });
        await Promise.all(promises);
      }).catch(console.error);

      return { questions: newQuestions };
    });
  },

  removeQuestion: (id) => {
    set((state) => {
      const filteredQuestions = state.questions.filter((q) => q.id !== id);

      // Update Dexie
      db.transaction('rw', db.questions, async () => {
        await db.questions.delete(id);

        const promises = filteredQuestions.map(async (q, index) => {
          const dbQ = await db.questions.get(q.id);
          if (dbQ) {
            await db.questions.update(q.id, { order: index + 1 });
          }
        });
        await Promise.all(promises);
      }).catch(console.error);

      return {
        questions: filteredQuestions,
      };
    });
  },

  editQuestionText: (id, newText) => {
    set((state) => {
      // Update Dexie asynchronously
      db.questions.update(id, { questionText: newText }).catch(console.error);

      return {
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, questionText: newText } : q
        ),
      };
    });
  },

  editQuestionPrefix: (id, newPrefix) => {
    set((state) => {
      // Update Dexie asynchronously
      db.questions.update(id, { prefix: newPrefix }).catch(console.error);

      return {
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, prefix: newPrefix } : q
        ),
      };
    });
  },

  attachScreenshot: (id, file) => {
    set((state) => {
      // Generate local URL for immediate UI update
      const url = URL.createObjectURL(file);

      // Update Dexie asynchronously
      db.questions.update(id, { imageBlob: file }).catch(console.error);

      return {
        questions: state.questions.map((q) => {
          if (q.id === id) {
            // Revoke old URL to prevent memory leaks
            if (q.screenshotUrl) URL.revokeObjectURL(q.screenshotUrl);
            return { ...q, screenshotUrl: url };
          }
          return q;
        }),
      };
    });
  },

  removeScreenshot: (id) => {
    set((state) => {
      db.questions.update(id, { imageBlob: null }).catch(console.error);

      return {
        questions: state.questions.map((q) => {
          if (q.id === id) {
            if (q.screenshotUrl) URL.revokeObjectURL(q.screenshotUrl);
            return { ...q, screenshotUrl: null };
          }
          return q;
        }),
      };
    });
  },
}));
