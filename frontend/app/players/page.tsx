'use client';

import { useEffect, useMemo, useState } from 'react';
import { playersAPI } from '@/lib/api';
import PlayerStats from '@/components/PlayerStats';
import PlayerStatsFilters, { FilterOptions } from '@/components/PlayerStatsFilters';
import PlayerComparisonChart from '@/components/PlayerComparisonChart';
import PlayerSearchSelect from '@/components/PlayerSearchSelect';

interface Player {
  id: string;
  name: string;
  number: number;
  matchPlayers: any[];
}

type ComparisonMetric = 'rating' | 'goals' | 'cards' | 'combined';

interface ComparisonRequest {
  playerAId: string;
  playerBId: string;
  metric: ComparisonMetric;
}

const ELO_BASE = 1000;
const ELO_K = 24;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOptions>({ type: 'all' });
  const [minMatchesForTable, setMinMatchesForTable] = useState(0);
  const [selectedPlayerAId, setSelectedPlayerAId] = useState('');
  const [selectedPlayerBId, setSelectedPlayerBId] = useState('');
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>('rating');
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonRequest, setComparisonRequest] = useState<ComparisonRequest | null>(null);

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
    const stats = getFilteredMatchPlayers(player.matchPlayers || []);

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

  const getFilteredMatchPlayers = (matchPlayers: any[]) => {
    let filtered = matchPlayers;

    if (activeFilter.type === 'year' && activeFilter.yearValue) {
      filtered = filtered.filter((mp: any) => mp.match?.competition?.season?.year === activeFilter.yearValue);
    } else if (activeFilter.type === 'tournament' && activeFilter.tournamentId) {
      filtered = filtered.filter((mp: any) => mp.match?.competition?.season?.tournament?.id === activeFilter.tournamentId);
    } else if (activeFilter.type === 'competition' && activeFilter.competitionId) {
      filtered = filtered.filter((mp: any) => mp.match?.competition?.id === activeFilter.competitionId);
    }

    return filtered;
  };

  const formatShortDate = (dateValue?: string) => {
    if (!dateValue) {
      return '--/--';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return '--/--';
    }

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getCardPenalty = (cards?: string) => {
    if (!cards) {
      return 0;
    }

    if (cards === 'R' || cards === 'Roja' || cards.includes('Doble')) {
      return 2;
    }

    if (cards === 'Y' || cards === 'Amarilla') {
      return 1;
    }

    return 0;
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getMatchId = (matchPlayer: any): string | null => matchPlayer.matchId || matchPlayer.match?.id || null;

  const getAverageRating = (matchPlayer: any): number | null => {
    const regularRatings = matchPlayer.ratings || [];
    const guestRatings = matchPlayer.guestRatings || [];
    const totalRatingsCount = regularRatings.length + guestRatings.length;

    if (totalRatingsCount === 0) {
      return null;
    }

    const regularTotal = regularRatings.reduce((sum: number, r: any) => sum + r.score, 0);
    const guestTotal = guestRatings.reduce((sum: number, r: any) => sum + r.score, 0);
    return (regularTotal + guestTotal) / totalRatingsCount;
  };

  const getMetricValue = (matchPlayer: any, metric: ComparisonMetric): number | null => {
    const avgRating = getAverageRating(matchPlayer);
    const goals = matchPlayer.goals || 0;
    const cardPenalty = getCardPenalty(matchPlayer.cards);

    if (metric === 'rating') {
      return avgRating;
    }

    if (metric === 'goals') {
      return goals;
    }

    if (metric === 'cards') {
      return -cardPenalty;
    }

    return avgRating;
  };

  const getEffectivenessScore = (matchPlayer: any): number => {
    const avgRating = getAverageRating(matchPlayer);
    const goals = matchPlayer.goals || 0;
    const cardPenalty = getCardPenalty(matchPlayer.cards);

    const ratingScore = avgRating === null ? 0.5 : clamp((avgRating - 1) / 9, 0, 1);
    const goalsScore = clamp(goals / 3, 0, 1);
    const disciplineScore = cardPenalty === 0 ? 1 : cardPenalty === 1 ? 0.5 : 0;

    return clamp(ratingScore * 0.55 + goalsScore * 0.3 + disciplineScore * 0.15, 0, 1);
  };

  const getMetricLabel = (metric: ComparisonMetric) => {
    if (metric === 'rating') return 'Rating Promedio';
    if (metric === 'goals') return 'Goles por partido';
    if (metric === 'cards') return 'Impacto por tarjetas';
    return 'Indice combinado ELO de efectividad';
  };

  const playersWithStats = useMemo(
    () =>
      players.map((player) => ({
        ...player,
        stats: getPlayerStats(player),
      })),
    [players, activeFilter]
  );

  const tablePlayers = useMemo(
    () =>
      playersWithStats
        .filter((player) => player.stats.matches >= minMatchesForTable)
        .sort((a, b) => (b.stats.rating ?? -Infinity) - (a.stats.rating ?? -Infinity)),
    [playersWithStats, minMatchesForTable]
  );

  const playerSelectOptions = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [players]
  );

  const comparisonResult = useMemo(() => {
    if (!comparisonRequest) {
      return null;
    }

    const playerA = players.find((player) => player.id === comparisonRequest.playerAId);
    const playerB = players.find((player) => player.id === comparisonRequest.playerBId);

    if (!playerA || !playerB) {
      return null;
    }

    const playerAMatches = getFilteredMatchPlayers(playerA.matchPlayers || []);
    const playerBMatches = getFilteredMatchPlayers(playerB.matchPlayers || []);

    const playerBByMatchId = new Map(
      playerBMatches
        .map((mp: any) => ({ matchId: getMatchId(mp), mp }))
        .filter((entry: any) => entry.matchId)
        .map((entry: any) => [entry.matchId, entry.mp])
    );

    const sharedMatches = playerAMatches
      .map((playerAMatch: any) => ({
        matchId: getMatchId(playerAMatch),
        playerAMatch,
      }))
      .filter((entry: any) => entry.matchId && playerBByMatchId.has(entry.matchId))
      .map((entry: any) => {
        const playerBMatch = playerBByMatchId.get(entry.matchId);
        const playerAMatch = entry.playerAMatch;
        const date = playerAMatch.match?.date || playerBMatch?.match?.date;
        const opponent = playerAMatch.match?.opponent || playerBMatch?.match?.opponent || 'Rival no informado';
        const competitionName =
          playerAMatch.match?.competition?.name || playerBMatch?.match?.competition?.name || 'Competencia';
        const goalsFor = playerAMatch.match?.goalsFor ?? playerBMatch?.match?.goalsFor;
        const goalsAgainst = playerAMatch.match?.goalsAgainst ?? playerBMatch?.match?.goalsAgainst;
        const score =
          goalsFor !== undefined && goalsAgainst !== undefined
            ? ` ${goalsFor}-${goalsAgainst}`
            : '';

        return {
          matchId: entry.matchId,
          label: `${formatShortDate(date)} vs ${opponent}${score} (${competitionName})`,
          shortLabel: `${formatShortDate(date)} ${opponent}`,
          date,
          playerAMatch,
          playerBMatch,
        };
      })
      .sort((a: any, b: any) => {
        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;
        return aDate - bDate;
      });

    const sharedPoints =
      comparisonRequest.metric === 'combined'
        ? (() => {
            let eloA = ELO_BASE;
            let eloB = ELO_BASE;

            return sharedMatches.map((match: any) => {
              const perfA = getEffectivenessScore(match.playerAMatch);
              const perfB = getEffectivenessScore(match.playerBMatch);

              const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
              const expectedB = 1 - expectedA;

              const perfTotal = perfA + perfB;
              const actualA = perfTotal > 0 ? perfA / perfTotal : 0.5;
              const actualB = perfTotal > 0 ? perfB / perfTotal : 0.5;

              eloA += ELO_K * (actualA - expectedA);
              eloB += ELO_K * (actualB - expectedB);

              return {
                matchId: match.matchId,
                label: match.label,
                shortLabel: match.shortLabel,
                date: match.date,
                playerAValue: Number(eloA.toFixed(2)),
                playerBValue: Number(eloB.toFixed(2)),
              };
            });
          })()
        : sharedMatches.map((match: any) => ({
            matchId: match.matchId,
            label: match.label,
            shortLabel: match.shortLabel,
            date: match.date,
            playerAValue: getMetricValue(match.playerAMatch, comparisonRequest.metric),
            playerBValue: getMetricValue(match.playerBMatch, comparisonRequest.metric),
          }));

    const playerAValues = sharedPoints
      .map((point: any) => point.playerAValue)
      .filter((value: number | null): value is number => value !== null);
    const playerBValues = sharedPoints
      .map((point: any) => point.playerBValue)
      .filter((value: number | null): value is number => value !== null);

    const playerAAverage =
      playerAValues.length > 0
        ? playerAValues.reduce((sum: number, value: number) => sum + value, 0) / playerAValues.length
        : null;
    const playerBAverage =
      playerBValues.length > 0
        ? playerBValues.reduce((sum: number, value: number) => sum + value, 0) / playerBValues.length
        : null;

    return {
      playerA,
      playerB,
      metricLabel: getMetricLabel(comparisonRequest.metric),
      points: sharedPoints,
      playerAAverage,
      playerBAverage,
    };
  }, [comparisonRequest, players, activeFilter]);

  const handleComparePlayers = () => {
    if (!selectedPlayerAId || !selectedPlayerBId) {
      setComparisonError('Selecciona los dos jugadores para comparar.');
      return;
    }

    if (selectedPlayerAId === selectedPlayerBId) {
      setComparisonError('Selecciona dos jugadores distintos para comparar.');
      return;
    }

    setComparisonError(null);
    setComparisonRequest({
      playerAId: selectedPlayerAId,
      playerBId: selectedPlayerBId,
      metric: comparisonMetric,
    });
  };

  const handleClearComparison = () => {
    setSelectedPlayerAId('');
    setSelectedPlayerBId('');
    setComparisonMetric('rating');
    setComparisonError(null);
    setComparisonRequest(null);
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
              {playersWithStats.map((player) => {
                const stats = player.stats;
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
              .map((player) => {
                const stats = playersWithStats.find((p) => p.id === player.id)?.stats;
                return {
                  ...player,
                  goals: stats?.goals || 0,
                };
              })
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
                const stats = playersWithStats.find((p) => p.id === player.id)?.stats;
                return {
                  ...player,
                  totalCards: (stats?.yellowCards || 0) + (stats?.redCards || 0),
                  yellowCards: stats?.yellowCards || 0,
                  redCards: stats?.redCards || 0,
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
        <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-1">Comparador de Rendimiento</h2>
            <p className="text-sm text-gray-600">
              Compara dos jugadores en partidos compartidos segun los filtros activos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <PlayerSearchSelect
              id="playerASelect"
              label="Jugador A"
              placeholder="Escribe para buscar"
              options={playerSelectOptions}
              selectedId={selectedPlayerAId}
              onSelect={setSelectedPlayerAId}
              excludeId={selectedPlayerBId}
            />

            <PlayerSearchSelect
              id="playerBSelect"
              label="Jugador B"
              placeholder="Escribe para buscar"
              options={playerSelectOptions}
              selectedId={selectedPlayerBId}
              onSelect={setSelectedPlayerBId}
              excludeId={selectedPlayerAId}
            />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="comparisonMetricSelect">
                Metrica
              </label>
              <select
                id="comparisonMetricSelect"
                value={comparisonMetric}
                onChange={(e) => setComparisonMetric(e.target.value as ComparisonMetric)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent"
              >
                <option value="rating">Rating promedio</option>
                <option value="goals">Goles por partido</option>
                <option value="cards">Impacto por tarjetas</option>
                <option value="combined">Indice combinado ELO</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleComparePlayers}
                className="w-full px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition"
              >
                Comparar
              </button>
              <button
                type="button"
                onClick={handleClearComparison}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
              >
                Limpiar
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            En Indice combinado ELO se pondera rating, goles y disciplina (menos tarjetas mejora el puntaje).
          </p>

          {comparisonError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{comparisonError}</div>
          )}

          {!comparisonError && comparisonRequest && comparisonResult && comparisonResult.points.length === 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Los jugadores seleccionados no tienen partidos en comun con el filtro actual.
            </div>
          )}

          {!comparisonError && comparisonResult && comparisonResult.points.length > 0 && (
            <div className="space-y-3">
              <PlayerComparisonChart
                points={comparisonResult.points}
                playerALabel={comparisonResult.playerA.name}
                playerBLabel={comparisonResult.playerB.name}
                metricLabel={comparisonResult.metricLabel}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <p className="font-semibold text-sky-900">{comparisonResult.playerA.name}</p>
                  <p className="text-sky-800">
                    Promedio del periodo:{' '}
                    {comparisonResult.playerAAverage !== null
                      ? comparisonResult.playerAAverage.toFixed(2)
                      : 'Sin datos'}
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="font-semibold text-rose-900">{comparisonResult.playerB.name}</p>
                  <p className="text-rose-800">
                    Promedio del periodo:{' '}
                    {comparisonResult.playerBAverage !== null
                      ? comparisonResult.playerBAverage.toFixed(2)
                      : 'Sin datos'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {!loading && players.length > 0 && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-blue-900 mb-3 md:mb-4">Estadísticas Completas</h2>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="text-sm text-gray-700 font-medium" htmlFor="minMatchesForTable">
              Mostrar jugadores con mínimo de partidos
            </label>
            <input
              id="minMatchesForTable"
              type="number"
              min={0}
              value={minMatchesForTable}
              onChange={(e) => setMinMatchesForTable(Number(e.target.value) || 0)}
              className="w-full sm:w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500">
              Mostrando {tablePlayers.length} de {playersWithStats.length} jugadores
            </p>
          </div>
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
                  .length > 0 && tablePlayers.map((player) => {
                    const ratingColor =
                      player.stats.rating === null
                        ? 'text-gray-400'
                        : player.stats.rating >= 8
                          ? 'text-green-600'
                          : player.stats.rating >= 6
                            ? 'text-blue-600'
                            : player.stats.rating >= 4
                              ? 'text-yellow-600'
                              : player.stats.rating > 0
                                ? 'text-red-600'
                                : player.stats.rating < 0
                                  ? 'text-purple-600'
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
                          {player.stats.rating !== null ? player.stats.rating.toFixed(2) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {tablePlayers.length === 0 && (
              <p className="text-sm text-gray-500 py-4">No hay jugadores que cumplan ese mínimo de partidos.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
