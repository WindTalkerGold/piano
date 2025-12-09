import Link from 'next/link';
import { Upload, Library, Music, FileText, Download } from 'lucide-react';
import { listPieces } from '@/lib/storage';

export default async function HomePage() {
  const pieces = await listPieces();
  const totalPieces = pieces.length;
  const recentPieces = pieces.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <Music className="h-12 w-12" />
          <div>
            <h1 className="text-3xl font-bold">Welcome to MIDI Library Manager</h1>
            <p className="mt-2 text-blue-100">
              Upload MIDI files, convert to sheet music, and manage your local library
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Music className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pieces</p>
              <p className="text-3xl font-bold">{totalPieces}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Files Generated</p>
              <p className="text-3xl font-bold">{totalPieces * 2}</p>
              <p className="text-xs text-gray-400">MXL + PDF files</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-purple-100 p-3">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Library Size</p>
              <p className="text-3xl font-bold">~{totalPieces * 5} MB</p>
              <p className="text-xs text-gray-400">Estimated</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              href="/upload"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              <Upload className="h-5 w-5" />
              <div>
                <p className="font-medium">Upload MIDI File</p>
                <p className="text-sm text-gray-500">Convert MIDI to sheet music</p>
              </div>
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-green-50 hover:text-green-700"
            >
              <Library className="h-5 w-5" />
              <div>
                <p className="font-medium">Browse Library</p>
                <p className="text-sm text-gray-500">View and manage your pieces</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Recent Pieces</h2>
          {recentPieces.length > 0 ? (
            <div className="space-y-3">
              {recentPieces.map((piece) => (
                <div
                  key={piece.id}
                  className="rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{piece.meta.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(piece.meta.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/preview/${piece.id}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium hover:bg-gray-200"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">No pieces yet. Upload your first MIDI file!</p>
            </div>
          )}
          {totalPieces > 3 && (
            <div className="mt-4 text-center">
              <Link
                href="/library"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all pieces →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
