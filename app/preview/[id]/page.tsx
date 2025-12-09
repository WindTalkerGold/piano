'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Music, Calendar, Tag, Maximize2, Minimize2, X } from 'lucide-react';
import Link from 'next/link';
// import PDFViewer from '@/components/PDFViewer';
import type { Piece } from '@/lib/types';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const pieceId = params.id as string;

  const [piece, setPiece] = useState<Piece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const osmdRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPiece();
  }, [pieceId]);

  // Handle ESC key to exit full-screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Detect mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const userAgentLower = userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgentLower);
    setIsMobile(isMobileDevice);

    // Detect Android specifically
    const isAndroidDevice = /android/i.test(userAgentLower);
    setIsAndroid(isAndroidDevice);

    // Log for debugging (remove in production)
    console.log('User Agent:', userAgent);
    console.log('Is Mobile:', isMobileDevice);
    console.log('Is Android:', isAndroidDevice);
  }, []);

  const fetchPiece = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/library`);
      if (response.ok) {
        const pieces: Piece[] = await response.json();
        const foundPiece = pieces.find(p => p.id === pieceId);
        if (foundPiece) {
          setPiece(foundPiece);
        } else {
          setError('Piece not found');
        }
      } else {
        setError('Failed to load piece');
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize OSMD and audio controls
  useEffect(() => {
    if (!pieceId) return;

    let cancelled = false;

    const tryInit = () => {
      const container = osmdRef.current;
      if (!container) {
        // Retry on next frame until container is mounted
        if (!cancelled) requestAnimationFrame(tryInit);
        return;
      }

      // @ts-ignore
      const OSMD = (window as any).opensheetmusicdisplay?.OpenSheetMusicDisplay;
      // @ts-ignore
      const OsmdAudioPlayer = (window as any).OsmdAudioPlayer;
      if (!OSMD) {
        console.error('OSMD script not loaded');
        return;
      }

      const osmd = new OSMD(container, {
        autoResize: true,
        drawTitle: true,
        drawComposer: true,
        cursor: { enabled: true },
        backend: 'canvas',
      });

      let audioPlayer: any;
      const tempoRange = document.getElementById('tempoRange') as HTMLInputElement | null;
      const tempoValue = document.getElementById('tempoValue');
      const playBtn = document.getElementById('playBtn');
      const pauseBtn = document.getElementById('pauseBtn');
      const stopBtn = document.getElementById('stopBtn');

      const setEnabled = (play: boolean, pause: boolean, stop: boolean) => {
        if (playBtn) playBtn.toggleAttribute('disabled', !play);
        if (pauseBtn) pauseBtn.toggleAttribute('disabled', !pause);
        if (stopBtn) stopBtn.toggleAttribute('disabled', !stop);
      };

      const SCORE_URL = `/api/mxl/${encodeURIComponent(pieceId)}.mxl`;

      (async () => {
        try {
          await osmd.load(SCORE_URL);
        } catch (e) {
          // Fallback: fetch as ArrayBuffer and convert to binary string
          try {
            const resp = await fetch(SCORE_URL);
            const buf = await resp.arrayBuffer();
            // Prefer TextDecoder latin1 for binary-safe string
            const bin = new TextDecoder('latin1').decode(new Uint8Array(buf));
            await osmd.load(bin);
          } catch (err) {
            console.error('Failed to load score:', err);
            setError('Failed to load score');
            return;
          }
        }

        await osmd.render();
        osmd.cursor.show();
        osmd.cursor.reset();
        setEnabled(true, false, false);

        if (OsmdAudioPlayer) {
          audioPlayer = new OsmdAudioPlayer();
          // Preload score into audio player so Play works immediately
          if (typeof audioPlayer.loadScore === 'function') {
            try {
              await audioPlayer.loadScore(osmd);
            } catch (e) {
              console.error('Audio player failed to load score:', e);
            }
          }
        }

        if (tempoRange && tempoValue) {
          tempoRange.addEventListener('input', () => {
            const bpm = parseInt(tempoRange.value, 10);
            tempoValue.textContent = `${bpm} BPM`;
            if (audioPlayer && typeof audioPlayer.setTempo === 'function') {
              audioPlayer.setTempo(bpm);
            }
          });
        }

        if (playBtn) {
          playBtn.addEventListener('click', async () => {
            try {
              if (!audioPlayer) {
                audioPlayer = new OsmdAudioPlayer();
                if (typeof audioPlayer.loadScore === 'function') {
                  await audioPlayer.loadScore(osmd);
                }
              }
              // Resume context if suspended
              if (audioPlayer.context && audioPlayer.context.state === 'suspended') {
                await audioPlayer.context.resume();
              }
              const bpm = tempoRange ? parseInt(tempoRange.value, 10) : 120;
              if (typeof audioPlayer.setTempo === 'function') audioPlayer.setTempo(bpm);
              // Ensure cursor is visible and follows playback
              try {
                if (typeof osmd.cursor.show === 'function') osmd.cursor.show();
                // Some versions of OsmdAudioPlayer expose cursor helpers
                if (audioPlayer && typeof (audioPlayer as any).enableCursor === 'function') {
                  (audioPlayer as any).enableCursor(true);
                }
                if (audioPlayer && (audioPlayer as any).cursor && typeof (audioPlayer as any).cursor.show === 'function') {
                  (audioPlayer as any).cursor.show();
                }
              } catch {}

              await audioPlayer.play();
              setEnabled(false, true, true);
            } catch (err) {
              console.error('Play failed:', err);
            }
          });
        }

        if (pauseBtn) {
          pauseBtn.addEventListener('click', async () => {
            try {
              await audioPlayer.pause();
              setEnabled(true, false, true);
            } catch (err) { console.error(err); }
          });
        }

        if (stopBtn) {
          stopBtn.addEventListener('click', async () => {
            try {
              await audioPlayer.stop();
              osmd.cursor.reset();
              setEnabled(true, false, false);
            } catch (err) { console.error(err); }
          });
        }
      })();
    };

    requestAnimationFrame(tryInit);

    return () => { cancelled = true; };
  }, [pieceId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading piece...</p>
        </div>
      </div>
    );
  }

  if (error || !piece) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-red-800">Piece Not Found</h2>
        <p className="mt-2 text-red-600">{error || 'The requested piece does not exist.'}</p>
        <Link
          href="/library"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{piece.meta.title}</h1>
          <p className="mt-2 text-gray-600">Original: {piece.meta.originalName}</p>
        </div>
        {/* Removed top download buttons; downloads will be via File Formats tags */}
      </div>

      {/* Top wide sheet music section */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sheet Music</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullScreen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Full screen preview"
            >
              <Maximize2 className="h-4 w-4" />
              Full Screen
            </button>
          </div>
        </div>
        <div className="h-[700px] rounded-lg border relative">
          <div ref={osmdRef} className="h-full overflow-auto"></div>
        </div>
        <div className="mt-4 flex items-center gap-3 relative z-10">
          <label htmlFor="tempoRange" className="text-sm text-gray-700">Tempo</label>
          <input id="tempoRange" type="range" min="30" max="240" defaultValue="120" />
          <span id="tempoValue" className="text-sm text-gray-500">120 BPM</span>
          <button id="playBtn" className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Play</button>
          <button id="pauseBtn" className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300" disabled>Pause</button>
          <button id="stopBtn" className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300" disabled>Stop</button>
        </div>
      </div>

      {/* Bottom row with three info cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Piece Details</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Upload Date</p>
                <p className="text-sm text-gray-500">{formatDate(piece.meta.uploadedAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">File Formats</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <a
                    href={`/api/download?pieceId=${pieceId}&type=mid&download=true`}
                    className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                    download
                  >
                    MIDI
                  </a>
                  <a
                    href={`/api/mxl/${encodeURIComponent(pieceId)}.mxl`}
                    className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                    download
                  >
                    MXL
                  </a>
                  <a
                    href={`/api/download?pieceId=${pieceId}&type=pdf&download=true`}
                    className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
                    download
                  >
                    PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Tags</h2>
          {piece.meta.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {piece.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  <Tag className="mr-1 inline h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tags added yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-yellow-800">Management</h2>
          <p className="mb-4 text-sm text-yellow-700">
            This piece is stored locally in your library directory.
          </p>

          {/* Rename form */}
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-100 p-3">
            <label className="block text-sm font-medium text-yellow-900 mb-1">Edit Title</label>
            <div className="flex gap-2">
              <input
                id="renameTitleInput"
                defaultValue={piece.meta.title}
                className="flex-1 rounded border border-yellow-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={async () => {
                  const input = document.getElementById('renameTitleInput') as HTMLInputElement | null;
                  const newTitle = input?.value.trim() || '';
                  if (!newTitle || newTitle === piece.meta.title) return;
                  const res = await fetch('/api/library', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pieceId: pieceId, title: newTitle })
                  });
                  if (res.ok) {
                    // Optimistically update UI
                    setPiece({ ...piece, meta: { ...piece.meta, title: newTitle } });
                    alert('Title updated');
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(`Rename failed: ${data.error || res.statusText}`);
                  }
                }}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this piece? This action cannot be undone.')) {
                fetch(`/api/library?pieceId=${pieceId}`, {
                  method: 'DELETE',
                }).then(() => {
                  router.push('/library');
                });
              }
            }}
            className="w-full rounded-lg border border-red-300 bg-white py-2 font-medium text-red-600 hover:bg-red-50"
          >
            Delete Piece
          </button>
        </div>
      </div>

      {/* Full-screen Sheet Music Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header with controls */}
          <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {piece?.meta.title || 'Sheet Music'}
              </h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                Full Screen
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullScreen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                title="Exit full screen (ESC)"
              >
                <Minimize2 className="h-4 w-4" />
                Exit Full Screen
              </button>
              <button
                onClick={() => setIsFullScreen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* OSMD Container */}
          <div className="flex-1 overflow-hidden">
            <div ref={osmdRef} className="h-full"></div>
          </div>

          {/* Footer with info */}
          <div className="border-t bg-gray-50 px-6 py-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <div>
                Press <kbd className="rounded border bg-white px-2 py-0.5 font-mono text-xs">ESC</kbd> to exit full screen
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`/api/mxl/${encodeURIComponent(pieceId)}.mxl`}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  download
                >
                  <Download className="h-4 w-4" />
                  Download MXL
                </a>
                <a
                  href={`/api/download?pieceId=${pieceId}&type=mid&download=true`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  download
                >
                  <Download className="h-4 w-4" />
                  Download MIDI
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}