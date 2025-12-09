import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { getPiece } from '@/lib/storage';

const LIBRARY_PATH = process.env.LIBRARY_PATH || './library';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pieceId = searchParams.get('pieceId');
    const fileType = searchParams.get('type');
    const downloadParam = searchParams.get('download');

    if (!pieceId || !fileType) {
      return NextResponse.json(
        { error: 'pieceId and type parameters are required' },
        { status: 400 }
      );
    }

    // Validate fileType
    const validTypes = ['pdf', 'mxl', 'mid'];
    if (!validTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get piece to verify existence and get file paths
    const piece = await getPiece(pieceId);
    if (!piece) {
      return NextResponse.json(
        { error: `Piece ${pieceId} not found` },
        { status: 404 }
      );
    }

    // Determine file path based on type
    let filePath: string;
    switch (fileType) {
      case 'pdf':
        filePath = piece.files.pdf;
        break;
      case 'mxl':
        filePath = piece.files.mxl;
        break;
      case 'mid':
        filePath = piece.files.mid;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        );
    }

    // Security check: ensure file is within library directory
    const absoluteLibraryPath = path.resolve(LIBRARY_PATH);
    const absoluteFilePath = path.resolve(filePath);
    if (!absoluteFilePath.startsWith(absoluteLibraryPath)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      return NextResponse.json(
        { error: `File not found: ${path.basename(filePath)}` },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const fileStats = await fs.stat(filePath);

    // Determine content type
    const contentType = {
      pdf: 'application/pdf',
      mxl: 'application/vnd.recordare.musicxml+xml',
      mid: 'audio/midi',
    }[fileType];

    // Determine content disposition
    let contentDisposition: string;
    if (downloadParam === 'true') {
      // Force download for all file types when explicitly requested
      contentDisposition = `attachment; filename="${path.basename(filePath)}"`;
    } else if (fileType === 'pdf') {
      // PDF files should be displayed inline for preview
      contentDisposition = `inline; filename="${path.basename(filePath)}"`;
    } else {
      // MXL and MIDI files should always be downloaded
      contentDisposition = `attachment; filename="${path.basename(filePath)}"`;
    }

    // Create response with file
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Length', fileStats.size.toString());
    response.headers.set('Content-Disposition', contentDisposition);
    // Allow embedding in iframes from same origin
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Modern alternative to X-Frame-Options
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");

    return response;

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: `Download failed: ${error.message}` },
      { status: 500 }
    );
  }
}