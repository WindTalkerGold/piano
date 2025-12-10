# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Core commands (Next.js + TypeScript):
- npm install — Install dependencies
- npm run dev — Start dev server (binds to 0.0.0.0)
- npm run build — Production build
- npm start — Start production server (binds to 0.0.0.0)
- npm run lint — Next.js linting

Notes:
- No unit/integration test framework is configured. Do not assume Jest/Vitest exists. If tests are added later, document single-test run commands here.
- Dev/prod servers are accessible on LAN due to 0.0.0.0 binding; ensure firewall allows port 3000.

## Environment Configuration

Create .env.local and set:
- MUSESCORE_PATH — Path to MuseScore CLI (e.g., "C:\\Program Files\\MuseScore 4\\bin\\MuseScore4.exe" on Windows)
- LIBRARY_PATH — Local library directory (default ./library/)
- MAX_UPLOAD_SIZE — Upload size limit

If an .env.local.example is added, mirror these keys.

## High-Level Architecture

Local-first web app that converts uploaded MIDI/MXL into sheet music (MusicXML + PDF) using MuseScore CLI and manages a filesystem-backed library.

- Framework: Next.js App Router (TypeScript)
- UI: React + Tailwind CSS
- Storage: Local filesystem only; each piece stored under a UUID directory containing original file(s), generated score files, and meta.json
- Conversion: MuseScore CLI invoked via child_process.execFile; pipeline supports MIDI→MXL→PDF and MXL→PDF
- Backend: Serverless API routes under app/api/* performing filesystem and conversion operations
- Preview/Playback: PDF preview page; MIDI/MXL playback integrations via OSMD-related scripts (see layout and public assets)

## Code Structure (big picture)

Focus areas for navigation and modifications:
- app/
  - api/: Upload, download, library listing/deletion, search, and auxiliary endpoints (e.g., reconversion, direct MXL serving)
  - pages: upload (form + client logic), library (browsing/search), preview/[id] (PDF viewing)
  - layout.tsx: Global layout, styles, and player scripts loading
- components/:
  - Navigation.tsx and PDF viewing components (if present)
- lib/:
  - storage.ts: Filesystem helpers (createPieceDirectory, file path helpers, deletion)
  - converter.ts: MuseScore CLI calls and orchestration
  - metadata.ts: meta.json creation, reading, updating
  - types.ts: Shared interfaces (Piece, MetaData, UploadResult, ConversionResult, etc.)
- public/: Static assets and vendor scripts for music playback/testing
- library/: Runtime storage (gitignored). Per-piece directories hold original and generated files + meta.json

## Important Behaviors and Conventions

- Metadata: meta.json is the single source for piece metadata; avoid adding a database layer
- UUID folders: One folder per piece; keep all related files together (original.mid/original.mxl, score.mxl, score.pdf, meta.json)
- Error handling: API routes use try/catch with appropriate HTTP status codes; converter includes timeout management and cleanup on failure
- Download vs preview:
  - /api/download uses a download query param to set Content-Disposition
  - PDF can be served inline for iframe preview; MIDI/MXL typically download (browser-dependent)
- Network accessibility: 0.0.0.0 binding intended for local network usage

## Known Endpoints (documented + observed)

- POST /api/upload — Handle file upload and trigger conversion (MIDI or MXL)
- GET/DELETE /api/library — List pieces, delete a piece
- GET /api/search — Search by metadata
- GET /api/download — Download files (supports download=true for attachment)
- (If present) POST /api/convert — Re-run conversion for an existing piece
- (If present) GET /api/mxl/[[...slug]] — Serve MXL files directly

When adding or updating endpoints, align with local-first and file-based metadata principles.

## Tailwind and Styling

- Tailwind CSS is configured via globals.css and Next.js PostCSS integration. Tailwind v4 or new postcss adapter may be in use — check imports in app/globals.css and presence of @tailwindcss/postcss. There may be no tailwind.config.js/postcss.config files if using v4 defaults.

## Playback/Preview Integration

- layout.tsx may load html-midi-player, opensheetmusicdisplay, and osmd-audio-player (a minified vendor script may exist under public/vendor)
- public may include midi-visualizer-test.html and other demos/test assets
- PDF preview is implemented via a dedicated page (preview/[id]); rendering may use native iframe or a component (e.g., react-pdf). Verify current usage in app/preview/[id]/page.tsx and components/PDFViewer.tsx if present.

## Implementation Guidance for Future Changes

- Prefer editing existing files over adding new ones. Keep improvements minimal and focused.
- Maintain the two-stage conversion pipeline and UUID directory structure.
- Validate only at system boundaries (user input, external tools); trust internal code paths.
- Avoid introducing authentication or remote data stores; this is a single-user local-first app.
- Be mindful of OS-specific paths (Windows MuseScore path) and process execution.

## Quick Pointers

- To add new metadata fields: update lib/types.ts and lib/metadata.ts, then adjust API responses and UI pages that consume metadata
- To modify conversion: update lib/converter.ts and ensure API routes invoking it handle errors/timeouts consistently
- To add a new file type: extend storage.ts paths, converter.ts handling, and download/preview logic accordingly

Refer to README.md and init.md for user-facing details. Keep this file concise and focused on how Claude Code should work within this repository.

## Dev practice

After you (Claude Code) create a feature and accepted by me, I will ask you to commit and push it. Then I will create PR and get it merged to main branch. Then, you should
1. Check out to main branch
2. pull latest
3. delete previous dev branch
4. create a new branch to continue development (ask me about the branch name)