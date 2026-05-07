'use client';

import { useEffect, useState } from 'react';
import { playersAPI } from '@/lib/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOptions>({ type: 'all' });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await playersAPI.getAll();
      const playersData = response.data;

      const enrichedPlayers = await Promise.all(
        playersData.map(async (player: any) => {
          const stats = player.matchPlayers || [];
          return { ...player, stats };
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

    if (activeFilter.type === 'year' && activeFilter.yearValue) {
      stats = stats.filter((mp: any) => mp.match?.competition?.season?.year === activeFilter.yearValue);
    } else if (activeFilter.type === 'tournament' && activeFilter.tournamentId) {
      stats = stats.filter((mp: any) => mp.match?.competition?.season?.tournament?.id === activeFilter.tournamentId);
    } else if (activeFilter.type === 'competition' && activeFilter.competitionId) {
      stats = stats.filter((mp: any) => mp.match?.competition?.id === activeFilter.competitionId);
    }

    let totalGoals = 0, totalRating = 0, matchCount = 0, yellowCards = 0, redCards = 0;

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
      if (mp.cards) {
        if (mp.cards === 'Y' || mp.cards === 'Amarilla') yellowCards++;
        else if (mp.cards === 'R' || mp.cards === 'Roja') redCards++;
        else if (mp.cards.includes('Doble')) redCards++;
      }
    });

    return {
      goals: totalGoals,
      rating: matchCount > 0 ? totalRating / matchCount : null,
      matches: stats.length,
      yellowCards,
      redCards,
    };
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 md:mb-6">Plantilla del Equipo</h1>

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
          <div className="px-4 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => {
                const stats = getPlayerStats(player);
                return (
                  <PlayerStats
                    key={player.id}
                    id={player.id}
                    filter={activeFilter}
                    name={player.name}
                    number={player.number}
                    goals={stats.goals}
                    rating={stats.rating}
                    matches={stats.matches}
                  />
                );
              })}
            </div>
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
              .slice(0, 5)
              .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between border-b pb-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <span className="font-bold text-sm md:text-lg text-red-600 flex-shrink-0">#{index + 1}</span>
                    <span className="text-gray-800 truncate">{player.name} (#{player.number})</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {player.yellowCards > 0 && <span className="text-lg">{player.yellowCards}🟨</span>}
                    {player.redCards > 0 && <span className="text-lg">{player.redCards}🟥</span>}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {!loading && players.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">
            Valoraciones Generales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs md:text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-2 md:p-3 font-semibold text-gray-700">Jugador</th>
                  <th className="text-center p-2 md:p-3 font-semibold text-gray-700">Partidos</th>
                  <th className="text-center p-2 md:p-3 font-semibold text-gray-700">Promedio</th>
                  <th className="text-center p-2 md:p-3 font-semibold text-gray-700">Goles</th>
                  <th className="text-center p-2 md:p-3 font-semibold text-gray-700">Tarjetas</th>
                </tr>
              </thead>
              <tbody>
                {players
                  .map((player) => {
                    const stats = getPlayerStats(player);
                    return {
                      ...player,
                      stats,
                    };
                  })
                  .sort((a, b) => {
                    if (a.stats.rating === null && b.stats.rating === null) return 0;
                    if (a.stats.rating === null) return 1;
                    if (b.stats.rating === null) return -1;
                    return b.stats.rating - a.stats.rating;
                  })
                  .map((player) => (
                    <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 md:p-3 text-gray-800 font-medium">
                        {player.name} (#{player.number})
                      </td>
                      <td className="p-2 md:p-3 text-center text-gray-700">{player.stats.matches}</td>
                      <td className="p-2 md:p-3 text-center font-bold text-blue-700">
                        {player.stats.rating !== null ? player.stats.rating.toFixed(2) : 'S/N'}
                      </td>
                      <td className="p-2 md:p-3 text-center text-gray-700">{player.stats.goals}</td>
                      <td className="p-2 md:p-3 text-center text-gray-700">
                        {player.stats.yellowCards + player.stats.redCards}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
