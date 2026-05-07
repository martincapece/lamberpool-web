'use client';

import { useEffect, useState } from 'react';
import { seasonsAPI, competitionsAPI, tournamentsAPI } from '@/lib/api';
import AdminFeedbackModal from './AdminFeedbackModal';

interface Tournament {
  id: string;
  name: string;
}

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
  matches?: any[];
}

export default function AdminCompetitionsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tournamentsResponse = await tournamentsAPI.getAll();
      const tournamentsData = tournamentsResponse.data;
      setTournaments(tournamentsData);

      const allSeasons = await Promise.all(
        tournamentsData.map(async (tournament: Tournament) => {
          const seasonsResponse = await seasonsAPI.getAll(tournament.id);
          return seasonsResponse.data.map((season: any) => ({ ...season, tournament }));
        })
      );

      setSeasons(allSeasons.flat());
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string, year: number, tournamentName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la temporada ${year} de ${tournamentName}? Esto eliminará todas las competencias y partidos asociados.`)) {
      return;
    }

    try {
      await seasonsAPI.delete(seasonId);
      await loadData();
      setFeedback({
        title: 'Temporada eliminada',
        message: `La temporada ${year} de ${tournamentName} se eliminó correctamente.`,
        tone: 'success',
      });
    } catch (err: any) {
      console.error('Error deleting season:', err);
      setFeedback({
        title: 'No se pudo eliminar la temporada',
        message: err.response?.data?.error || 'Error al eliminar la temporada',
        tone: 'error',
      });
    }
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`¿Eliminar el torneo "${tournamentName}"? Esto eliminará las temporadas, competencias y partidos asociados.`)) {
      return;
    }

    try {
      await tournamentsAPI.delete(tournamentId);
      await loadData();
      setFeedback({
        title: 'Torneo eliminado',
        message: `El torneo "${tournamentName}" se eliminó correctamente.`,
        tone: 'success',
      });
    } catch (err: any) {
      console.error('Error deleting tournament:', err);
      setFeedback({
        title: 'No se pudo eliminar el torneo',
        message: err.response?.data?.error || 'Error al eliminar el torneo',
        tone: 'error',
      });
    }
  };

  const handleDeleteCompetition = async (competitionId: string, competitionName: string, seasonYear: number, tournamentName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la competencia "${competitionName}"?\n\nEsto también eliminará los partidos asociados.\n\nSi es la última competencia del año ${seasonYear}, se eliminará la temporada completa.\nSi es el último año del torneo "${tournamentName}", se eliminará el torneo.`)) {
      return;
    }

    try {
      await competitionsAPI.delete(competitionId);
      await loadData();
      setFeedback({
        title: 'Competencia eliminada',
        message: `La competencia "${competitionName}" se eliminó correctamente.\n\nEl sistema limpió automáticamente temporadas y torneos vacíos.`,
        tone: 'success',
      });
    } catch (err: any) {
      console.error('Error deleting competition:', err);
      setFeedback({
        title: 'No se pudo eliminar la competencia',
        message: err.response?.data?.error || 'Error al eliminar la competencia',
        tone: 'error',
      });
    }
  };

  const orphanTournaments = tournaments.filter(
    (tournament) => !seasons.some((season) => season.tournament.id === tournament.id)
  );

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

      <div className="p-4 md:p-6 border-b border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Gestionar Temporadas y Competencias</h2>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          Elimina temporadas o competencias antiguas que ya no necesites
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="p-4 md:p-6 space-y-6">
        {orphanTournaments.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-xs md:text-sm font-semibold text-amber-900">Torneos sin temporadas</h3>
            <p className="mt-2 text-xs md:text-sm text-amber-800">
              Estos torneos quedaron sin temporadas activas. Puedes eliminarlos directamente.
            </p>
            <div className="mt-4 space-y-3">
              {orphanTournaments.map((tournament) => (
                <div key={tournament.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded bg-white px-4 py-3">
                  <span className="text-xs md:text-sm font-medium text-gray-800 flex-1 break-words">{tournament.name}</span>
                  <button
                    onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                    className="w-full md:w-auto rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition"
                  >
                    Eliminar torneo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {seasons.length === 0 && (
          <p className="text-gray-500 text-center py-8 text-xs md:text-sm">No hay temporadas registradas</p>
        )}

        {seasons.map((season) => (
          <div key={season.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header de la temporada */}
            <div className="bg-gray-50 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-bold text-gray-900">
                  {season.tournament.name} - {season.year}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  {season.competitions.length} competencia(s)
                </p>
              </div>
              <button
                onClick={() => handleDeleteSeason(season.id, season.year, season.tournament.name)}
                className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs md:text-sm font-medium"
              >
                🗑️ Eliminar Temporada
              </button>
            </div>

            {/* Lista de competencias */}
            {season.competitions.length > 0 && (
              <div className="divide-y divide-gray-200">
                {season.competitions.map((competition) => (
                  <div key={competition.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-900">{competition.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {competition.matches?.length || 0} partido(s)
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCompetition(competition.id, competition.name, season.year, season.tournament.name)}
                      className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                    >
                      🗑️ Eliminar
                    </button>
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
