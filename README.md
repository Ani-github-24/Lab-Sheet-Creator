# 📄 Lab Sheet Creator

**A local-first, zero-friction document compiler designed to automate the creation of university lab records.**

## The Problem

Computer Science students spend hours every semester manually copying questions from lab sheet PDFs, taking terminal screenshots, and fighting with Microsoft Word formatting (especially erratic page breaks) to compile their submission records. It is a tedious, purely administrative task that consumes valuable time.

## The Solution

LabSheet Automator is a privacy-focused, client-side web application that eliminates this friction. By intercepting OS-level clipboard events and utilizing a native document compilation engine, students can build perfectly formatted, university-grade A4 PDFs in a fraction of the time.

## Key Features

* **Smart PDF Text Extraction & Regex Parsing:** Built-in PDF reader with a Notion-style floating tooltip. Highlight a block of text, and the app automatically parses numbered lists (e.g., 1., 2., 3.) and splits them into distinct interactive workspace cards.
* **Frictionless Clipboard Interception:** No more saving and uploading image files. Click a designated drop-zone and press `Ctrl+V` to instantly extract and inject terminal screenshots from your OS clipboard directly into the UI.
* **Block-Based Document Architecture:** Structure your lab sheets like a pro. Add distinct "Subheading" blocks (e.g., "Part A: Networking") that automatically reset the numbering sequence for subsequent questions.
* **Automated PDF Compilation:** Utilizes a strict layout engine (`@react-pdf/renderer`) that calculates A4 dimensions and automatically handles page breaks. A question and its accompanying screenshot will *never* be awkwardly sliced in half across two pages.
* **100% Local & Offline Persistent:** Zero server costs and total privacy. The app uses the browser's native **IndexedDB** (via Dexie.js) to store high-resolution image blobs and state locally. You never lose your work on a page refresh, even without Wi-Fi.
* **Dynamic University Templates:** Features a "Setup Gatekeeper" to ensure mandatory cover page metadata (Student Name, Roll Number, Course Code) is filled out. It also supports uploading custom university logos (saved locally as binary blobs) to match strict campus submission guidelines.

## Technical Architecture & Stack

* **Frontend Framework:** React (Vite) + TypeScript
* **State Management:** Zustand (providing a single source of truth mapped across the UI and the PDF engine)
* **Styling:** Tailwind CSS
* **Document Engine:** `@react-pdf/renderer` (Declarative PDF rendering ensuring flawless physical layouts)
* **Local Database:** Dexie.js (IndexedDB wrapper for safe, heavy image blob storage)
* **PDF Parsing:** `pdfjs-dist` (Mozilla's PDF engine for text-layer extraction)

## Engineering Highlights

Instead of taking the standard "Print to PDF" approach (which converts the HTML DOM to a canvas and frequently breaks layouts), this project utilizes a dual-layer architecture. The Zustand state feeds two completely separate trees:

1. **The Interactive Web DOM** — For the drag-and-drop user workspace.
2. **A Hidden, Declarative `<Document>` Tree** — Programs the physical A4 layout using strict `wrap={false}` constraints to guarantee unsplittable content blocks and precise alignment.

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/lab-sheet-creator.git
```

### 2. Install Dependencies

```bash
cd lab-sheet-creator
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

## 🌐 Live Deployment

This project is fully static and can be hosted for free on GitHub Pages or Vercel.

To deploy via GitHub Pages:

```bash
npm run deploy
```

## 📌 Future Improvements

* Drag-and-drop question reordering
* Multiple university template presets
* OCR support for extracting text directly from screenshots
* Import/export workspace backups
* Collaborative editing mode
* AI-assisted question categorization

---

Built to save time and sanity. If this tool helped you survive a midnight lab submission, consider starring the repository.
