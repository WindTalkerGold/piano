import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { getPiece } from '@/lib/storage';

const LIBRARY_PATH = process.env.LIBRARY_PATH || './library';

// Supports URLs like /api/mxl/<pieceId>.mxl and /api/mxl/<pieceId>
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract pieceId from path: last segment, optionally ending with .mxl
    const { pathname } = new URL(request.url);
    // pathname e.g. /api/mxl/1234-uuid.mxl
    const parts = pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    const pieceId = last.toLowerCase().endsWith('.mxl') ? last.slice(0, -4) : last;

    if (!pieceId) {
      return NextResponse.json(
        { error: 'pieceId path parameter is required' },
        { status: 400 }
      );
    }

    const piece = await getPiece(pieceId);
    if (!piece) {
      return NextResponse.json(
        { error: `Piece ${pieceId} not found` },
        { status: 404 }
      );
    }

    // Resolve MXL file path (binary content). Use piece.files.mxl
    const filePath = piece.files.mxl;

    // Security: ensure within library
    const absoluteLibraryPath = path.resolve(LIBRARY_PATH);
    const absoluteFilePath = path.resolve(filePath);
    if (!absoluteFilePath.startsWith(absoluteLibraryPath)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (!(await fs.pathExists(filePath))) {
      return NextResponse.json(
        { error: `File not found: ${path.basename(filePath)}` },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);

    // Return raw binary with explicit MusicXML zip MIME
    const res = new NextResponse(fileBuffer);
    res.headers.set('Content-Type', 'application/vnd.recordare.musicxml+zip');
    res.headers.set('Content-Length', stats.size.toString());

    // No Content-Disposition by default to allow inline/binary consumption.
    // If needed for downloads, clients can still set download behavior.

    // Static-like headers to mirror Next public
    res.headers.set('Accept-Ranges', 'bytes');
    res.headers.set('Cache-Control', 'public, max-age=0, no-transform');
    res.headers.set('Last-Modified', stats.mtime.toUTCString());
    const sizeHex = stats.size.toString(16);
    const mtimeHex = Math.floor(stats.mtimeMs).toString(16);
    res.headers.set('ETag', `W/"${sizeHex}-${mtimeHex}"`);

    return res;
  } catch (error: any) {
    console.error('MXL API error:', error);
    return NextResponse.json(
      { error: `MXL fetch failed: ${error.message}` },
      { status: 500 }
    );
  }
}
