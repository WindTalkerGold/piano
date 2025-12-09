'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-pdf components on client only to avoid SSR usage
const Document = dynamic(() => import('react-pdf').then(m => m.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(m => m.Page), { ssr: false });
const getPdfjs = () => import('react-pdf').then(m => m.pdfjs);


interface PDFViewerProps {
  pdfUrl: string;
  className?: string;
  onLoadError?: (error: Error) => void;
  onLoadSuccess?: (pdf: any) => void;
}

export default function PDFViewer({
  pdfUrl,
  className = '',
  onLoadError,
  onLoadSuccess,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfjsReady, setPdfjsReady] = useState(false);

  useEffect(() => {
    // Configure worker on client after pdfjs loads
    getPdfjs().then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setPdfjsReady(true);
    }).catch((err) => {
      console.error('Failed to load pdfjs:', err);
      setError('Failed to initialize PDF renderer');
    });
  }, []);

  function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setLoading(false);
    onLoadSuccess?.(pdf);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
    onLoadError?.(error);
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber < 1 || (numPages && newPageNumber > numPages)) {
        return prevPageNumber;
      }
      return newPageNumber;
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }

  function resetZoom() {
    setScale(1.0);
  }

  // Reset state when PDF URL changes
  useEffect(() => {
    setNumPages(null);
    setPageNumber(1);
    setScale(1.0);
    setLoading(true);
    setError(null);
  }, [pdfUrl]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50 hover:enabled:bg-gray-100"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {pageNumber} of {numPages ?? '?'}
          </span>
          <button
            onClick={nextPage}
            disabled={!!numPages && pageNumber >= numPages}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50 hover:enabled:bg-gray-100"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50 hover:enabled:bg-gray-100"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm text-gray-700">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50 hover:enabled:bg-gray-100"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative flex-1 overflow-auto rounded-lg border bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-medium text-red-800">Failed to load PDF</p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
              <p className="mt-4 text-xs text-gray-600">
                Try downloading the file instead or check if the PDF is valid.
              </p>
            </div>
          </div>
        )}

        {pdfjsReady ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="hidden">Loading PDF...</div>}
            className="flex justify-center"
          >
            {numPages && (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-sm"
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            )}
          </Document>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="rounded-lg border bg-white p-6 text-center">
              <p className="text-sm text-gray-700">Initializing PDF viewer...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          Use controls to navigate and zoom. For best experience on mobile, use landscape orientation.
        </p>
      </div>
    </div>
  );
}