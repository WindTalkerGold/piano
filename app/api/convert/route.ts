import { NextRequest, NextResponse } from 'next/server';
import { getPiece } from '@/lib/storage';
import { convertMidToPdf } from '@/lib/converter';

export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const { pieceId } = await request.json();

    if (!pieceId) {
      return NextResponse.json(
        { success: false, error: 'pieceId is required' },
        { status: 400 }
      );
    }

    const piece = await getPiece(pieceId);
    if (!piece) {
      return NextResponse.json(
        { success: false, error: `Piece ${pieceId} not found` },
        { status: 404 }
      );
    }

    // Re-run conversion
    const conversion = await convertMidToPdf(piece.files.mid, piece.directory, 'score');
    if (!conversion.success) {
      return NextResponse.json(
        { success: false, error: `Conversion failed: ${conversion.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { success: false, error: `Conversion failed: ${error.message}` },
      { status: 500 }
    );
  }
}