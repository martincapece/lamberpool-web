'use client';

import { useState, useRef } from 'react';
import { photosAPI } from '@/lib/api';

interface PhotoUploadProps {
  matchId: string;
  onPhotoUploaded: () => void;
}

export default function PhotoUpload({ matchId, onPhotoUploaded }: PhotoUploadProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await photosAPI.upload(matchId, preview);
      console.log('Upload response:', response);

      setSuccess('Photo uploaded successfully!');
      setPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh photos list
      setTimeout(() => {
        onPhotoUploaded();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">Upload Match Photos</h3>

      {/* File input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={() => {
              setPreview('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!preview || loading}
        className={`w-full py-2 rounded-lg font-semibold transition-colors ${
          preview && !loading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Uploading...' : 'Upload Photo'}
      </button>
    </div>
  );
}
