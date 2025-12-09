import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { createPieceDirectory, saveMetadata } from '@/lib/storage';
import { convertMidToPdf, convertMxlToPdfAndMid } from '@/lib/converter';
import { createDefaultMetadata } from '@/lib/metadata';
import { UploadResult } from '@/lib/types';

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

export async function POST(request: NextRequest): Promise<NextResponse<UploadResult>> {
  try {
    const { fields, files } = await parseForm(request);

    const midiFile = files.midi;
    if (!midiFile) {
      return NextResponse.json(
        { success: false, error: 'No MIDI file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = midiFile.name.toLowerCase();
    if (!fileName.endsWith('.mid') &&
        !fileName.endsWith('.midi') &&
        !fileName.endsWith('.mxl')) {
      return NextResponse.json(
        { success: false, error: 'File must be a MIDI file (.mid, .midi) or MXL file (.mxl)' },
        { status: 400 }
      );
    }

    // Create piece directory
    const { id: pieceId, dir: pieceDir } = await createPieceDirectory();

    // Determine file type and save original file
    const isMidi = fileName.endsWith('.mid') || fileName.endsWith('.midi');
    const isMxl = fileName.endsWith('.mxl');

    const originalFileName = isMidi ? 'original.mid' : 'original.mxl';
    const originalFilePath = path.join(pieceDir, originalFileName);
    const arrayBuffer = await midiFile.arrayBuffer();
    await fs.writeFile(originalFilePath, Buffer.from(arrayBuffer));

    let conversion;
    if (isMidi) {
      // Convert MIDI to PDF (via MXL)
      conversion = await convertMidToPdf(originalFilePath, pieceDir, 'score');
    } else if (isMxl) {
      // Convert MXL to PDF and optionally to MIDI
      conversion = await convertMxlToPdfAndMid(originalFilePath, pieceDir, 'score', true);
    } else {
      // Should not happen due to validation above
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    if (!conversion.success) {
      // Clean up on conversion failure
      await fs.remove(pieceDir).catch(console.error);
      return NextResponse.json(
        { success: false, error: `Conversion failed: ${conversion.error}` },
        { status: 500 }
      );
    }

    // Ensure proper file naming for library compatibility
    if (isMxl) {
      // For MXL uploads, copy original.mxl to score.mxl for download API
      const originalMxlPath = path.join(pieceDir, 'original.mxl');
      const scoreMxlPath = path.join(pieceDir, 'score.mxl');
      if (await fs.pathExists(originalMxlPath)) {
        await fs.copyFile(originalMxlPath, scoreMxlPath);
      }

      // If MIDI was generated (score.mid), rename to original.mid for consistency
      if ((conversion as any).midPath && await fs.pathExists((conversion as any).midPath)) {
        const originalMidPath = path.join(pieceDir, 'original.mid');
        await fs.move((conversion as any).midPath, originalMidPath, { overwrite: true });
      }
    } else if (isMidi) {
      // For MIDI uploads, ensure original.mid exists (it should)
      // No extra steps needed as converter creates score.mxl and score.pdf
    }

    // Create and save metadata
    const metadata = createDefaultMetadata(midiFile.name);
    await saveMetadata(pieceId, metadata);

    return NextResponse.json({
      success: true,
      pieceId,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}