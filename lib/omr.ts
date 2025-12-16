import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'fs-extra';

const execFileAsync = promisify(execFile);

export async function hasAudiveris(): Promise<boolean> {
  const aud = process.env.AUDIVERIS_PATH;
  if (!aud) return false;
  try {
    await fs.access(aud);
    return true;
  } catch {
    return false;
  }
}

export async function convertImageToMxl(
  audiverisPath: string,
  imagePath: string,
  outDir: string,
  timeoutMs: number = 5 * 60 * 1000
): Promise<{ success: boolean; mxlPath?: string; error?: string }> {
  try {
    await fs.ensureDir(outDir);
    const args = ['-batch', '-transcribe', '-export', '-output', outDir, imagePath];
    console.log(`Running Audiveris: ${audiverisPath} ${args.join(' ')}`);
    await execFileAsync(audiverisPath, args, { timeout: timeoutMs, cwd: outDir });

    // Audiveris may create subfolders; search for *.mxl then *.xml under outDir
    const foundMxl = await findFirstByExtensions(outDir, ['.mxl']);
    const foundXml = foundMxl ? undefined : await findFirstByExtensions(outDir, ['.xml']);
    const mxlPath = foundMxl || foundXml;

    if (!mxlPath) {
      return { success: false, error: 'No MusicXML output found from Audiveris' };
    }

    return { success: true, mxlPath };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

async function findFirstByExtensions(rootDir: string, exts: string[]): Promise<string | undefined> {
  // Depth-first search for files with given extensions
  const entries = await fs.readdir(rootDir);
  for (const entry of entries) {
    const full = path.join(rootDir, entry);
    const stat = await fs.stat(full);
    if (stat.isFile()) {
      const ext = path.extname(entry).toLowerCase();
      if (exts.includes(ext)) return full;
    } else if (stat.isDirectory()) {
      const sub = await findFirstByExtensions(full, exts);
      if (sub) return sub;
    }
  }
  return undefined;
}
