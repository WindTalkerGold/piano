'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Music, FileText, Calendar, Download, Trash2, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import type { Piece } from '@/lib/types';

export default function LibraryPage() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [filteredPieces, setFilteredPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchPieces();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPieces(pieces);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = pieces.filter(piece =>
        piece.meta.title.toLowerCase().includes(query) ||
        piece.meta.originalName.toLowerCase().includes(query) ||
        piece.meta.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredPieces(filtered);
    }
  }, [pieces, searchQuery]);

  const fetchPieces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/library');
      if (response.ok) {
        const data = await response.json();
        setPieces(data);
        setFilteredPieces(data);
      }
    } catch (error) {
      console.error('Failed to fetch pieces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pieceId: string) => {
    setDeleteResult(null);
    try {
      const response = await fetch(`/api/library?pieceId=${pieceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setPieces(pieces.filter(p => p.id !== pieceId));
        setDeleteConfirm(null);
        setDeleteResult({
          success: true,
          message: 'Piece deleted successfully.',
        });
      } else {
        const result = await response.json();
        setDeleteResult({
          success: false,
          message: `Delete failed: ${result.error}`,
        });
      }
    } catch (error: any) {
      setDeleteResult({
        success: false,
        message: `Delete failed: ${error.message}`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Music Library</h1>
          <p className="mt-2 text-gray-600">
            Browse and manage your sheet music collection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/upload"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Upload New
          </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, filename, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            Total: {pieces.length} pieces
          </span>
          {searchQuery && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              Found: {filteredPieces.length} matches
            </span>
          )}
        </div>
      </div>

      {deleteResult && (
        <div
          className={`rounded-lg border p-4 ${
            deleteResult.success
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {deleteResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <div>
              <p className="font-medium">{deleteResult.message}</p>
            </div>
          </div>
        </div>
      )}

      {filteredPieces.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
          <Music className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">
            {searchQuery ? 'No matching pieces found' : 'Your library is empty'}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchQuery
              ? 'Try a different search term'
              : 'Upload your first MIDI file to get started'}
          </p>
          {!searchQuery && (
            <Link
              href="/upload"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Upload First Piece
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPieces.map((piece) => (
            <div
              key={piece.id}
              className="rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {piece.meta.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {piece.meta.originalName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDeleteConfirm(piece.id)}
                      className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {deleteConfirm === piece.id && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-800">
                      Delete this piece?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleDelete(piece.id)}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded {formatDate(piece.meta.uploadedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Music className="h-4 w-4" />
                    <span>MIDI • MXL • PDF</span>
                  </div>
                  {piece.meta.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {piece.meta.tags.map((tag) => (
                        <button
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                          onClick={() => setSearchQuery(tag)}
                          title={`Filter by tag: ${tag}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <Link
                    href={`/preview/${piece.id}`}
                    className="flex-1 rounded-lg bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Eye className="mx-auto mb-1 h-4 w-4" />
                    Preview
                  </Link>
                  <a
                    href={`/api/download?pieceId=${piece.id}&type=pdf&download=true`}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                    download
                  >
                    <Download className="mx-auto mb-1 h-4 w-4" />
                    PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}