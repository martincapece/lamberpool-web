'use client';

import { useState, useEffect } from 'react';
import { matchPlayersAPI, matchesAPI } from '@/lib/api';

interface MatchPlayer {
  id: string;
  playerId: string;
  matchId: string;
  position: string;
  goals: number;
  cards: string;
  averageRating?: number;
  ratings?: { score: number }[];
  guestRatings?: { score: number }[];
  player: {
    name: string;
    number: number;
  };
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
}

interface Props {
  matchId?: string;
}

const ratingTone = (rating: number) => {
  if (rating >= 8) return 'bg-emerald-500 text-white';
  if (rating >= 6) return 'bg-yellow-500 text-gray-900';
  if (rating >= 4) return 'bg-orange-500 text-white';
  if (rating > 0) return 'bg-red-500 text-white';
  return 'bg-gray-300 text-gray-700';
};

const getRating = (player: MatchPlayer) => {
  if (typeof player.averageRating === 'number') {
    return player.averageRating;
  }
  
  const regularRatings = player.ratings || [];
  const guestRatings = player.guestRatings || [];
  const totalRatings = regularRatings.length + guestRatings.length;
  
  if (totalRatings === 0) {
    return 0;
  }
  
  const regularTotal = regularRatings.reduce((sum, r) => sum + r.score, 0);
  const guestTotal = guestRatings.reduce((sum, r) => sum + r.score, 0);
  
  return parseFloat(((regularTotal + guestTotal) / totalRatings).toFixed(2));
};

export default function MatchLineupViewer({ matchId: propMatchId }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const response = await matchesAPI.getAll();
        setMatches(response.data);
        // Si se proporciona matchId como prop, úsalo automáticamente
        if (propMatchId) {
          setSelectedMatch(propMatchId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadMatches();
  }, [propMatchId]);

  useEffect(() => {
    if (selectedMatch) {
      const loadLineup = async () => {
        try {
          const response = await matchPlayersAPI.getByMatch(selectedMatch);
          setMatchPlayers(response.data);
        } catch (err) {
          console.error(err);
        }
      };
      loadLineup();
    } else {
      setMatchPlayers([]);
    }
  }, [selectedMatch]);

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  // Agrupar jugadores por línea
  const goalkeeper = matchPlayers.filter(mp => mp.position === 'GK');
  const defenders = matchPlayers.filter(mp => mp.position.startsWith('DEF_'));
  const midfielders = matchPlayers.filter(mp => mp.position.startsWith('MID_'));
  const forwards = matchPlayers.filter(mp => mp.position.startsWith('FWD'));
  const bench = matchPlayers.filter(mp => mp.position === 'BENCH');

  const PlayerCard = ({ player }: { player: MatchPlayer }) => {
    const rating = getRating(player);
    return (
      <div className="flex flex-col items-center space-y-1">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-base md:text-xl shadow-lg border-2 border-white">
          {player.player.number}
        </div>
        <p className="font-bold text-white text-xs md:text-sm text-center leading-tight drop-shadow-lg">{player.player.name}</p>
        <div className="flex items-center gap-0.5 md:gap-1.5">
          <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-bold shadow ${ratingTone(rating)}`}>
            {rating === 0 ? 'S/N' : rating.toFixed(1)}
          </span>
          {player.goals > 0 && (
            <span className="text-[10px] md:text-xs bg-green-500 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-bold shadow">
              ⚽{player.goals}
            </span>
          )}
          {player.cards && (
            <span className="text-[10px] md:text-xs bg-yellow-400 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow">
              {player.cards === 'Y' ? '🟨' : player.cards === 'R' ? '🟥' : `🟨${player.cards}`}
            </span>
          )}
        </div>
      </div>
    );
  };

  const BenchPlayerCard = ({ player }: { player: MatchPlayer }) => {
    const rating = getRating(player);
    return (
      <div className="bg-gray-700 text-white rounded-lg p-2 md:p-3 flex flex-col items-center space-y-1 shadow">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-base border-2 border-gray-500">
          {player.player.number}
        </div>
        <p className="font-semibold text-[10px] md:text-xs text-center leading-tight">{player.player.name}</p>
        <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-bold ${ratingTone(rating)}`}>
          {rating === 0 ? 'S/N' : rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Función para ordenar jugadores por posición
  const sortByPosition = (players: MatchPlayer[]) => {
    const order: Record<string, number> = {
      // Para formación 2-4-1
      'DEF_C1': 1, 'DEF_C2': 2,
      'MID_L': 1, 'MID_C1': 2, 'MID_C2': 3, 'MID_R': 4,
      // Para formación 3-3-1
      'DEF_L': 1, 'DEF_C': 2, 'DEF_R': 3,
    };
    return [...players].sort((a, b) => (order[a.position] || 0) - (order[b.position] || 0));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {!propMatchId && (
        <div>
          <label className="block text-xs md:text-sm font-medium mb-2">Selecciona un Partido</label>
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="w-full p-2 md:p-3 border rounded text-xs md:text-sm"
          >
            <option value="">Elige un partido</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.opponent} - {new Date(m.date).toLocaleDateString('es-ES')} ({m.goalsFor}-{m.goalsAgainst})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedMatch && selectedMatchData && (
        <div className="space-y-4 md:space-y-6">
          {/* Header del partido */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-xl md:text-3xl font-bold">Lamberpool FC vs {selectedMatchData.opponent}</h2>
            <p className="text-xs md:text-sm text-blue-100 mt-1">{new Date(selectedMatchData.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-3xl md:text-4xl font-bold mt-3">
              {selectedMatchData.goalsFor} - {selectedMatchData.goalsAgainst}
            </p>
          </div>

          {/* Campo de Fútbol Horizontal */}
          <div className="w-full mx-auto">
            <div className="relative bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-3 md:p-6 shadow-xl" style={{ minHeight: '400px', maxHeight: '600px' }}>
              {/* Líneas del campo */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Línea del medio vertical */}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" opacity="0.6" />
                {/* Círculo central */}
                <circle cx="50%" cy="50%" r="60" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                <circle cx="50%" cy="50%" r="3" fill="white" opacity="0.8" />
                {/* Área izquierda */}
                <rect x="2%" y="20%" width="15%" height="60%" stroke="white" strokeWidth="2" fill="none" opacity="0.4" />
                {/* Área derecha */}
                <rect x="83%" y="20%" width="15%" height="60%" stroke="white" strokeWidth="2" fill="none" opacity="0.4" />
              </svg>

              <div className="relative flex items-center justify-between px-2 md:px-8 gap-2 md:gap-4" style={{ minHeight: '400px', maxHeight: '600px' }}>
                {/* Arquero - Izquierda */}
                {goalkeeper.length > 0 && (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <div className="flex flex-col gap-3 md:gap-6">
                      {goalkeeper.map(player => <PlayerCard key={player.id} player={player} />)}
                    </div>
                  </div>
                )}

                {/* Defensas */}
                {defenders.length > 0 && (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <div className="flex flex-col gap-3 md:gap-6">
                      {sortByPosition(defenders).map(player => <PlayerCard key={player.id} player={player} />)}
                    </div>
                  </div>
                )}

                {/* Mediocampistas */}
                {midfielders.length > 0 && (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <div className="flex flex-col gap-3 md:gap-6">
                      {sortByPosition(midfielders).map(player => <PlayerCard key={player.id} player={player} />)}
                    </div>
                  </div>
                )}

                {/* Delanteros - Derecha */}
                {forwards.length > 0 && (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <div className="flex flex-col gap-3 md:gap-6">
                      {forwards.map(player => <PlayerCard key={player.id} player={player} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banco de Suplentes */}
          {bench.length > 0 && (
            <div className="w-full mx-auto">
              <div className="bg-gray-800 rounded-lg p-3 md:p-4 shadow-xl">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <span className="text-sm md:text-base font-bold text-white uppercase tracking-wide">💺 Banco de Suplentes</span>
                </div>
                <div className="flex gap-2 md:gap-3 flex-wrap">
                  {bench.map(player => <BenchPlayerCard key={player.id} player={player} />)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
