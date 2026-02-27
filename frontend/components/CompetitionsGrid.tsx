'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tournamentsAPI, seasonsAPI, competitionsAPI } from '@/lib/api';

interface Competition {
  id: string;
  name: string;
  seasonId: string;
  finalTablePhotoUrl?: string;
}

interface Season {
  id: string;
  year: number;
  tournament: any;
  competitions: Competition[];
}

export default function CompetitionsGrid() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tournamentsResponse = await tournamentsAPI.getAll();

      const allSeasons: Season[] = [];
      for (const tournament of tournamentsResponse.data) {
        const seasonsResponse = await seasonsAPI.getAll(tournament.id);
        const seasonsWithCompetitions = await Promise.all(
          seasonsResponse.data.map(async (season: any) => {
            const competitionsResponse = await competitionsAPI.getAll(season.id);
            return {
              ...season,
              tournament,
              competitions: competitionsResponse.data,
            };
          })
        );
        allSeasons.push(...seasonsWithCompetitions);
      }

      setSeasons(allSeasons);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompetitionClick = (competitionId: string, seasonId: string, tournamentId: string) => {
    // Navegar a matches con los filtros preseleccionados
    router.push(
      `/matches?competitionFilter=${competitionId}&seasonFilter=${seasonId}&tournamentFilter=${tournamentId}`
    );
  };

  const getCompetitionIcon = (competitionName: string): string => {
    const lowerName = competitionName.toLowerCase();
    if (lowerName.includes('regular')) return '⚽';
    if (lowerName.includes('playoff')) return '🏆';
    if (lowerName.includes('fase')) return '📋';
    return '⚽';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cargando competencias...</p>
      </div>
    );
  }

  const allCompetitions = seasons.flatMap((season) =>
    season.competitions.map((comp) => ({
      ...comp,
      season,
    }))
  );

  if (allCompetitions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay competencias disponibles</p>
      </div>
    );
  }

  return (
    <>
      {/* Modal para ver tabla final */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con controles */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{selectedPhoto.name}</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                    className="px-2 py-1 hover:bg-gray-100 rounded text-sm font-medium text-gray-700"
                    title="Disminuir zoom"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(Math.min(300, zoomLevel + 10))}
                    className="px-2 py-1 hover:bg-gray-100 rounded text-sm font-medium text-gray-700"
                    title="Aumentar zoom"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => {
                    setZoomLevel(100);
                  }}
                  className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                  title="Resetear zoom"
                >
                  Reset
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenedor de imagen con scroll */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100">
              <div className="p-4">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.name}
                  className="rounded transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    maxHeight: 'calc(90vh - 120px)',
                    width: 'auto',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-6 justify-center md:justify-start">
        {allCompetitions.map((competition) => (
          <button
            key={competition.id}
            onClick={() =>
              handleCompetitionClick(
                competition.id,
                competition.season.id,
                competition.season.tournament.id
              )
            }
            className="group relative overflow-hidden rounded-lg bg-white shadow hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer hover:-translate-y-1 min-h-80 w-full sm:w-96"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-90 group-hover:opacity-100 transition-opacity" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full w-full p-6">
              {/* Logo/Icono grande */}
              <div className="flex-1 flex items-center justify-center">
                <span className="text-6xl md:text-7xl group-hover:scale-110 transition-transform">
                  {getCompetitionIcon(competition.name)}
                </span>
              </div>

              {/* Información */}
              <div className="text-center space-y-3">
                <h3 className="text-white font-bold text-lg line-clamp-2">
                  {competition.name}
                </h3>
                <p className="text-sm text-gray-200 font-medium">
                  {competition.season.tournament.name} • {competition.season.year}
                </p>
                {competition.finalTablePhotoUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel(100); // Reset zoom
                      setSelectedPhoto({
                        url: competition.finalTablePhotoUrl!,
                        name: `Tabla Final - ${competition.name}`,
                      });
                    }}
                    className="block w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition transform hover:scale-105"
                  >
                    ✅ Ver Tabla Final
                  </button>
                )}
                <p className="text-xs text-gray-300">Click para ver partidos</p>
              </div>
            </div>

            {/* Foto de tabla final (si existe) */}
            {competition.finalTablePhotoUrl && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                <img
                  src={competition.finalTablePhotoUrl}
                  alt="Tabla final"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
