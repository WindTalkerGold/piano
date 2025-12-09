import { NextRequest, NextResponse } from 'next/server';
import { listPieces, deletePiece, getPiece, updateMetadata } from '@/lib/storage';
import type { Piece } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<Piece[] | { error: string }>> {
  try {
    const pieces = await listPieces();
    return NextResponse.json(pieces);
  } catch (error: any) {
    console.error('Error listing pieces:', error);
    return NextResponse.json(
      { error: `Failed to list pieces: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    const { pieceId, title } = body as { pieceId?: string; title?: string };
    if (!pieceId || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'pieceId and non-empty title are required' }, { status: 400 });
    }
    const piece = await getPiece(pieceId);
    if (!piece) {
      return NextResponse.json({ success: false, error: `Piece ${pieceId} not found` }, { status: 404 });
    }
    // Update metadata title
    await updateMetadata(pieceId, { title: title.trim() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating piece:', error);
    return NextResponse.json({ success: false, error: `Failed to update piece: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pieceId = searchParams.get('pieceId');

    if (!pieceId) {
      return NextResponse.json(
        { success: false, error: 'pieceId parameter is required' },
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

    await deletePiece(pieceId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting piece:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete piece: ${error.message}` },
      { status: 500 }
    );
  }
}