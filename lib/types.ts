export interface MetaData {
  /** Original filename */
  originalName: string;
  /** User-defined title (defaults to original filename) */
  title: string;
  /** Upload timestamp (ISO string) */
  uploadedAt: string;
  /** Tags for searching */
  tags: string[];
  /** Playback instrument (per piece) */
  instrument?: 'piano' | 'violin' | 'guitar' | 'flute' | 'drums';
  /** Optional description */
  description?: string;
}

export interface Piece {
  /** Unique identifier (UUID) */
  id: string;
  /** Path to the piece directory */
  directory: string;
  /** Metadata */
  meta: MetaData;
  /** File paths */
  files: {
    /** Original MIDI file */
    mid: string;
    /** Generated MXL file */
    mxl: string;
    /** Generated PDF file */
    pdf: string;
    /** Thumbnail image (optional) */
    thumbnail?: string;
  };
}

export interface UploadResult {
  success: boolean;
  pieceId?: string;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export interface LibraryStats {
  totalPieces: number;
  totalSize: number;
  lastUpload?: string;
}