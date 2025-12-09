import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Piece, MetaData } from './types';

const LIBRARY_PATH = process.env.LIBRARY_PATH || './library';

/**
 * Ensure library directory exists
 */
export async function ensureLibraryDir(): Promise<void> {
  await fs.ensureDir(LIBRARY_PATH);
}

/**
 * Get absolute path within library
 */
export function getLibraryPath(...segments: string[]): string {
  return path.join(LIBRARY_PATH, ...segments);
}

/**
 * Create a new piece directory structure
 */
export async function createPieceDirectory(): Promise<{ id: string; dir: string }> {
  await ensureLibraryDir();
  const id = uuidv4();
  const dir = getLibraryPath(id);
  await fs.ensureDir(dir);
  return { id, dir };
}

/**
 * Save metadata for a piece
 */
export async function saveMetadata(pieceId: string, meta: MetaData): Promise<void> {
  const metaPath = getLibraryPath(pieceId, 'meta.json');
  await fs.writeJson(metaPath, meta, { spaces: 2 });
}

/**
 * Load metadata for a piece
 */
export async function loadMetadata(pieceId: string): Promise<MetaData | null> {
  const metaPath = getLibraryPath(pieceId, 'meta.json');
  try {
    return await fs.readJson(metaPath);
  } catch (error) {
    return null;
  }
}

/**
 * List all pieces in the library
 */
export async function listPieces(): Promise<Piece[]> {
  await ensureLibraryDir();
  const items = await fs.readdir(LIBRARY_PATH, { withFileTypes: true });
  const pieces: Piece[] = [];

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const pieceId = item.name;
    const dir = getLibraryPath(pieceId);

    try {
      const meta = await loadMetadata(pieceId);
      if (!meta) continue;

      const piece: Piece = {
        id: pieceId,
        directory: dir,
        meta,
        files: {
          mid: path.join(dir, 'original.mid'),
          mxl: path.join(dir, 'score.mxl'),
          pdf: path.join(dir, 'score.pdf'),
        },
      };

      // Check if thumbnail exists
      const thumbnailPath = path.join(dir, 'thumbnail.jpg');
      if (await fs.pathExists(thumbnailPath)) {
        piece.files.thumbnail = thumbnailPath;
      }

      pieces.push(piece);
    } catch (error) {
      console.error(`Error loading piece ${pieceId}:`, error);
    }
  }

  return pieces.sort((a, b) =>
    new Date(b.meta.uploadedAt).getTime() - new Date(a.meta.uploadedAt).getTime()
  );
}

/**
 * Delete a piece and its directory
 */
export async function deletePiece(pieceId: string): Promise<void> {
  const dir = getLibraryPath(pieceId);
  if (await fs.pathExists(dir)) {
    await fs.remove(dir);
  }
}

/**
 * Get piece by ID
 */
export async function getPiece(pieceId: string): Promise<Piece | null> {
  const dir = getLibraryPath(pieceId);
  if (!(await fs.pathExists(dir))) {
    return null;
  }

  const meta = await loadMetadata(pieceId);
  if (!meta) return null;

  const piece: Piece = {
    id: pieceId,
    directory: dir,
    meta,
    files: {
      mid: path.join(dir, 'original.mid'),
      mxl: path.join(dir, 'score.mxl'),
      pdf: path.join(dir, 'score.pdf'),
    },
  };

  const thumbnailPath = path.join(dir, 'thumbnail.jpg');
  if (await fs.pathExists(thumbnailPath)) {
    piece.files.thumbnail = thumbnailPath;
  }

  return piece;
}

/**
 * Update piece metadata
 */
export async function updateMetadata(pieceId: string, updates: Partial<MetaData>): Promise<MetaData> {
  const current = await loadMetadata(pieceId);
  if (!current) {
    throw new Error(`Piece ${pieceId} not found`);
  }

  const updated = { ...current, ...updates };
  await saveMetadata(pieceId, updated);
  return updated;
}