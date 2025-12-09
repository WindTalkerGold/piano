# MIDI Library Manager

A local-first web application for piano enthusiasts to upload MIDI or MXL files, automatically convert them to sheet music (MXL and PDF formats) using MuseScore CLI, and manage/search their music library.

## Features

- **MIDI/MXL Upload**: Web interface for uploading `.mid`/`.midi` or `.mxl` files
- **Automatic Conversion**: Convert MIDI → MXL → PDF or MXL → PDF (and optionally MIDI) using MuseScore CLI
- **Library Management**: Browse, search, and organize your sheet music collection
- **PDF Preview**: View sheet music directly in the browser
- **File Downloads**: Download PDF and MXL files
- **Local Storage**: All files stored locally with JSON metadata
- **No Database**: File-based storage, no external dependencies

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Formidable** for file upload parsing
- **fs-extra** for filesystem operations
- **MuseScore CLI** for MIDI conversion

## Prerequisites

1. **Node.js** 18+ and npm
2. **MuseScore** installed on your system
   - Windows: Install MuseScore 4 from [musescore.org](https://musescore.org)
   - Linux: `sudo apt install musescore` or similar
   - macOS: `brew install musescore` or download from website

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd midi-library-manager
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your MuseScore path
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## Configuration

### Environment Variables

Create `.env.local` file with the following:

```env
# MuseScore CLI executable path
MUSESCORE_PATH="C:\Program Files\MuseScore 4\bin\MuseScore4.exe"  # Windows
# MUSESCORE_PATH="mscore"  # Linux/macOS

# Library storage directory (relative to project root)
LIBRARY_PATH="./library"

# Maximum upload size in bytes (default: 50MB)
MAX_UPLOAD_SIZE=52428800
```

### MuseScore Path Examples

- **Windows**: `"C:\Program Files\MuseScore 4\bin\MuseScore4.exe"`
- **Linux**: `"mscore"`
- **macOS**: `"/Applications/MuseScore 4.app/Contents/MacOS/mscore"`

## Project Structure

```
midi-library-manager/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (upload, library, search, download)
│   ├── upload/            # Upload page
│   ├── library/           # Library page
│   ├── preview/[id]/      # PDF preview page
│   └── components/        # React components
├── lib/                   # Core application logic
│   ├── storage.ts        # Filesystem operations
│   ├── converter.ts      # MuseScore CLI calls
│   ├── metadata.ts       # meta.json handling
│   └── types.ts          # TypeScript interfaces
├── library/              # Storage directory (created at runtime)
├── public/               # Static assets
└── ...config files
```

## Usage

### Uploading MIDI/MXL Files

1. Navigate to `/upload`
2. Drag & drop or select a `.mid`/`.midi` or `.mxl` file
3. Click "Upload & Convert"
4. System will:
   - Save the uploaded file (MIDI or MXL)
   - If MIDI file, convert to MXL using MuseScore
   - Convert MXL to PDF using MuseScore
   - Optionally convert MXL to MIDI
   - Create metadata file
   - Redirect to library

### Browsing Library

- View all pieces at `/library`
- Search by title, filename, or tags
- Click any piece to preview PDF
- Download PDF/MXL files
- Delete pieces

### Previewing Sheet Music

- Click any piece in the library
- PDF preview loads in browser
- Download buttons for PDF and MXL

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint (if configured)

### File Storage

Each piece gets a unique folder in `./library/`:
```
library/
├── {uuid}/
│   ├── original.mid      # Uploaded MIDI file
│   ├── score.mxl        # Generated MXL (MusicXML)
│   ├── score.pdf        # Generated PDF sheet music
│   └── meta.json        # Metadata (title, date, tags)
```

### API Endpoints

- `POST /api/upload` - Upload and convert MIDI file
- `GET /api/library` - List all pieces
- `DELETE /api/library?pieceId={id}` - Delete a piece
- `GET /api/search?q={query}` - Search pieces
- `GET /api/download?pieceId={id}&type={pdf|mxl|mid}` - Download files

## Troubleshooting

### MuseScore Issues

1. **Command not found**: Ensure MuseScore is installed and path is correct in `.env.local`
2. **Conversion fails**: Check MuseScore version supports CLI conversion
3. **Permission errors**: Ensure MuseScore executable has execute permissions

### File Upload Issues

1. **Upload fails**: Check file size limit (`MAX_UPLOAD_SIZE`)
2. **Wrong file type**: Only `.mid`/`.midi` files accepted
3. **Storage full**: Ensure disk space available

## Local Network Access

The application can be accessed from other devices on your local network (e.g., Android tablet, phone, other computers).

### Setup Instructions

1. **Start the development server** (already configured to listen on all network interfaces):
   ```bash
   npm run dev
   ```

2. **Find your computer's local IP address**:
   - **Windows**: Run `ipconfig` in Command Prompt and look for "IPv4 Address"
   - **macOS/Linux**: Run `ifconfig` or `ip addr` and look for your network interface IP

3. **Access from other devices**:
   - Open a web browser on your Android tablet/other device
   - Navigate to `http://[YOUR_LOCAL_IP]:3000` (replace `[YOUR_LOCAL_IP]` with your actual IP)
   - Example: `http://192.168.1.100:3000`

### Important Notes

- **Firewall**: Ensure your firewall allows incoming connections on port 3000
- **Port Configuration**: Change port by setting `PORT` environment variable (e.g., `PORT=8080 npm run dev`)
- **Network**: All devices must be on the same local network (same WiFi)
- **Production**: For permanent access, consider building and running in production mode with `npm run build && npm start`

## License

MIT

## Acknowledgements

- [MuseScore](https://musescore.org) for the excellent music notation software
- [Next.js](https://nextjs.org) for the React framework
- [Tailwind CSS](https://tailwindcss.com) for styling