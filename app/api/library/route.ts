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

    const { pieceId, title, tags } = body as { pieceId?: string; title?: string; tags?: string[] };
    if (!pieceId) {
      return NextResponse.json({ success: false, error: 'pieceId is required' }, { status: 400 });
    }

    const piece = await getPiece(pieceId);
    if (!piece) {
      return NextResponse.json({ success: false, error: `Piece ${pieceId} not found` }, { status: 404 });
    }

    const updates: Partial<Piece['meta']> = {} as any;

    if (typeof title === 'string') {
      const t = title.trim();
      if (t.length === 0) {
        return NextResponse.json({ success: false, error: 'title cannot be empty' }, { status: 400 });
      }
      (updates as any).title = t;
    }

    if (Array.isArray(tags)) {
      // Normalize: trim, remove empties, dedupe
      const normalized = Array.from(new Set(tags.map((x) => (typeof x === 'string' ? x.trim() : '')).filter((x) => x.length > 0)));
      (updates as any).tags = normalized;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    await updateMetadata(pieceId, updates as any);
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