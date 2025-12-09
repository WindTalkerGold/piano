import { NextRequest, NextResponse } from 'next/server';
import { listPieces } from '@/lib/storage';
import type { Piece } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<Piece[] | { error: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    const pieces = await listPieces();

    if (!query) {
      return NextResponse.json(pieces);
    }

    const filtered = pieces.filter(piece =>
      piece.meta.title.toLowerCase().includes(query) ||
      piece.meta.tags.some(tag => tag.toLowerCase().includes(query)) ||
      piece.meta.originalName.toLowerCase().includes(query)
    );

    return NextResponse.json(filtered);

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: `Search failed: ${error.message}` },
      { status: 500 }
    );
  }
}