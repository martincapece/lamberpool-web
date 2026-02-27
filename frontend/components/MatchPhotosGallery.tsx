'use client';

import { useState, useEffect } from 'react';
import { photosAPI } from '@/lib/api';

interface Photo {
  id: string;
  url: string;
  uploadedAt: string;
}

interface MatchPhotosGalleryProps {
  matchId: string;
}

export default function MatchPhotosGallery({ matchId }: MatchPhotosGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [matchId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await photosAPI.getByMatch(matchId);
      setPhotos(response.data);
    } catch (err) {
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6 md:py-8">
        <p className="text-xs md:text-sm text-gray-600">Cargando fotos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-6 md:py-8 text-gray-500">
        <p className="text-xs md:text-sm">📸 No hay fotos disponibles para este partido</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Galería en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="cursor-pointer group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              alt="Match photo"
              className="w-full h-32 md:h-48 object-cover group-hover:scale-110 transition"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
              <span className="text-white text-xl md:text-2xl opacity-0 group-hover:opacity-100 transition">
                🔍
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 px-2 truncate">
              {new Date(photo.uploadedAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        ))}
      </div>

      {/* Modal de visor */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 md:p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt="Full size"
              className="w-full max-h-[90vh] md:max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 md:top-4 right-2 md:right-4 bg-black/50 text-white p-1.5 md:p-2 rounded-full hover:bg-black/75 transition text-base md:text-lg"
            >
              ✕
            </button>
            <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black/50 text-white px-2 md:px-3 py-1 md:py-2 rounded">
              <p className="text-xs md:text-sm">
                {new Date(selectedPhoto.uploadedAt).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
