'use client';

import { useEffect, useState } from 'react';
import { tournamentsAPI, seasonsAPI, competitionsAPI } from '@/lib/api';

interface MatchCompetitionFilterProps {
  onFilterChange: (competitionId: string | null) => void;
  initialCompetitionId?: string;
  initialSeasonId?: string;
  initialTournamentId?: string;
}

export default function MatchCompetitionFilter({
  onFilterChange,
  initialCompetitionId,
  initialSeasonId,
  initialTournamentId,
}: MatchCompetitionFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);

  const [selectedTournament, setSelectedTournament] = useState(initialTournamentId || '');
  const [selectedSeason, setSelectedSeason] = useState(initialSeasonId || '');
  const [selectedCompetition, setSelectedCompetition] = useState(initialCompetitionId || '');

  // Cargar torneos inicialmente
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const res = await tournamentsAPI.getAll();
        setTournaments(res.data);
      } catch (error) {
        console.error('Error loading tournaments:', error);
      }
    };
    loadTournaments();
  }, []);

  // Si hay torneo inicial, cargar sus temporadas
  useEffect(() => {
    if (initialTournamentId) {
      const loadSeasons = async () => {
        try {
          const res = await seasonsAPI.getAll(initialTournamentId);
          setSeasons(res.data);
        } catch (error) {
          console.error('Error loading seasons:', error);
        }
      };
      loadSeasons();
    }
  }, [initialTournamentId]);

  // Si hay temporada inicial, cargar sus competiciones
  useEffect(() => {
    if (initialSeasonId) {
      const loadCompetitions = async () => {
        try {
          const res = await competitionsAPI.getAll(initialSeasonId);
          setCompetitions(res.data);
        } catch (error) {
          console.error('Error loading competitions:', error);
        }
      };
      loadCompetitions();
    }
  }, [initialSeasonId]);

  // Si hay competencia inicial, aplicar filtro inmediatamente
  useEffect(() => {
    if (initialCompetitionId) {
      onFilterChange(initialCompetitionId);
    }
  }, [initialCompetitionId, onFilterChange]);

  // Cargar temporadas cuando cambia torneo
  useEffect(() => {
    if (!selectedTournament) {
      setSeasons([]);
      setCompetitions([]);
      return;
    }

    const loadSeasons = async () => {
      try {
        const res = await seasonsAPI.getAll(selectedTournament);
        setSeasons(res.data);
      } catch (error) {
        console.error('Error loading seasons:', error);
      }
    };
    loadSeasons();
  }, [selectedTournament]);

  // Cargar competencias cuando cambia temporada
  useEffect(() => {
    if (!selectedSeason) {
      setCompetitions([]);
      return;
    }

    const loadCompetitions = async () => {
      try {
        const res = await competitionsAPI.getAll(selectedSeason);
        setCompetitions(res.data);
      } catch (error) {
        console.error('Error loading competitions:', error);
      }
    };
    loadCompetitions();
  }, [selectedSeason]);

  // Notificar cambio de competencia
  useEffect(() => {
    onFilterChange(selectedCompetition || null);
  }, [selectedCompetition, onFilterChange]);

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTournament(value);
    // Limpiar temporada y competencia solo si el usuario cambió manualmente el torneo
    if (value !== selectedTournament) {
      setSelectedSeason('');
      setSelectedCompetition('');
    }
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSeason(value);
    // Limpiar competencia solo si el usuario cambió manualmente la temporada
    if (value !== selectedSeason) {
      setSelectedCompetition('');
    }
  };

  const clearFilters = () => {
    setSelectedTournament('');
    setSelectedSeason('');
    setCompetitions([]);
    setSelectedCompetition('');
  };

  const hasFilter = selectedCompetition || selectedSeason || selectedTournament;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con botón toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Filtrar por Competencia</h3>
            {hasFilter && (
              <p className="text-xs text-red-600 font-medium">Filtro activo</p>
            )}
          </div>
        </div>
        <span
          className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="border-t p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Torneos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Torneo
              </label>
              <select
                value={selectedTournament}
                onChange={handleTournamentChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">Todos los torneos</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Temporadas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Temporada
              </label>
              <select
                value={selectedSeason}
                onChange={handleSeasonChange}
                className="w-full p-2 border rounded text-sm disabled:bg-gray-100"
                disabled={!selectedTournament}
              >
                <option value="">Todas las temporadas</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Competencias */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Competencia
              </label>
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="w-full p-2 border rounded text-sm disabled:bg-gray-100"
                disabled={!selectedSeason}
              >
                <option value="">Todas las competencias</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón limpiar */}
          {hasFilter && (
            <div className="flex justify-end pt-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
