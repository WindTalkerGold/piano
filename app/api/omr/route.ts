import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { createPieceDirectory, saveMetadata } from '@/lib/storage';
import { createDefaultMetadata } from '@/lib/metadata';
import { convertMxlToPdfAndMid } from '@/lib/converter';
import { convertImageToMxl } from '@/lib/omr';

export const runtime = 'nodejs';

async function parseForm(request: NextRequest): Promise<{ fields: any; files: any }> {
  const formData = await request.formData();
  const files: Record<string, File> = {};
  const fields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value;
    } else {
      fields[key] = value as string;
    }
  }

  return { fields, files };
}

export async function POST(request: NextRequest) {
  try {
    const audiverisPath = process.env.AUDIVERIS_PATH;
    if (!audiverisPath) {
      return NextResponse.json(
        { success: false, error: 'Audiveris is not configured. Set AUDIVERIS_PATH in .env.local.' },
        { status: 400 }
      );
    }

    const { files } = await parseForm(request);
    const imageFile = files.image;
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    const fileName = imageFile.name.toLowerCase();
    const isPng = fileName.endsWith('.png');
    const isJpg = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    if (!isPng && !isJpg) {
      return NextResponse.json(
        { success: false, error: 'File must be an image (.png, .jpg)' },
        { status: 400 }
      );
    }

    const { id: pieceId, dir: pieceDirRel } = await createPieceDirectory();
    const pieceDir = path.resolve(pieceDirRel);

    const originalName = isPng ? 'original.png' : 'original.jpg';
    const originalPath = path.join(pieceDir, originalName);
    const arrayBuffer = await imageFile.arrayBuffer();
    await fs.ensureDir(pieceDir);
    await fs.writeFile(originalPath, Buffer.from(arrayBuffer));

    const omr = await convertImageToMxl(path.resolve(audiverisPath), path.resolve(originalPath), pieceDir);
    if (!omr.success || !omr.mxlPath) {
      await fs.remove(pieceDir).catch(() => {});
      return NextResponse.json(
        { success: false, error: `OMR conversion failed: ${omr.error || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Ensure score file exists in pieceDir
    const ext = path.extname(omr.mxlPath).toLowerCase();
    const scoreMxlPath = path.join(pieceDir, 'score.mxl');
    const scoreXmlPath = path.join(pieceDir, 'score.xml');

    if (ext === '.xml') {
      if (path.resolve(omr.mxlPath) !== path.resolve(scoreXmlPath)) {
        await fs.copy(omr.mxlPath, scoreXmlPath);
      }
    } else {
      if (path.resolve(omr.mxlPath) !== path.resolve(scoreMxlPath)) {
        await fs.copy(omr.mxlPath, scoreMxlPath);
      }
      const originalMxlPath = path.join(pieceDir, 'original.mxl');
      if (path.resolve(omr.mxlPath) !== path.resolve(originalMxlPath)) {
        await fs.copy(omr.mxlPath, originalMxlPath);
      }
    }

    // If MuseScore is available, convert to PDF and MIDI
    const hasMuse = !!process.env.MUSESCORE_PATH;
    if (hasMuse) {
      const inputForMuse = (await fs.pathExists(scoreMxlPath)) ? scoreMxlPath : (await fs.pathExists(scoreXmlPath)) ? scoreXmlPath : undefined;
      if (inputForMuse) {
        const conv = await convertMxlToPdfAndMid(inputForMuse, pieceDir, 'score', true);
        if (!conv.success) {
          // Do not delete piece; keep MXL/XML and report PDF/MIDI failure
          console.warn('MuseScore conversion failed:', conv.error);
        }
      }
    }

    const metadata = createDefaultMetadata(imageFile.name);
    await saveMetadata(pieceId, metadata);

    return NextResponse.json({ success: true, pieceId });
  } catch (error: any) {
    console.error('OMR upload error:', error);
    return NextResponse.json(
      { success: false, error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
