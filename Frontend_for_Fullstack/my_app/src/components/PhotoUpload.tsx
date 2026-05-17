import React, { useRef, useState } from 'react';
import { api } from '../api/axios';

interface PhotoUploadProps {
  photoUrl: string | null | undefined;
  onPhotoUploaded: (photoUrl: string) => void;
  onPhotoDeleted: () => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photoUrl,
  onPhotoUploaded,
  onPhotoDeleted
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Only JPG and PNG files are allowed');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<any>('/api/v1/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onPhotoUploaded(response.data.photo_url);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to upload photo';
      setError(errorMsg);
      console.error('Photo upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    setIsDeleting(true);
    setError('');

    try {
      await api.delete('/api/v1/delete-photo');
      onPhotoDeleted();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete photo';
      setError(errorMsg);
      console.error('Photo delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Photo Display */}
      <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg overflow-hidden border-4 border-white">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="User profile photo"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <span>👤</span>
        )}
      </div>

      {/* Upload/Delete Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          {isUploading ? '⏳ Uploading...' : '📸 Upload Photo'}
        </button>

        {photoUrl && (
          <button
            onClick={handleDeletePhoto}
            disabled={isDeleting || isUploading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isDeleting}
      />

      {/* Help Text */}
      <p className="text-gray-600 text-xs text-center max-w-xs">
        📁 JPG or PNG • Max 5MB
      </p>
    </div>
  );
};
