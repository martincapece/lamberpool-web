'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { playersAPI, matchPlayersAPI, ratingsAPI, guestRatingsAPI } from '@/lib/api';
import Link from 'next/link';

interface MatchPlayerRecord {
  id: string;
  playerId: string;
  matchId: string;
  position: string;
  goals: number;
  cards: string;
  ratings?: { score: number }[];
  guestRatings?: { score: number }[];
  match: {
    id: string;
    opponent: string;
    date: string;
    goalsFor: number;
    goalsAgainst: number;
    competition?: {
      id: string;
      name: string;
      season: {
        year: number;
        tournament: {
          id: string;
          name: string;
        };
      };
    };
  };
}

interface Player {
  id: string;
  name: string;
  number: number;
}

const formatCardsDisplay = (cards: string) => {
  if (cards === 'Y') return '🟨';
  if (cards === 'R') return '🟥';
  if (cards === 'YY') return '🟨🟥';
  return '-';
};

const getAverageRating = (ratings?: { score: number }[], guestRatings?: { score: number }[]): number | null => {
  const allRatings = [...(ratings || []), ...(guestRatings || [])];
  if (allRatings.length === 0) return null;
  const total = allRatings.reduce((sum, r) => sum + r.score, 0);
  return parseFloat((total / allRatings.length).toFixed(2));
};

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchPlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayerDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch player info
        const playerResponse = await playersAPI.getById(playerId);
        setPlayer(playerResponse.data);

        // Fetch match history for this player
        const matchPlayersResponse = await matchPlayersAPI.getByPlayer(playerId);

        let matchPlayers = matchPlayersResponse.data as MatchPlayerRecord[];

        // Read filters from URL
        const searchParams = new URLSearchParams(
          typeof window !== 'undefined' ? window.location.search : ''
        );
        const filterType = searchParams.get('filter');
        const yearValue = searchParams.get('year');
        const tournamentId = searchParams.get('tournament');
        const competitionId = searchParams.get('competition');
        
        // Apply inherited filters when coming from players list
        if (filterType && filterType !== 'all') {
          if (filterType === 'year' && yearValue) {
            const parsedYear = parseInt(yearValue, 10);
            matchPlayers = matchPlayers.filter(
              (mp) => mp.match?.competition?.season?.year === parsedYear
            );
          } else if (filterType === 'tournament' && tournamentId) {
            matchPlayers = matchPlayers.filter(
              (mp) => mp.match?.competition?.season?.tournament?.id === tournamentId
            );
          } else if (filterType === 'competition' && competitionId) {
            matchPlayers = matchPlayers.filter(
              (mp) => mp.match?.competition?.id === competitionId
            );
          }
        }

        // Load ratings for each match
        const enrichedMatches = await Promise.all(
          matchPlayers.map(async (mp) => {
            try {
              const [ratingsRes, guestRatingsRes] = await Promise.all([
                ratingsAPI.getByMatchPlayer(mp.id),
                guestRatingsAPI.getByMatchPlayer(mp.id),
              ]);
              return {
                ...mp,
                ratings: ratingsRes.data || [],
                guestRatings: guestRatingsRes.data || [],
              };
            } catch (err) {
              return { ...mp, ratings: [], guestRatings: [] };
            }
          })
        );

        // Sort by date descending (newest first)
        enrichedMatches.sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime());
        setMatchHistory(enrichedMatches);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los detalles del jugador');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      loadPlayerDetails();
    }
  }, [playerId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm md:text-base text-gray-600">Cargando detalles del jugador...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 md:p-6">
        <p className="text-sm md:text-base text-red-700">{error || 'Jugador no encontrado'}</p>
        <Link href="/players" className="text-sm md:text-base text-blue-600 hover:underline mt-3 inline-block">
          ← Volver a plantilla
        </Link>
      </div>
    );
  }

  // Calculate stats
  const totalMatches = matchHistory.length;
  const totalGoals = matchHistory.reduce((sum, m) => sum + (m.goals || 0), 0);
  const yellowCards = matchHistory.filter(m => m.cards === 'Y').length;
  const redCards = matchHistory.filter(m => m.cards === 'R' || m.cards === 'YY').length;
  const allRatings = matchHistory
    .map(m => getAverageRating(m.ratings, m.guestRatings))
    .filter((r): r is number => r !== null);
  const averageRating = allRatings.length > 0
    ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2))
    : null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Back Button */}
      <Link 
        href="/players" 
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm md:text-base font-medium"
      >
        ← Volver a plantilla
      </Link>

      {/* Player Header */}
      <div className="bg-white rounded-lg shadow p-4 md:p-8 border-l-4 border-blue-600">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          {/* Jersey Circle */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-3xl md:text-5xl shadow-lg border-4 border-blue-600">
              {player.number}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{player.name}</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">Dorsal #{player.number}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg text-center">
                <p className="text-xs md:text-sm text-gray-600 font-medium">Partidos</p>
                <p className="text-xl md:text-3xl font-bold text-blue-600 mt-2">{totalMatches}</p>
              </div>
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg text-center">
                <p className="text-xs md:text-sm text-gray-600 font-medium">Goles</p>
                <p className="text-xl md:text-3xl font-bold text-green-600 mt-2">⚽ {totalGoals}</p>
              </div>
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg text-center">
                <p className="text-xs md:text-sm text-gray-600 font-medium">Tarjetas</p>
                <p className="text-xl md:text-3xl font-bold text-yellow-600 mt-2">
                  {yellowCards + redCards}
                </p>
              </div>
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg text-center">
                <p className="text-xs md:text-sm text-gray-600 font-medium">Promedio</p>
                <p className="text-xl md:text-3xl font-bold text-purple-600 mt-2">
                  {averageRating !== null ? averageRating.toFixed(1) : 'S/N'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match History Section */}
      {matchHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Historial de Partidos</h2>

          {/* Mobile View: Cards */}
          <div className="space-y-3 md:hidden">
            {matchHistory.map((match) => {
              const rating = getAverageRating(match.ratings, match.guestRatings);
              return (
                <button
                  key={match.id}
                  onClick={() => router.push(`/matches?matchId=${match.matchId}`)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-left hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                >
                  <div className="font-semibold text-gray-900 mb-2">
                    vs {match.match.opponent}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    {new Date(match.match.date).toLocaleDateString('es-ES')}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {match.match.competition?.name || 'Sin competición'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Pos:</span>
                      <span className="font-medium ml-1">{match.position}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Goles:</span>
                      {match.goals > 0 ? (
                        <span className="font-medium ml-1">⚽ {match.goals}</span>
                      ) : (
                        <span className="font-medium ml-1">-</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Tar:</span>
                      <span className="font-medium ml-1">{formatCardsDisplay(match.cards)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm font-bold text-blue-600">
                    Valoración: {rating !== null ? rating.toFixed(1) : 'S/N'} / 10
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-4 font-semibold text-gray-700">Partido</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Posición</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Competición</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Goles</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Tarjetas</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Valoración</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((match) => {
                  const rating = getAverageRating(match.ratings, match.guestRatings);
                  return (
                    <tr
                      key={match.id}
                      onClick={() => router.push(`/matches?matchId=${match.matchId}`)}
                      className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition"
                    >
                      <td className="p-4 font-medium text-gray-900">
                        vs {match.match.opponent}
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(match.match.date).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="text-center p-4 text-gray-700">{match.position}</td>
                      <td className="text-center p-4 text-gray-700">
                        {match.match.competition?.name || 'Sin competición'}
                      </td>
                      <td className="text-center p-4 text-gray-700">
                        {match.goals > 0 ? `⚽ ${match.goals}` : '-'}
                      </td>
                      <td className="text-center p-4 text-gray-700">
                        {formatCardsDisplay(match.cards)}
                      </td>
                      <td className="text-right p-4 font-bold text-blue-600">
                        {rating !== null ? rating.toFixed(1) : 'S/N'} / 10
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matchHistory.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 md:p-6">
          <p className="text-sm md:text-base text-yellow-800">
            ⚽ Este jugador aún no tiene partidos registrados en su historial.
          </p>
        </div>
      )}
    </div>
  );
}


