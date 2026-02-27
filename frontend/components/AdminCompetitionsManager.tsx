'use client';

import { useEffect, useState } from 'react';
import { seasonsAPI, competitionsAPI, tournamentsAPI } from '@/lib/api';

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
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Obtener torneos
      const tournamentsResponse = await tournamentsAPI.getAll();

      // Obtener todas las temporadas de todos los torneos
      const allSeasons: Season[] = [];
      for (const tournament of tournamentsResponse.data) {
        const seasonsResponse = await seasonsAPI.getAll(tournament.id);
        allSeasons.push(...seasonsResponse.data.map((s: any) => ({ ...s, tournament })));
      }

      setSeasons(allSeasons);
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
      alert('Temporada eliminada exitosamente');
    } catch (err: any) {
      console.error('Error deleting season:', err);
      alert(err.response?.data?.error || 'Error al eliminar la temporada');
    }
  };

  const handleDeleteCompetition = async (competitionId: string, competitionName: string, seasonYear: number, tournamentName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la competencia "${competitionName}"?\n\nEsto también eliminará los partidos asociados.\n\nSi es la última competencia del año ${seasonYear}, se eliminará la temporada completa.\nSi es el último año del torneo "${tournamentName}", se eliminará el torneo.`)) {
      return;
    }

    try {
      await competitionsAPI.delete(competitionId);
      await loadData();
      alert(`✅ Competencia "${competitionName}" eliminada exitosamente.\n\nEl sistema limpió automáticamente las temporadas y torneos vacíos.`);
    } catch (err: any) {
      console.error('Error deleting competition:', err);
      alert(err.response?.data?.error || 'Error al eliminar la competencia');
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
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Gestionar Temporadas y Competencias</h2>
        <p className="text-sm text-gray-600 mt-1">
          Elimina temporadas o competencias antiguas que ya no necesites
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="p-6 space-y-6">
        {seasons.length === 0 && (
          <p className="text-gray-500 text-center py-8">No hay temporadas registradas</p>
        )}

        {seasons.map((season) => (
          <div key={season.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header de la temporada */}
            <div className="bg-gray-50 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {season.tournament.name} - {season.year}
                </h3>
                <p className="text-sm text-gray-600">
                  {season.competitions.length} competencia(s)
                </p>
              </div>
              <button
                onClick={() => handleDeleteSeason(season.id, season.year, season.tournament.name)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                🗑️ Eliminar Temporada
              </button>
            </div>

            {/* Lista de competencias */}
            {season.competitions.length > 0 && (
              <div className="divide-y divide-gray-200">
                {season.competitions.map((competition) => (
                  <div key={competition.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{competition.name}</p>
                      <p className="text-sm text-gray-500">
                        {competition.matches?.length || 0} partido(s)
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCompetition(competition.id, competition.name, season.year, season.tournament.name)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium"
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
