import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import type { ConversionResult } from './types';

const execFileAsync = promisify(execFile);

function normalizePath(pathStr: string): string {
  // Remove surrounding quotes (single or double)
  return pathStr.replace(/^['"]|['"]$/g, '').trim();
}

const MUSESCORE_PATH = normalizePath(
  process.env.MUSESCORE_PATH ||
  (process.platform === 'win32'
    ? '"C:\\Program Files\\MuseScore 4\\bin\\MuseScore4.exe"'
    : 'mscore')
);

/**
 * Convert MIDI file to MXL using MuseScore CLI
 */
export async function convertMidToMxl(inputPath: string, outputPath: string): Promise<ConversionResult> {
  try {
    await fs.ensureDir(path.dirname(outputPath));

    console.log(`Executing: ${MUSESCORE_PATH} "${inputPath}" -o "${outputPath}"`);
    const { stdout, stderr } = await execFileAsync(MUSESCORE_PATH, [inputPath, '-o', outputPath]);

    if (stderr) {
      console.warn('MuseScore stderr:', stderr);
    }

    if (await fs.pathExists(outputPath)) {
      return { success: true, outputPath };
    } else {
      return {
        success: false,
        error: `Conversion failed: output file not created. stdout: ${stdout}, stderr: ${stderr}`
      };
    }
  } catch (error: any) {
    console.error('MIDI to MXL conversion error:', error);
    return {
      success: false,
      error: `Conversion failed: ${error.message}`
    };
  }
}

/**
 * Convert MXL file to PDF using MuseScore CLI
 */
export async function convertMxlToPdf(inputPath: string, outputPath: string): Promise<ConversionResult> {
  try {
    await fs.ensureDir(path.dirname(outputPath));

    console.log(`Executing: ${MUSESCORE_PATH} "${inputPath}" -o "${outputPath}"`);
    const { stdout, stderr } = await execFileAsync(MUSESCORE_PATH, [inputPath, '-o', outputPath]);

    if (stderr) {
      console.warn('MuseScore stderr:', stderr);
    }

    if (await fs.pathExists(outputPath)) {
      return { success: true, outputPath };
    } else {
      return {
        success: false,
        error: `Conversion failed: output file not created. stdout: ${stdout}, stderr: ${stderr}`
      };
    }
  } catch (error: any) {
    console.error('MXL to PDF conversion error:', error);
    return {
      success: false,
      error: `Conversion failed: ${error.message}`
    };
  }
}

/**
 * Convert MXL file to MIDI using MuseScore CLI
 */
export async function convertMxlToMid(inputPath: string, outputPath: string): Promise<ConversionResult> {
  try {
    await fs.ensureDir(path.dirname(outputPath));

    console.log(`Executing: ${MUSESCORE_PATH} "${inputPath}" -o "${outputPath}"`);
    const { stdout, stderr } = await execFileAsync(MUSESCORE_PATH, [inputPath, '-o', outputPath]);

    if (stderr) {
      console.warn('MuseScore stderr:', stderr);
    }

    if (await fs.pathExists(outputPath)) {
      return { success: true, outputPath };
    } else {
      return {
        success: false,
        error: `Conversion failed: output file not created. stdout: ${stdout}, stderr: ${stderr}`
      };
    }
  } catch (error: any) {
    console.error('MXL to MIDI conversion error:', error);
    return {
      success: false,
      error: `Conversion failed: ${error.message}`
    };
  }
}

/**
 * Two-stage conversion: MIDI → MXL → PDF
 */
export async function convertMidToPdf(
  midiPath: string,
  outputDir: string,
  baseName: string = 'score'
): Promise<{ mxlPath: string; pdfPath: string; success: boolean; error?: string }> {
  const mxlPath = path.join(outputDir, `${baseName}.mxl`);
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);

  // Step 1: MIDI → MXL
  const mxlResult = await convertMidToMxl(midiPath, mxlPath);
  if (!mxlResult.success) {
    return { mxlPath, pdfPath, success: false, error: `MXL conversion failed: ${mxlResult.error}` };
  }

  // Step 2: MXL → PDF
  const pdfResult = await convertMxlToPdf(mxlPath, pdfPath);
  if (!pdfResult.success) {
    return { mxlPath, pdfPath, success: false, error: `PDF conversion failed: ${pdfResult.error}` };
  }

  return { mxlPath, pdfPath, success: true };
}

/**
 * Convert MXL file to PDF and optionally MIDI
 */
export async function convertMxlToPdfAndMid(
  mxlPath: string,
  outputDir: string,
  baseName: string = 'score',
  generateMid: boolean = true
): Promise<{ pdfPath: string; midPath?: string; success: boolean; error?: string }> {
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);
  const midPath = generateMid ? path.join(outputDir, `${baseName}.mid`) : undefined;

  // Step 1: MXL → PDF
  const pdfResult = await convertMxlToPdf(mxlPath, pdfPath);
  if (!pdfResult.success) {
    return { pdfPath, midPath, success: false, error: `PDF conversion failed: ${pdfResult.error}` };
  }

  // Step 2: MXL → MIDI (optional)
  if (generateMid && midPath) {
    const midResult = await convertMxlToMid(mxlPath, midPath);
    if (!midResult.success) {
      // Don't fail the whole conversion if MIDI generation fails, just log it
      console.warn(`MIDI generation failed: ${midResult.error}`);
      // Continue without MIDI file
    } else {
      return { pdfPath, midPath, success: true };
    }
  }

  return { pdfPath, midPath, success: true };
}

/**
 * Generate thumbnail from PDF (optional - using sharp)
 */
export async function generateThumbnail(
  pdfPath: string,
  outputPath: string,
  width: number = 300
): Promise<boolean> {
  try {
    // This is a placeholder - actual implementation would require PDF to image conversion
    // For now, we'll skip thumbnail generation unless sharp is configured for image processing
    console.log('Thumbnail generation not implemented - requires PDF to image conversion library');
    return false;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return false;
  }
}