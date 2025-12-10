import fs from 'fs-extra';
import path from 'path';
import type { MetaData } from './types';

/**
 * Create default metadata for a new piece
 */
export function createDefaultMetadata(originalName: string): MetaData {
  const now = new Date().toISOString();
  const title = originalName.replace(/\.(mid|midi|mxl)$/i, '').replace(/_/g, ' ');

  return {
    originalName,
    title,
    uploadedAt: now,
    tags: [],
    instrument: 'piano',
  };
}

/**
 * Read metadata from a meta.json file
 */
export async function readMetadata(filePath: string): Promise<MetaData | null> {
  try {
    const data = await fs.readJson(filePath);
    // Validate required fields
    if (
      typeof data.originalName === 'string' &&
      typeof data.title === 'string' &&
      typeof data.uploadedAt === 'string' &&
      Array.isArray(data.tags)
    ) {
      return data as MetaData;
    }
    console.error('Invalid metadata format:', filePath);
    return null;
  } catch (error) {
    console.error('Error reading metadata:', filePath, error);
    return null;
  }
}

/**
 * Write metadata to a meta.json file
 */
export async function writeMetadata(filePath: string, metadata: MetaData): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, metadata, { spaces: 2 });
}

/**
 * Update metadata with partial updates
 */
export function updateMetadata(current: MetaData, updates: Partial<MetaData>): MetaData {
  return {
    ...current,
    ...updates,
    tags: updates.tags ?? current.tags,
    instrument: updates.instrument ?? current.instrument,
  };
}