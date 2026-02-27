'use client';

import { useEffect, useState } from 'react';
import { playersAPI, teamAPI, seasonsAPI, competitionsAPI } from '@/lib/api';
import PlayerStats from '@/components/PlayerStats';
import PlayerStatsFilters, { FilterOptions } from '@/components/PlayerStatsFilters';

interface Player {
  id: string;
  name: string;
  number: number;
  matchPlayers: any[];
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [jerseyUrl, setJerseyUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOptions>({ type: 'all' });

  useEffect(() => {
    fetchPlayersAndJersey();
  }, []);

  const fetchPlayersAndJersey = async () => {
    try {
      setLoading(true);

      // Get team
      const teamRes = await teamAPI.getTeam();
      const teamId = teamRes.data.id;

      // Get current season (assuming current year)
      const currentYear = new Date().getFullYear();
      const seasonsRes = await seasonsAPI.getAll();
      const currentSeason = seasonsRes.data.find((s: any) => s.year === currentYear);

      if (currentSeason) {
        // Get active competition for this season
        const competitionsRes = await competitionsAPI.getActive(currentSeason.id);
        if (competitionsRes.data?.jerseyUrl) {
          setJerseyUrl(competitionsRes.data.jerseyUrl);
        }
      }

      // Get players
      const response = await playersAPI.getAll();
      const playersData = response.data;

      // Enrich players with stats
      const enrichedPlayers = await Promise.all(
        playersData.map(async (player: any) => {
          const stats = player.matchPlayers || [];
          return {
            ...player,
            stats,
          };
        })
      );

      setPlayers(enrichedPlayers);
      setError(null);
    } catch (err) {
      setError('Error al cargar los jugadores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerStats = (player: Player) => {
    let stats = player.matchPlayers || [];

    // Aplicar filtros
    if (activeFilter.type === 'year' && activeFilter.yearValue) {
      stats = stats.filter((mp: any) => 
        mp.match?.competition?.season?.year === activeFilter.yearValue
      );
    } else if (activeFilter.type === 'tournament' && activeFilter.tournamentId) {
      stats = stats.filter((mp: any) => 
        mp.match?.competition?.season?.tournament?.id === activeFilter.tournamentId
      );
    } else if (activeFilter.type === 'competition' && activeFilter.competitionId) {
      stats = stats.filter((mp: any) => 
        mp.match?.competition?.id === activeFilter.competitionId
      );
    }

    let totalGoals = 0;
    let totalRating = 0;
    let matchCount = 0;
    let yellowCards = 0;
    let redCards = 0;

    stats.forEach((mp: any) => {
      totalGoals += mp.goals || 0;
      const regularRatings = mp.ratings || [];
      const guestRatings = mp.guestRatings || [];
      const totalRatingsCount = regularRatings.length + guestRatings.length;
      
      if (totalRatingsCount > 0) {
        const regularTotal = regularRatings.reduce((sum: number, r: any) => sum + r.score, 0);
        const guestTotal = guestRatings.reduce((sum: number, r: any) => sum + r.score, 0);
        const avgRating = (regularTotal + guestTotal) / totalRatingsCount;
        totalRating += avgRating;
        matchCount++;
      }
      // Contar tarjetas
      if (mp.cards) {
        if (mp.cards === 'Y' || mp.cards === 'Amarilla') {
          yellowCards++;
        } else if (mp.cards === 'R' || mp.cards === 'Roja') {
          redCards++;
        } else if (mp.cards.includes('Doble')) {
          redCards++; // Doble tarjeta cuenta como roja
        }
      }
    });

    const goalsPerMatch = stats.length > 0 ? totalGoals / stats.length : 0;

    return {
      goals: totalGoals,
      rating: matchCount > 0 ? totalRating / matchCount : 0,
      matches: stats.length,
      yellowCards,
      redCards,
      goalsPerMatch,
    };
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 md:mb-6">Plantilla del Equipo</h1>

        {/* Filtros */}
        <div className="mb-6">
          <PlayerStatsFilters onFilterChange={setActiveFilter} />
        </div>

        {loading && (
          <div className="text-center py-8 md:py-12">
            <p className="text-xs md:text-sm text-gray-600">Cargando jugadores...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 md:px-4 md:py-3 rounded text-xs md:text-sm">
            {error}
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 md:px-4 md:py-3 rounded text-xs md:text-sm">
            No hay jugadores registrados aún.
          </div>
        )}

        {!loading && players.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const stats = getPlayerStats(player);
              return (
                <PlayerStats
                  key={player.id}
                  name={player.name}
                  number={player.number}
                  goals={stats.goals}
                  rating={stats.rating}
                  matches={stats.matches}
                  jerseyUrl={jerseyUrl}
                />
              );
            })}
          </div>
        )}
      </section>

      {!loading && players.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">Top Goleadores</h2>
          <div className="space-y-2 md:space-y-3">
            {players
              .map((player) => ({
                ...player,
                goals: player.matchPlayers?.reduce((sum: number, mp: any) => sum + (mp.goals || 0), 0) || 0,
              }))
              .sort((a, b) => b.goals - a.goals)
              .slice(0, 5)
              .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between border-b pb-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <span className="font-bold text-sm md:text-lg text-blue-600 flex-shrink-0">#{index + 1}</span>
                    <span className="text-gray-800 truncate">{player.name} (#{player.number})</span>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-green-600 flex-shrink-0 ml-2">{player.goals}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {!loading && players.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">Amonestaciones</h2>
          <div className="space-y-2 md:space-y-3">
            {players
              .map((player) => {
                const stats = getPlayerStats(player);
                return {
                  ...player,
                  totalCards: stats.yellowCards + stats.redCards,
                  yellowCards: stats.yellowCards,
                  redCards: stats.redCards,
                };
              })
              .filter((p) => p.totalCards > 0)
              .sort((a, b) => b.totalCards - a.totalCards)
              .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between border-b pb-2 hover:bg-gray-50 px-2 py-1 text-xs md:text-sm">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <span className="font-bold text-sm md:text-lg text-blue-600 flex-shrink-0">#{index + 1}</span>
                    <span className="text-gray-800 font-medium truncate">{player.name} (#{player.number})</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    {player.yellowCards > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-base md:text-lg">🟨</span>
                        <span className="text-xs md:text-sm font-semibold text-gray-700">{player.yellowCards}</span>
                      </div>
                    )}
                    {player.redCards > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-base md:text-lg">🟥</span>
                        <span className="text-xs md:text-sm font-semibold text-gray-700">{player.redCards}</span>
                      </div>
                    )}
                    {player.totalCards === 0 && (
                      <span className="text-xs text-gray-500">Sin tarjetas</span>
                    )}
                  </div>
                </div>
              ))}
            {players.map((p) => getPlayerStats(p)).every((s) => s.yellowCards === 0 && s.redCards === 0) && (
              <div className="text-center py-4 text-xs md:text-sm text-gray-500">
                <p>Todos los jugadores tienen un buen comportamiento disciplinario</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && players.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">Mejor Promedio de Gol</h2>
          <div className="space-y-2 md:space-y-3">
            {players
              .map((player) => {
                const stats = getPlayerStats(player);
                return {
                  ...player,
                  goalsPerMatch: stats.goalsPerMatch,
                  goals: stats.goals,
                  matches: stats.matches,
                };
              })
              .filter((p) => p.matches > 0)
              .sort((a, b) => b.goalsPerMatch - a.goalsPerMatch)
              .slice(0, 5)
              .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between border-b pb-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <span className="font-bold text-sm md:text-lg text-blue-600 flex-shrink-0">#{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-800 block truncate">{player.name} (#{player.number})</span>
                      <span className="text-xs md:text-xs text-gray-500">({player.goals}g en {player.matches}p)</span>
                    </div>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-orange-600 flex-shrink-0 ml-2">{player.goalsPerMatch.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {!loading && players.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">Estadísticas Completas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Goles</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Valo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players
                  .map((player) => {
                    const stats = getPlayerStats(player);
                    return {
                      ...player,
                      stats,
                    };
                  })
                  .sort((a, b) => b.stats.rating - a.stats.rating)
                  .map((player) => {
                    const ratingColor =
                      player.stats.rating >= 8
                        ? 'text-green-600'
                        : player.stats.rating >= 6
                          ? 'text-blue-600'
                          : player.stats.rating >= 4
                            ? 'text-yellow-600'
                            : player.stats.rating > 0
                              ? 'text-red-600'
                              : 'text-gray-400';
                    return (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                          {player.number}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-bold text-gray-900 truncate">
                          {player.name}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-center text-blue-600 font-semibold">
                          {player.stats.matches}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-center text-green-600 font-semibold">
                          {player.stats.goals}
                        </td>
                        <td className={`px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-center font-bold ${ratingColor}`}>
                          {player.stats.rating > 0 ? player.stats.rating.toFixed(2) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
