'use client';

import { useEffect, useState } from 'react';
import { filtersAPI } from '@/lib/api';

export interface FilterOptions {
  type: 'all' | 'year' | 'tournament' | 'competition';
  yearValue?: number;
  tournamentId?: string;
  competitionId?: string;
}

interface FilterOption {
  years: number[];
  tournaments: { id: string; name: string }[];
  competitions: { id: string; name: string; seasonYear: number; tournamentName: string; fullName: string }[];
}

interface PlayerStatsFiltersProps {
  onFilterChange: (filter: FilterOptions) => void;
}

export default function PlayerStatsFilters({ onFilterChange }: PlayerStatsFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOption | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'year' | 'tournament' | 'competition'>('all');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedTournament, setSelectedTournament] = useState<string | undefined>();
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const response = await filtersAPI.getOptions();
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleTypeChange = (type: 'all' | 'year' | 'tournament' | 'competition') => {
    setSelectedType(type);
    setSelectedYear(undefined);
    setSelectedTournament(undefined);
    setSelectedCompetition(undefined);

    if (type === 'all') {
      onFilterChange({ type: 'all' });
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    onFilterChange({
      type: 'year',
      yearValue: year,
    });
  };

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    onFilterChange({
      type: 'tournament',
      tournamentId,
    });
  };

  const handleCompetitionChange = (competitionId: string) => {
    setSelectedCompetition(competitionId);
    onFilterChange({
      type: 'competition',
      competitionId,
    });
  };

  if (!filterOptions) {
    return <div className="text-sm text-gray-600">Cargando filtros...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg md:text-xl font-bold text-gray-900">
            📊 Filtrar Estadísticas
          </span>
          {selectedType !== 'all' && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Filtro activo
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenido colapsable */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-200">
          {/* Tipo de filtro */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Filtro</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleTypeChange('all')}
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                  selectedType === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block md:hidden">📊</span>
                <span className="hidden md:block">📊 Históricas</span>
              </button>
              <button
                onClick={() => handleTypeChange('year')}
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                  selectedType === 'year'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block md:hidden">📅</span>
                <span className="hidden md:block">📅 Por Año</span>
              </button>
              <button
                onClick={() => handleTypeChange('tournament')}
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                  selectedType === 'tournament'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block md:hidden">🏆</span>
                <span className="hidden md:block">🏆 Por Torneo</span>
              </button>
              <button
                onClick={() => handleTypeChange('competition')}
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                  selectedType === 'competition'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block md:hidden">🎯</span>
                <span className="hidden md:block">🎯 Competencia</span>
              </button>
            </div>
          </div>

          {/* Selector de Año */}
          {selectedType === 'year' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Seleccionar Año</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              >
                <option value="">Selecciona un año...</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Torneo */}
          {selectedType === 'tournament' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Seleccionar Torneo</label>
              <select
                value={selectedTournament || ''}
                onChange={(e) => handleTournamentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              >
                <option value="">Selecciona un torneo...</option>
                {filterOptions.tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Competencia */}
          {selectedType === 'competition' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Seleccionar Competencia</label>
              <select
                value={selectedCompetition || ''}
                onChange={(e) => handleCompetitionChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              >
                <option value="">Selecciona una competencia...</option>
                {filterOptions.competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resumen del filtro activo */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {selectedType === 'all' && '📊 Mostrando estadísticas históricas (todas las temporadas)'}
              {selectedType === 'year' && selectedYear && `📅 Mostrando estadísticas del año ${selectedYear}`}
              {selectedType === 'tournament' && selectedTournament && 
                `🏆 ${filterOptions.tournaments.find(t => t.id === selectedTournament)?.name}`}
              {selectedType === 'competition' && selectedCompetition && 
                `🎯 ${filterOptions.competitions.find(c => c.id === selectedCompetition)?.fullName}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
