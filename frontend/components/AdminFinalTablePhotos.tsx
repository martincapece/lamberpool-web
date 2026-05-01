'use client';

import { useEffect, useState } from 'react';
import { seasonsAPI, competitionsAPI, tournamentsAPI } from '@/lib/api';
import AdminFeedbackModal from './AdminFeedbackModal';

interface Season {
  id: string;
  year: number;
  tournament: any;
  competitions: Competition[];
}

interface Competition {
  id: string;
  name: string;
  seasonId: string;
  finalTablePhotoUrl?: string;
  matches?: any[];
}

export default function AdminFinalTablePhotos() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tournamentsResponse = await tournamentsAPI.getAll();

      const seasonGroups = await Promise.all(
        tournamentsResponse.data.map(async (tournament: any) => {
          const seasonsResponse = await seasonsAPI.getAll(tournament.id);
          return Promise.all(
            seasonsResponse.data.map(async (season: any) => {
              const competitionsResponse = await competitionsAPI.getAll(season.id);
              return {
                ...season,
                tournament,
                competitions: competitionsResponse.data,
              };
            })
          );
        })
      );

      setSeasons(seasonGroups.flat());
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (competitionId: string, competitionName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la foto de tabla final de "${competitionName}"?`)) {
      return;
    }

    try {
      setDeletingId(competitionId);
      await competitionsAPI.deleteFinalTablePhoto(competitionId);
      await loadData();
      setFeedback({
        title: 'Foto eliminada',
        message: 'La foto de tabla final se eliminó correctamente.',
        tone: 'success',
      });
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      setFeedback({
        title: 'No se pudo eliminar la foto',
        message: err.response?.data?.error || 'Error al eliminar la foto',
        tone: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileUpload = async (
    competitionId: string,
    competitionName: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setFeedback({
        title: 'Archivo invalido',
        message: 'Por favor selecciona una imagen.',
        tone: 'error',
      });
      return;
    }

    try {
      setUploadingId(competitionId);

      // Convertir imagen a base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        try {
          await competitionsAPI.updateFinalTablePhoto(competitionId, base64);
          await loadData();
          setFeedback({
            title: 'Foto subida',
            message: `La foto de tabla final para "${competitionName}" se subió correctamente.`,
            tone: 'success',
          });
        } catch (err: any) {
          console.error('Error uploading photo:', err);
          setFeedback({
            title: 'No se pudo subir la foto',
            message: err.response?.data?.error || 'Error al subir la foto',
            tone: 'error',
          });
        } finally {
          setUploadingId(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      setFeedback({
        title: 'No se pudo procesar la imagen',
        message: 'Error al procesar la imagen.',
        tone: 'error',
      });
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <AdminFeedbackModal
        isOpen={Boolean(feedback)}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        tone={feedback?.tone || 'info'}
        onClose={() => setFeedback(null)}
      />

      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Fotos de Tabla Final</h2>
        <p className="text-sm text-gray-600 mt-1">
          Sube una foto de la tabla final de cada competencia después de que termine
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="p-6 space-y-6">
        {seasons.length === 0 && (
          <p className="text-gray-500 text-center py-8">No hay competencias registradas</p>
        )}

        {seasons.map((season) => (
          <div key={season.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header de la temporada */}
            <div className="bg-gray-50 p-4">
              <h3 className="text-lg font-bold text-gray-900">
                {season.tournament.name} - {season.year}
              </h3>
              <p className="text-sm text-gray-600">
                {season.competitions.length} competencia(s)
              </p>
            </div>

            {/* Lista de competencias */}
            {season.competitions.length > 0 && (
              <div className="divide-y divide-gray-200">
                {season.competitions.map((competition) => (
                  <div key={competition.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{competition.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {competition.matches?.length || 0} partido(s)
                        </p>
                        {competition.finalTablePhotoUrl && (
                          <div className="mt-3">
                            <p className="text-xs text-green-600 font-medium mb-2">
                              ✅ Foto de tabla subida
                            </p>
                            <img
                              src={competition.finalTablePhotoUrl}
                              alt="Tabla final"
                              className="h-32 rounded border border-gray-200"
                            />
                            <button
                              onClick={() => handleDeletePhoto(competition.id, competition.name)}
                              disabled={deletingId === competition.id}
                              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition disabled:bg-gray-400"
                            >
                              {deletingId === competition.id ? '⏳ Eliminando...' : '🗑️ Eliminar Foto'}
                            </button>
                          </div>
                        )}
                      </div>

                      <label className="flex-shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              competition.id,
                              competition.name,
                              e
                            )
                          }
                          disabled={uploadingId === competition.id}
                          className="hidden"
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.currentTarget as HTMLButtonElement).parentElement?.querySelector(
                              'input[type="file"]'
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                          disabled={uploadingId === competition.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:bg-gray-400"
                        >
                          {uploadingId === competition.id ? '⏳ Subiendo...' : '📸 Subir Foto'}
                        </button>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
