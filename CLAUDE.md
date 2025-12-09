# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Local MIDI to Sheet Music Web Manager** - a local-first web application for piano enthusiasts to upload MIDI files, automatically convert them to sheet music (MXL and PDF formats) using MuseScore CLI, and manage/search their music library. The application is designed to run locally (`localhost`) or on a local network.

**Current State**: The project has been fully implemented according to the specification in `init.md`. It's a working Next.js application with all core features: MIDI upload, MuseScore conversion, library management, PDF preview, and file downloads.

## Current Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router (TypeScript)
- **Language**: TypeScript
- **UI**: React with Tailwind CSS
- **Icons**: Lucide React
- **PDF Viewer**: Native browser PDF viewer (via iframe)
- **Backend**: Next.js API routes with Node.js filesystem operations
- **External Dependency**: MuseScore CLI for MIDI→MXL→PDF conversion
- **File Upload**: FormData API (no formidable due to TypeScript issues)

### Actual Directory Structure
```
piano2/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── upload/              # POST: Handle file upload & conversion
│   │   ├── library/             # GET: List pieces, DELETE: Remove piece
│   │   ├── search/              # GET: Search pieces
│   │   └── download/            # GET: Download files
│   ├── library/                  # Library browsing page
│   ├── preview/[id]/            # PDF preview page (dynamic route)
│   ├── upload/                  # Upload page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (dashboard)
│   └── globals.css             # Global styles
├── components/                   # React components
│   └── Navigation.tsx          # Main navigation component
├── lib/                          # Core application logic
│   ├── storage.ts               # Filesystem operations (createPieceDirectory, etc.)
│   ├── converter.ts             # MuseScore CLI calls (convertMidToPdf)
│   ├── metadata.ts              # meta.json handling (createDefaultMetadata, saveMetadata)
│   └── types.ts                 # TypeScript interfaces (Piece, MetaData, UploadResult, etc.)
├── public/                       # Static assets (Next.js default icons)
├── library/                      # MAIN STORAGE (created at runtime, gitignored)
├── .env.local.example           # Environment variables template
├── .gitignore                   # Git ignore patterns
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── postcss.config.mjs           # PostCSS configuration
├── package.json                 # Dependencies and scripts
├── README.md                    # Project documentation
├── README.en.md                 # English documentation
├── init.md                      # Original project specification
└── CLAUDE.md                    # This file
```

### Core Architectural Patterns
1. **Local-first architecture**: All data stored in local filesystem, no database
2. **File-based metadata**: JSON files (`meta.json`) instead of database records
3. **UUID-based organization**: Each piece gets unique folder with all related files
4. **Two-stage conversion pipeline**: MIDI → MXL → PDF using MuseScore CLI
5. **Serverless API routes**: Next.js API routes for backend logic

## Development Commands

The project is fully implemented and builds successfully. Available commands:

- `npm install` - Install dependencies (already done during setup)
- `npm run dev` - Start development server (runs on `localhost:3000`)
- `npm run build` - Create production build (verified working)
- `npm start` - Start production server
- `npm run lint` - Run Next.js linting

## Environment Configuration

Key environment variables (to be set in `.env.local`):
- `MUSESCORE_PATH`: Path to MuseScore CLI executable (default: `"C:\Program Files\MuseScore 4\bin\MuseScore4.exe"` on Windows)
- `LIBRARY_PATH`: Path to library storage directory (default: `./library/`)
- `MAX_UPLOAD_SIZE`: Maximum file upload size

## File Storage Structure

The application uses a structured filesystem approach:
```
./library/
├── {uuid}/          # Unique ID for each piece
│   ├── original.mid # Uploaded MIDI file
│   ├── score.mxl    # Generated MXL (MusicXML)
│   ├── score.pdf    # Generated PDF sheet music
│   └── meta.json    # Metadata (title, upload date, tags)
└── ...
```

## Important Implementation Notes

1. **MuseScore CLI Integration**: Implemented using `child_process.execFile` in `lib/converter.ts`. Error handling includes timeout management and cleanup on failure.

2. **File Upload Processing**: Implemented using FormData API in `app/api/upload/route.ts`. Originally planned to use `formidable`, but switched to FormData due to TypeScript module declaration issues.

3. **TypeScript Interfaces**: Fully defined in `lib/types.ts` including `Piece`, `MetaData`, `UploadResult`, `ConversionResult`, etc.

4. **Error Handling**: Robust error handling implemented across all API routes with try-catch blocks, proper HTTP status codes, and filesystem cleanup on failures.

5. **No Authentication**: Designed for single-user/local network use - no auth system required.

6. **PDF Preview vs Download**: The `/api/download` endpoint uses a `download` query parameter to control Content-Disposition:
   - `download=true`: Forces attachment (download) for all file types
   - `download=false` or omitted for PDF: Uses `inline` for PDF preview in iframe
   - MXL and MIDI files always use `attachment` unless `download=false` (but still download due to browser handling)
   - Preview page uses iframe with `download=false`, download buttons use `download=true`

7. **Full-Screen PDF Preview**: The preview page includes a full-screen mode with:
   - Full-screen toggle button in the PDF preview section
   - Modal overlay covering entire viewport with dedicated controls
   - ESC key support to exit full-screen
   - Header with piece title and exit buttons
   - Footer with download links and keyboard shortcut hint
   - Responsive design using Tailwind CSS fixed positioning

## Next Steps and Testing

The project is fully implemented and ready for testing. To use the application:

1. **Configure MuseScore**: Create `.env.local` from `.env.local.example` and set the correct `MUSESCORE_PATH` for your operating system.

2. **Test Upload Functionality**: Run `npm run dev`, navigate to `/upload`, and upload a MIDI file to test the conversion pipeline.

3. **Verify Library Management**: Check `/library` to see uploaded pieces and search functionality.

4. **Test PDF Preview**: Click on any piece in the library to preview the generated PDF.

**Important Testing Notes**:
- The application requires MuseScore 4+ installed with CLI support
- File upload uses FormData API (not formidable due to TypeScript issues)
- All files are stored locally in the `./library/` directory (gitignored)
- The build has been verified to complete successfully
- **Local network access**: The dev server is configured to listen on `0.0.0.0` (all interfaces). To access from other devices on the same network:
  - Find your computer's local IP address
  - Access via `http://[YOUR_IP]:3000` from other devices
  - Ensure firewall allows port 3000

Refer to `init.md` for the original project specification and `README.md` for user documentation.