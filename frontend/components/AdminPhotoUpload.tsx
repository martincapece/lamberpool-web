'use client';

import { useState, useEffect } from 'react';
import { matchesAPI, photosAPI } from '@/lib/api';

interface Match {
  id: string;
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
}

interface Photo {
  id: string;
  url: string;
  uploadedAt: string;
}

export default function AdminPhotoUpload() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await matchesAPI.getAll();
      setMatches(response.data);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  useEffect(() => {
    if (selectedMatch) {
      loadPhotos();
    } else {
      setPhotos([]);
    }
  }, [selectedMatch]);

  const loadPhotos = async () => {
    try {
      const response = await photosAPI.getByMatch(selectedMatch);
      setPhotos(response.data);
    } catch (err) {
      console.error('Error loading photos:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!selectedMatch) {
      setError('Por favor selecciona un partido primero');
      return;
    }

    const files = e.dataTransfer.files;
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      await uploadFiles(files);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Función auxiliar para intentar comprimir con cierta calidad
          const tryCompress = (maxDim: number, q: number): string | null => {
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              const newWidth = Math.round(width * ratio);
              const newHeight = Math.round(height * ratio);
              canvas.width = newWidth;
              canvas.height = newHeight;
            } else {
              canvas.width = width;
              canvas.height = height;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const base64 = canvas.toDataURL('image/jpeg', q);
            // Validar que no sea demasiado grande (máx 1.2MB en base64)
            if (base64.length > 1.2 * 1024 * 1024) {
              return null;
            }
            return base64;
          };

          // Intentar con múltiples estrategias de compresión, más agresivamente
          let result = tryCompress(1600, 0.65);
          if (!result) result = tryCompress(1200, 0.55);
          if (!result) result = tryCompress(1000, 0.50);
          if (!result) result = tryCompress(800, 0.45);
          if (!result) result = tryCompress(600, 0.40);
          if (!result) result = tryCompress(480, 0.35);
          if (!result) result = tryCompress(360, 0.30);

          if (result) {
            const sizeMB = (result.length / (1024 * 1024)).toFixed(2);
            console.log(`✅ Foto comprimida a ${sizeMB}MB`);
            resolve(result);
          } else {
            reject(new Error('No se pudo comprimir la imagen a un tamaño aceptable'));
          }
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const uploadFiles = async (files: FileList) => {
    if (!selectedMatch) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress('');

    try {
      const fileArray = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (fileArray.length === 0) {
        setError('Por favor selecciona archivos de imagen válidos');
        setLoading(false);
        return;
      }

      // Validar tamaño máximo original (15MB)
      const maxSize = 15 * 1024 * 1024;
      const oversizedFiles = fileArray.filter(f => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError(`Las siguientes fotos son demasiado grandes (máx 15MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
        setLoading(false);
        return;
      }

      // Comprimir y subir cada archivo
      let uploadedCount = 0;
      let failedCount = 0;
      const failures: { name: string; error: string }[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Procesando ${i + 1} de ${fileArray.length}...`);

        try {
          setUploadProgress(`Comprimiendo ${file.name}...`);
          const base64 = await compressImage(file);
          const sizeMB = (base64.length / (1024 * 1024)).toFixed(2);
          console.log(`📤 Intentando subir ${file.name} (${sizeMB}MB)`);

          setUploadProgress(`Subiendo ${file.name}...`);
          const response = await photosAPI.add({
            matchId: selectedMatch,
            url: base64,
            cloudinaryId: null,
          });

          if (response.data?.id) {
            uploadedCount++;
            console.log(`✅ ${file.name} subida exitosamente`);
          } else {
            throw new Error('Respuesta inválida del servidor');
          }
        } catch (err: any) {
          console.error('Error uploading photo:', file.name, err);
          failedCount++;
          const errorMsg = err.response?.data?.error || err.message || 'Error desconocido';
          failures.push({
            name: file.name,
            error: errorMsg
          });
        }
      }

      setUploadProgress('');

      if (uploadedCount > 0) {
        setSuccess(
          `✅ ${uploadedCount} foto${uploadedCount > 1 ? 's' : ''} subida${uploadedCount > 1 ? 's' : ''} correctamente!` +
          (failedCount > 0 ? ` ⚠️ ${failedCount} fallaron` : '')
        );
        await loadPhotos();
      } else {
        const errorMsg = failures.map(f => `${f.name}: ${f.error}`).join('\n');
        setError(`No se pudieron subir las fotos:\n${errorMsg}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir fotos');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta foto?')) return;

    try {
      await photosAPI.delete(photoId);
      loadPhotos();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar foto');
    }
  };

  const selectedMatchData = matches.find((m) => m.id === selectedMatch);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Cargar Fotos</h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
          Selecciona un partido y arrastra fotos para subirlas masivamente.
        </p>
      </div>

      {error && (
        <div className="p-2 md:p-3 bg-red-100 text-red-700 rounded text-xs md:text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}
      {success && (
        <div className="p-2 md:p-3 bg-green-100 text-green-700 rounded text-xs md:text-sm">
          {success}
        </div>
      )}
      {uploadProgress && (
        <div className="p-2 md:p-3 bg-blue-100 text-blue-700 rounded text-xs md:text-sm">
          ⏳ {uploadProgress}
        </div>
      )}

      <div>
        <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Selecciona Partido</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className="w-full p-2 md:p-3 border rounded text-xs md:text-sm"
        >
          <option value="">Elige un partido</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.opponent} - {new Date(m.date).toLocaleDateString('es-ES')} ({m.goalsFor}-{m.goalsAgainst})
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && selectedMatchData && (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-blue-50 p-3 md:p-4 rounded border-l-4 border-blue-600">
            <h4 className="font-bold text-base md:text-lg">
              Lamberpool FC vs {selectedMatchData.opponent}
            </h4>
            <p className="text-xs md:text-sm text-gray-600">
              {new Date(selectedMatchData.date).toLocaleDateString('es-ES')} - 
              Resultado: {selectedMatchData.goalsFor}-{selectedMatchData.goalsAgainst}
            </p>
          </div>

          {/* Zona de drag-drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <div className="space-y-1 md:space-y-2">
              <div className="text-2xl md:text-4xl">📸</div>
              <h4 className="font-semibold text-xs md:text-base text-gray-800">
                Arrastra fotos aquí
              </h4>
              <p className="text-xs text-gray-600">
                o
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />
                <span className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium text-xs md:text-sm">
                  haz clic para seleccionar
                </span>
              </label>
              <p className="text-[10px] md:text-xs text-gray-500">
                Formatos: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>

          {/* Galería de fotos subidas */}
          {photos.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <h4 className="font-semibold text-base md:text-lg">
                Fotos subidas ({photos.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt="Match photo"
                      className="w-full h-24 md:h-40 object-cover rounded-lg shadow"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-1 md:top-2 right-1 md:right-2 bg-red-600 text-white p-1 md:p-2 rounded opacity-0 group-hover:opacity-100 transition text-xs md:text-sm"
                    >
                      🗑️
                    </button>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                      {new Date(photo.uploadedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length === 0 && (
            <div className="text-center py-6 md:py-8 text-xs md:text-sm text-gray-500">
              <p>No hay fotos subidas aún para este partido</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
