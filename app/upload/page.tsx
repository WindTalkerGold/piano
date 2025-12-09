'use client';

import { useState } from 'react';
import { Upload, FileMusic, AlertCircle, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    pieceId?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith('.mid') ||
          selectedFile.name.toLowerCase().endsWith('.midi') ||
          selectedFile.name.toLowerCase().endsWith('.mxl')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        alert('Please select a MIDI or MXL file (.mid, .midi, or .mxl)');
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (
      droppedFile.name.toLowerCase().endsWith('.mid') ||
      droppedFile.name.toLowerCase().endsWith('.midi') ||
      droppedFile.name.toLowerCase().endsWith('.mxl')
    )) {
      setFile(droppedFile);
      setUploadResult(null);
    } else {
      alert('Please drop a MIDI or MXL file (.mid, .midi, or .mxl)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('midi', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult({
          success: true,
          message: 'File uploaded and converted successfully!',
          pieceId: result.pieceId,
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadResult({
          success: false,
          message: `Upload failed: ${result.error}`,
        });
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: `Upload failed: ${error.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Upload MIDI/MXL File</h1>
        <p className="mt-2 text-gray-600">
          Upload a MIDI or MXL file to convert it to sheet music (MXL and PDF formats)
        </p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div
          className="flex flex-col items-center justify-center py-12"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FileMusic className="h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Drag and drop your MIDI or MXL file here
          </p>
          <p className="mt-2 text-gray-500">or</p>
          <label className="mt-4 cursor-pointer">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
              <Upload className="h-5 w-5" />
              <span className="font-medium">Browse Files</span>
            </div>
            <input
              id="file-input"
              type="file"
              accept=".mid,.midi,.mxl"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="mt-4 text-sm text-gray-500">
            Only MIDI files (.mid, .midi) or MXL files (.mxl) are supported
          </p>
        </div>

        {file && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileMusic className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {uploadResult && (
        <div
          className={`rounded-lg border p-4 ${
            uploadResult.success
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {uploadResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <div>
              <p className="font-medium">{uploadResult.message}</p>
              {uploadResult.pieceId && (
                <p className="mt-1 text-sm">
                  Piece ID: <code className="rounded bg-green-100 px-2 py-1">{uploadResult.pieceId}</code>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">Upload & Conversion Process</h2>
        <ol className="mt-4 space-y-4">
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
              1
            </div>
            <div>
              <p className="font-medium">Upload MIDI/MXL File</p>
              <p className="text-sm text-gray-500">Select your MIDI (.mid/.midi) or MXL (.mxl) file</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
              2
            </div>
            <div>
              <p className="font-medium">Automatic Conversion</p>
              <p className="text-sm text-gray-500">
                System converts MIDI → MXL → PDF and MXL → MIDI → PDF using MuseScore
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
              3
            </div>
            <div>
              <p className="font-medium">Library Storage</p>
              <p className="text-sm text-gray-500">
                Files are stored in your local library with metadata
              </p>
            </div>
          </li>
        </ol>

        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Uploading and Converting...
            </span>
          ) : (
            'Upload & Convert to Sheet Music'
          )}
        </button>
      </div>
    </div>
  );
}