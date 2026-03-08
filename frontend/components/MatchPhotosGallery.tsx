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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

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

  const handlePrevious = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
  };

  const closeModal = () => {
    setSelectedPhotoIndex(null);
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

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <div className="space-y-4">
      {/* Galería en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="cursor-pointer group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition"
            onClick={() => setSelectedPhotoIndex(index)}
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

      {/* Modal de visor con carrousel */}
      {selectedPhoto && selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 md:p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen principal */}
            <img
              src={selectedPhoto.url}
              alt="Full size"
              className="w-full max-h-[90vh] md:max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Botón cerrar */}
            <button
              onClick={closeModal}
              className="absolute top-2 md:top-4 right-2 md:right-4 bg-black/50 text-white p-1.5 md:p-2 rounded-full hover:bg-black/75 transition text-base md:text-lg"
            >
              ✕
            </button>

            {/* Botón anterior */}
            {photos.length > 1 && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2 md:p-3 transition text-xl md:text-2xl"
                aria-label="Foto anterior"
              >
                ← Prev
              </button>
            )}

            {/* Botón siguiente */}
            {photos.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2 md:p-3 transition text-xl md:text-2xl"
                aria-label="Siguiente foto"
              >
                Next →
              </button>
            )}

            {/* Información de fecha y contador */}
            <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 md:left-auto md:right-2 md:bottom-4 space-y-2 bg-black/50 text-white px-2 md:px-3 py-1 md:py-2 rounded">
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
              {photos.length > 1 && (
                <p className="text-xs md:text-sm font-semibold">
                  {selectedPhotoIndex + 1} / {photos.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
