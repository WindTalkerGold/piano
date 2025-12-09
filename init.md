# Project Prompt: Local MIDI to Sheet Music Web Manager (Node.js/TypeScript)

## Project Overview
Create a modern, local-first web application for managing piano sheet music. The core functionality allows users to upload MIDI files, automatically convert them to MXL (MusicXML) and PDF formats using MuseScore's command-line interface, and manage/search their collection. The application is designed to run on a local machine or within a restricted local network.

## Core Functional Requirements

### 1. File Upload & Processing Pipeline
*   **Web Upload Endpoint**: A user-friendly interface (`/upload`) to upload `.mid` files via a web form. Implement basic validation to ensure only MIDI files are accepted.
*   **Automated Two-Stage Conversion**: Upon upload, automatically trigger a conversion process:
    1.  **MIDI → MXL**: Use the MuseScore CLI to convert the uploaded `.mid` file directly to `.mxl` format.
    2.  **MXL → PDF**: Use the MuseScore CLI again to convert the generated `.mxl` file into a high-quality, printable `.pdf` sheet music file.
*   **Process Feedback**: The UI should provide clear feedback (e.g., a loading indicator, success/error messages) during the conversion process, which may take several seconds.

### 2. File Storage & Management
*   **Structured Local Storage**: All files must be saved in a well-organized, dedicated directory (e.g., `./library/`). Use a unique identifier (like a UUID or a timestamp-based hash) for each uploaded piece to create a self-contained folder.
    *   **Example Folder Structure:**
        ```
        ./library/
        ├── a1b2c3d4/          # Unique ID for a piece
        │   ├── original.mid   # The uploaded file
        │   ├── score.mxl      # Generated MXL
        │   ├── score.pdf      # Generated PDF
        │   └── meta.json      # Stores title, upload date, etc.
        └── e5f6g7h8/
        ```
*   **Metadata Management**: For each piece, create and maintain a simple `meta.json` file. This file should store at least the original filename, a user-defined title (defaulting to the original filename), upload timestamp, and any tags for searching.
*   **Library Overview & Search (`/library`)**: A dedicated page that lists all converted pieces. For each piece, display its title, a thumbnail of the first page of the PDF, upload date, and available file formats. Implement a **search/filter bar** that allows users to search by title or tags.

### 3. File Access & Actions
*   **PDF Preview (`/preview/:id`)**: Users can click on a piece in the library to view its PDF directly in the browser using an embedded PDF viewer (e.g., using an `<iframe>` or a library like `react-pdf`).
*   **File Downloads**: Provide clear download buttons/links for both the `.pdf` and `.mxl` files from the library page and the preview page.
*   **Piece Management**: From the library, users should be able to:
    *   **Rename** a piece's title.
    *   **Add or edit tags** for better organization.
    *   **Delete** a piece, which should remove its entire folder from the `./library/` directory.

## Technical Specifications & Stack

*   **Full-Stack Framework**: Use **Next.js (App Router)** with **TypeScript**. This provides a unified project structure, built-in API routes for backend logic, and a modern React-based frontend.
*   **Core Backend Dependencies (API Routes):**
    *   `fs-extra` / `node:fs/promises`: For robust filesystem operations (creating directories, reading/writing files).
    *   `child_process` / `util.promisify`: To asynchronously execute the MuseScore CLI commands.
    *   `busboy` / `formidable` or Next.js built-in methods: For parsing multipart file uploads.
    *   `sharp`: Optional, for generating PDF thumbnails.
*   **Frontend & UI:**
    *   **UI Framework**: Use a modern, lightweight component library like **shadcn/ui**, **NextUI**, or **Tailwind UI** for fast and consistent styling.
    *   **PDF Viewer**: Integrate `react-pdf` or similar to enable high-fidelity PDF previews within the app.
    *   **Icons**: Use `lucide-react` for a clean icon set.
*   **External Tool Dependency**: The application's API routes must invoke the **MuseScore CLI** (e.g., `mscore` on Linux/macOS or `MuseScore4.exe` on Windows). Assume it is installed. The path is fixed to `"C:\Program Files\MuseScore 4\bin\MuseScore4.exe"`.
*   **Storage**: Local filesystem only. No database is required; all metadata is stored as JSON files within the library structure.

## Non-Functional & Development Requirements

*   **Deployment Target**: The primary goal is local development and running on a machine's `localhost`. The architecture should be simple enough to also allow deployment on a home server or within a local area network (LAN) for sharing with family/students on the same network.
*   **Error Handling & Logging**: Implement robust error handling for file operations and MuseScore CLI calls. Log errors and conversion status to the console or a simple log file for debugging.
*   **Configuration**: Use a `.env.local` file for environment-specific configuration (e.g., `LIBRARY_PATH`, `MUSESCORE_PATH`, `MAX_UPLOAD_SIZE`).
*   **Code Quality**: Write clean, well-commented TypeScript code. Use explicit type definitions for all core data structures (e.g., `Piece`, `MetaData`).

## Project Structure
```
midi-library-manager/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── upload/              # POST: Handle file upload & start conversion
│   │   ├── library/             # GET: List all pieces, DELETE: Remove a piece
│   │   ├── convert/             # Internal API for triggering MuseScore
│   │   └── search/              # GET: Search pieces by title/tags
│   ├── library/
│   │   └── page.tsx             # Main library & search page
│   ├── preview/
│   │   └── [id]/
│   │       └── page.tsx         # Dynamic route for PDF preview
│   ├── upload/
│   │   └── page.tsx             # File upload page
│   └── globals.css
├── lib/                          # Core application logic
│   ├── storage.ts               # Functions for filesystem ops (CRUD for pieces)
│   ├── converter.ts             # Functions to call MuseScore CLI (mid->mxl, mxl->pdf)
│   ├── metadata.ts              # Functions to read/write meta.json
│   └── types.ts                 # TypeScript interfaces (Piece, MetaData, etc.)
├── public/                      # Static assets
├── library/                     # MAIN STORAGE DIRECTORY (created at runtime)
├── .env.local                   # Environment variables (MUSESCORE_PATH, etc.)
├── next.config.js
├── package.json
└── README.md                    # Setup & run instructions
```

## User Workflow
1.  **Upload**: User visits `/upload`, selects a `.mid` file, and submits. They see a "Processing..." status.
2.  **Automatic Processing**: The backend saves the file, calls MuseScore twice (mid→mxl→pdf), creates the metadata, and generates a thumbnail.
3.  **Browse**: User is redirected to `/library`, where their new piece appears in the list with others.
4.  **Search & Manage**: User can search by name, click to preview the PDF, download files, or edit the title/tags from the library view.

## Out of Scope / Assumptions
*   **Multi-user & Auth**: The app is designed for single-user or trusted multi-user access in a local setting (e.g., a family). No authentication system is required.
*   **Copyright**: The user is responsible for the rights to the uploaded MIDI files.
*   **Cloud Sync**: This is a local manager. Future cloud backup features would be a separate module.

---
**Final Instruction for AI (Claude Code):**
Based on this prompt, generate a complete, runnable Next.js (App Router) project in TypeScript. Ensure:
1.  All API routes and page components are functionally implemented.
2.  The `lib/` modules contain the core logic for storage, conversion, and metadata.
3.  The UI is clean and usable, built with a specified component library (please choose one, e.g., shadcn/ui).
4.  The generated code includes clear instructions in `README.md` on how to install dependencies (npm install), set up environment variables, and run the development server (npm run dev).


Here are three detailed prompts in English, structured to guide Claude Code in implementing each new functionality within your existing Next.js (Node.js) architecture.

### Prompt 1: Add Direct MXL File Upload Support

**Project Context:**
We are developing a local sheet music manager using Next.js (App Router). The core application already allows users to upload `.mid` files. The backend API uses the local MuseScore CLI to convert the uploaded `.mid` file into both `.mxl` and `.pdf` formats, which are then stored and listed for the user.

**New Feature Requirement:**
Extend the application to allow users to **directly upload `.mxl` files**. Upon upload, the application should automatically convert the `.mxl` file to `.pdf` for preview. Optionally, consider generating a `.mid` file from the `.mxl` for future playback features.

**Technical Specifications & Implementation Details:**

1.  **Frontend Modification (`/app/upload/page.tsx`):**
    *   In the file upload form, modify the `accept` attribute of the file input to include `.mxl` format (e.g., `".mid,.midi,.mxl"`). The UI/UX should remain identical; the user should not notice a difference in backend processing.

2.  **Backend Modification - API Route (`/app/api/upload/route.ts`):**
    *   After parsing the uploaded file, create a logic branch based on the file extension (`.mid` vs. `.mxl`).
    *   **For `.mxl` files:**
        *   **Convert to PDF:** Call the MuseScore CLI to convert the uploaded `.mxl` file directly to a `.pdf` file. The command will be similar to `mscore -o output.pdf input.mxl`.
        *   **(Optional) Convert to MIDI:** Consider adding a second call to MuseScore to also generate a `.mid` file from the `.mxl` (e.g., `mscore -o output.mid input.mxl`). This would populate the library with all three formats.
        *   **File Storage:** Save the original `.mxl`, the generated `.pdf`, and the optional `.mid` file in the same session folder structure used for MIDI uploads.
        *   **Metadata:** Update the `meta.json` for this session to correctly reflect the original file type and the available converted formats.
    *   The success/error response to the frontend should remain consistent.

**Goal:** The `/library` page should list entries from both `.mid` and `.mxl` uploads indistinguishably, each with links to their available formats (.pdf, .mxl, and possibly .mid).

---

### Prompt 2: Integrate MIDI Playback Functionality

**Project Context:**
We have a Next.js sheet music manager where users can upload and store musical scores in various formats (PDF, MXL, MID). We now want to add the ability to **play the audio of the MIDI files directly in the web application**.

**New Feature Requirement:**
Implement a frontend MIDI player that allows users to listen to the music of any score for which a `.mid` file is available.

**Technical Specifications & Implementation Details:**

1.  **Choose & Integrate a MIDI Player Library:**
    *   **Recommendation:** Use `html-midi-player` for its simplicity. Install it: `npm install html-midi-player`.
    *   **Alternative:** If more control is needed, use `midi-player-js` and `soundfont-player` for custom synthesis.

2.  **Frontend Component (`/app/components/MidiPlayer.tsx`):**
    *   Create a new React component for the player.
    *   **For `html-midi-player`:**
        *   Import the necessary styles and define the custom element if needed.
        *   The component should accept a `midiFileUrl` (the public URL or path to the stored `.mid` file) as a prop.
        *   Render the `<midi-player>` and `<midi-visualizer>` web components, binding the `src` attribute to the `midiFileUrl` prop.
    *   **Player Controls:** The library provides a built-in UI with play, pause, and seek controls. Ensure it fits the app's styling.

3.  **Integration into the UI:**
    *   On the library page (`/app/library/page.tsx`), add a "Play" button or icon for each score that has a corresponding `.mid` file.
    *   Clicking this button should open a modal, a drawer, or expand a row to reveal the `MidiPlayer` component with the correct `midiFileUrl` passed to it.
    *   **Critical Browser Policy:** Audio playback **must** be triggered by a direct user gesture (like the "Play" button click). Do not attempt to auto-play.

**Goal:** Users can click "Play" on any score in their library and hear the music played back in the browser.

---

### Prompt 3: Implement a Moving Cursor on PDF Preview Synced to Playback

**Project Context:**
We have a Next.js application that displays sheet music as PDFs (using `react-pdf`) and have now integrated a MIDI player (Feature #2). We want to create an immersive practice experience by **synchronizing a visual cursor on the PDF preview with the playback of the MIDI**.

**New Feature Requirement:**
When a MIDI is playing, a visual indicator (e.g., a moving vertical bar, a highlighted region) must move along the PDF preview in real-time, showing the current position in the score.

**Technical Specifications & Implementation Details:**

1.  **High-Level Strategy (Path B - Proportional Sync):**
    *   This method provides a smooth, visually helpful cursor for practice without needing complex MIDI/MusicXML analysis.
    *   **Core Logic:** `cursorPosition = (currentPlayTime / totalDuration) * totalScoreHeight`.

2.  **Implementation Steps:**

    *   **A. Enhance the MidiPlayer Component:**
        *   Modify the `MidiPlayer` component (from Feature #2) to expose playback events. It needs to emit or provide:
            1.  `totalDuration`: The total length of the MIDI (in seconds).
            2.  `currentTime`: The current playback time (in seconds, updated frequently).
            3.  `playbackState`: Whether it's playing or stopped.

    *   **B. Create a SyncedPdfPreview Component:**
        *   Create a new component that wraps both the `Document`/`Page` from `react-pdf` and the visual cursor.
        *   This component must accept the `pdfFileUrl` and the `currentTime`, `totalDuration`, and `playbackState` from the parent/player.
        *   **Cursor Rendering:** Calculate the cursor's vertical position as a percentage or pixel offset based on the core logic formula. Render the cursor as an absolutely positioned `<div>` (a colored vertical bar) over the PDF page.
        *   **Page Height:** You will need a reference to the PDF page's rendered height to calculate `totalScoreHeight`. Use the `onLoadSuccess` callback of the `Page` component to get its actual rendered dimensions.

    *   **C. Parent Component Integration:**
        *   On the score preview page, place the enhanced `MidiPlayer` and the new `SyncedPdfPreview` component side-by-side or in a suitable layout.
        *   Establish state (`currentTime`, `totalDuration`) in the parent component. Pass callbacks from the player to update this state, and pass the state down to the `SyncedPdfPreview`.
        *   Use `useEffect` hooks to update the cursor position whenever `currentTime` changes.

    *   **D. Styling & UX:**
        *   Style the cursor to be clearly visible (e.g., a semi-transparent red vertical bar).
        *   Consider automatically scrolling the PDF container to keep the cursor in view as it moves.

**Goal:** When a user plays a score, they see a smooth-moving cursor tracking the current position on the sheet music PDF, enhancing the practice and learning experience.

You can provide these prompts individually or together to Claude Code to proceed with the implementation. If you encounter specific issues during development, feel free to ask for further guidance.

