'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { matchesAPI } from '@/lib/api';
import MatchLineupViewer from '@/components/MatchLineupViewer';
import MatchPhotosGallery from '@/components/MatchPhotosGallery';
import MatchCompetitionFilter from '@/components/MatchCompetitionFilter';

interface Match {
  id: string;
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
  competition?: {
    id: string;
    name: string;
    season?: {
      id: string;
      year: number;
      tournament?: {
        id: string;
        name: string;
      };
    };
  };
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchId = searchParams.get('matchId');
  const competitionFilterParam = searchParams.get('competitionFilter');
  const seasonFilterParam = searchParams.get('seasonFilter');
  const tournamentFilterParam = searchParams.get('tournamentFilter');

  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCompetitionFilter, setSelectedCompetitionFilter] = useState<string | null>(
    competitionFilterParam || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find((m) => m.id === matchId);
      setSelectedMatch(match || null);
    } else {
      setSelectedMatch(null);
    }
  }, [matchId, matches]);

  // Aplicar filtro de competencia
  useEffect(() => {
    let filtered = [...matches];
    if (selectedCompetitionFilter) {
      filtered = filtered.filter(
        (m) => m.competition?.id === selectedCompetitionFilter
      );
    }
    setFilteredMatches(filtered);
  }, [matches, selectedCompetitionFilter]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getAll();
      setMatches(
        response.data.sort(
          (a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      setError(null);
    } catch (err) {
      setError('Error al cargar los partidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Si hay un matchId y match seleccionado, mostrar vista detallada
  if (selectedMatch) {
    return (
      <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/matches')}
          className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Volver a todos los partidos
        </button>
      </div>

      <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm text-gray-600">
              {new Date(selectedMatch.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {selectedMatch.competition?.season?.tournament && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedMatch.competition.season.tournament.name}
                {selectedMatch.competition.season && ` • ${selectedMatch.competition.season.year}`}
                {selectedMatch.competition.name && ` • ${selectedMatch.competition.name}`}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold mt-2 truncate">
              Lamberpool FC vs {selectedMatch.opponent}
            </h1>
          </div>
          <div
            className={`text-3xl md:text-4xl font-bold flex-shrink-0 ${
              selectedMatch.result === 'W'
                ? 'text-green-600'
                : selectedMatch.result === 'D'
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            {selectedMatch.goalsFor} - {selectedMatch.goalsAgainst}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">Alineación</h2>
        <MatchLineupViewer matchId={selectedMatch.id} />
      </section>

      <section className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">Galería de Fotos</h2>
        <MatchPhotosGallery matchId={selectedMatch.id} />
      </section>
      </div>
    );
  }

  // Vista de listado
  return (
    <div className="min-h-screen space-y-6 md:space-y-8 pb-12">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 md:mb-8">Resultados del Equipo</h1>

        {/* Filtro de competencia */}
        <div className="mb-6 md:mb-8">
          <MatchCompetitionFilter
            onFilterChange={setSelectedCompetitionFilter}
            initialCompetitionId={competitionFilterParam || undefined}
            initialSeasonId={seasonFilterParam || undefined}
            initialTournamentId={tournamentFilterParam || undefined}
          />
        </div>

        {loading && (
          <div className="text-center py-8 md:py-12">
            <p className="text-xs md:text-sm text-gray-600">Cargando partidos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 md:px-4 md:py-3 rounded text-xs md:text-sm">
            {error}
          </div>
        )}

        {!loading && filteredMatches.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 md:px-4 md:py-3 rounded text-xs md:text-sm">
            No hay partidos disponibles.
          </div>
        )}

        {!loading && filteredMatches.length > 0 && (
          <div className="space-y-8 md:space-y-10">
            {filteredMatches.map((match) => (
              <Link key={match.id} href={`/matches?matchId=${match.id}`}>
                <div className="border-l-4 p-4 md:p-6 rounded-lg hover:shadow-lg transition cursor-pointer"
                     style={{
                       borderColor: match.result === 'W' ? '#22c55e' : match.result === 'D' ? '#eab308' : '#ef4444',
                       backgroundColor: match.result === 'W' ? '#f0fdf4' : match.result === 'D' ? '#fefce8' : '#fef2f2'
                     }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {new Date(match.date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-base md:text-lg font-semibold mt-1 truncate">vs {match.opponent}</p>
                      {match.competition?.season?.tournament && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {match.competition.season.tournament.name}
                          {match.competition.season && ` • ${match.competition.season.year}`}
                        </p>
                      )}
                    </div>
                    <div className="text-2xl md:text-3xl font-bold flex-shrink-0"
                         style={{
                           color: match.result === 'W' ? '#16a34a' : match.result === 'D' ? '#ca8a04' : '#dc2626'
                         }}>
                      {match.goalsFor} - {match.goalsAgainst}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {!loading && matches.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">
            {selectedCompetitionFilter ? 'Estadísticas - Competencia Filtrada' : 'Estadísticas Generales'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-xs md:text-sm">Partidos Jugados</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-1">{filteredMatches.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-xs md:text-sm">Victorias</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">
                {filteredMatches.filter((m) => m.result === 'W').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-xs md:text-sm">Empates</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">
                {filteredMatches.filter((m) => m.result === 'D').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-xs md:text-sm">Derrotas</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">
                {filteredMatches.filter((m) => m.result === 'L').length}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <MatchesContent />
    </Suspense>
  );
}
