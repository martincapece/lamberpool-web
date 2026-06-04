'use client';

import { useState, useEffect, useMemo } from 'react';
import { matchesAPI, matchPlayersAPI, ratingsAPI, judgesAPI, teamAPI, guestJudgesAPI, guestRatingsAPI, photosAPI } from '@/lib/api';
import PhotoUpload from './PhotoUpload';
import AdminFeedbackModal from './AdminFeedbackModal';

interface Judge {
  id: string;
  name: string;
}

interface GuestJudge {
  id: string;
  name: string;
  matchId: string;
}

interface MatchPlayer {
  id: string;
  playerId: string;
  matchId: string;
  goals: number;
  cards: string;
  position: string;
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
  status?: 'PLAYED' | 'CANCELED';
}

export default function AdminRatingForm() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [guestJudges, setGuestJudges] = useState<GuestJudge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [matchSearch, setMatchSearch] = useState('');
  const [isMatchMenuOpen, setIsMatchMenuOpen] = useState(false);
  const [focusedMatchIndex, setFocusedMatchIndex] = useState(-1);
  
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [guestRatings, setGuestRatings] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState(0);
  const [cards, setCards] = useState('');
  
  const [newGuestJudgeName, setNewGuestJudgeName] = useState('');
  const [addingGuestJudge, setAddingGuestJudge] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatCardsLabel = (cardsValue: string) => {
    if (cardsValue === 'Y') return '🟨';
    if (cardsValue === 'R') return '🟥';
    if (cardsValue === 'YY') return '🟨🟥';
    return cardsValue;
  };

  const formatMatchDate = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredMatches = useMemo(() => {
    const search = matchSearch.trim().toLowerCase();
    if (!search) {
      return matches;
    }

    return matches.filter((match) => {
      const label = `${match.opponent} ${formatMatchDate(match.date)}`.toLowerCase();
      return label.includes(search);
    });
  }, [matches, matchSearch]);

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  const getMatchPrimaryLabel = (match: Match) => `${match.opponent} - ${formatMatchDate(match.date)}`;

  const getMatchSecondaryLabel = (match: Match) =>
    `Resultado: ${match.goalsFor}-${match.goalsAgainst}${match.status === 'CANCELED' ? ' • Cancelado' : ''}`;

  const resetMatchSelectionState = () => {
    setSelectedMatch('');
    setSelectedPlayer('');
    setMatchPlayers([]);
    setGuestJudges([]);
    setPhotos([]);
    setRatings({});
    setGuestRatings({});
    setGoals(0);
    setCards('');
  };

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match.id);
    setMatchSearch('');
    setIsMatchMenuOpen(false);
    setFocusedMatchIndex(-1);
  };

  const handleMatchInputChange = (value: string) => {
    const selectedLabel = selectedMatchData ? getMatchPrimaryLabel(selectedMatchData) : '';

    if (selectedMatch && value !== selectedLabel) {
      resetMatchSelectionState();
    }

    setMatchSearch(value);
    setIsMatchMenuOpen(true);
    setFocusedMatchIndex(filteredMatches.length > 0 ? 0 : -1);
  };

  const handleMatchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsMatchMenuOpen(true);
      setFocusedMatchIndex((current) => {
        if (filteredMatches.length === 0) {
          return -1;
        }

        return current < filteredMatches.length - 1 ? current + 1 : current;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedMatchIndex((current) => (current > 0 ? current - 1 : 0));
      return;
    }

    if (event.key === 'Enter') {
      if (isMatchMenuOpen && focusedMatchIndex >= 0 && filteredMatches[focusedMatchIndex]) {
        event.preventDefault();
        handleMatchSelect(filteredMatches[focusedMatchIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsMatchMenuOpen(false);
      setFocusedMatchIndex(-1);
    }
  };

  useEffect(() => {
    if (!isMatchMenuOpen) {
      setFocusedMatchIndex(-1);
      return;
    }

    if (filteredMatches.length === 0) {
      setFocusedMatchIndex(-1);
      return;
    }

    setFocusedMatchIndex((current) => {
      if (current < 0) {
        return 0;
      }

      return current >= filteredMatches.length ? filteredMatches.length - 1 : current;
    });
  }, [filteredMatches.length, isMatchMenuOpen]);

  // Load judges and matches
  useEffect(() => {
    const loadData = async () => {
      try {
        const teamRes = await teamAPI.getTeam();
        const [judgesRes, matchesRes] = await Promise.all([
          judgesAPI.getAll(),
          matchesAPI.getAll(undefined, teamRes.data.id),
        ]);
        setJudges(judgesRes.data);
        setMatches(matchesRes.data);
      } catch (err) {
        setError('Error al cargar los datos');
      }
    };
    loadData();
  }, []);

  // Load match players when match changes
  useEffect(() => {
    if (selectedMatch) {
      const loadMatchPlayers = async () => {
        try {
          const [matchPlayersRes, guestJudgesRes, photosRes] = await Promise.all([
            matchPlayersAPI.getByMatch(selectedMatch),
            guestJudgesAPI.getByMatch(selectedMatch),
            photosAPI.getByMatch(selectedMatch),
          ]);
          setMatchPlayers(matchPlayersRes.data);
          setGuestJudges(guestJudgesRes.data);
          setPhotos(photosRes.data || []);
          
          setSelectedPlayer('');
          setRatings({});
          setGuestRatings({});
          setGoals(0);
          setCards('');
        } catch (err) {
          setError('Error al cargar los jugadores del partido');
        }
      };
      loadMatchPlayers();
    }
  }, [selectedMatch]);

  // Load existing ratings when player changes
  useEffect(() => {
    if (selectedPlayer) {
      const loadRatings = async () => {
        try {
          const response = await ratingsAPI.getByMatchPlayer(selectedPlayer);
          const ratingsMap: Record<string, string> = {};
          response.data.forEach((r: any) => {
            ratingsMap[r.judgeId] = r.score.toString();
          });
          setRatings(ratingsMap);
          console.log('Ratings cargadas:', ratingsMap);
          
          // Load guest ratings
          const guestRatingsRes = await guestRatingsAPI.getByMatchPlayer(selectedPlayer);
          const guestRatingsMap: Record<string, string> = {};
          guestRatingsRes.data.forEach((r: any) => {
            guestRatingsMap[r.guestJudgeId] = r.score.toString();
          });
          setGuestRatings(guestRatingsMap);
          console.log('Guest ratings cargadas:', guestRatingsMap);

          // Load goals and cards for this match player
          const playerData = matchPlayers.find(mp => mp.id === selectedPlayer);
          if (playerData) {
            setGoals(playerData.goals);
            setCards(playerData.cards);
          }
        } catch (err) {
          // No ratings yet, start with empty object
          console.log('Sin valoraciones previas, campo vacío');
          setRatings({});
          setGuestRatings({});
          
          // Still load goals and cards
          const playerData = matchPlayers.find(mp => mp.id === selectedPlayer);
          if (playerData) {
            setGoals(playerData.goals);
            setCards(playerData.cards);
          }
        }
      };
      loadRatings();
    }
  }, [selectedPlayer, matchPlayers]);

  const handleRatingChange = (judgeId: string, value: string) => {
    setRatings(prev => ({
      ...prev,
      [judgeId]: value,
    }));
  };

  const handleGuestRatingChange = (guestJudgeId: string, value: string) => {
    setGuestRatings(prev => ({
      ...prev,
      [guestJudgeId]: value,
    }));
  };

  const handleAddGuestJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGuestJudgeName.trim()) {
      setError('Ingresa el nombre del juez invitado');
      return;
    }
    
    if (!selectedMatch) {
      setError('Debes seleccionar un partido primero');
      return;
    }

    setAddingGuestJudge(true);
    setError('');

    try {
      const response = await guestJudgesAPI.create({
        matchId: selectedMatch,
        name: newGuestJudgeName.trim(),
      });
      
      setGuestJudges(prev => [...prev, response.data]);
      setNewGuestJudgeName('');
      setSuccess(`Juez invitado "${response.data.name}" añadido exitosamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error añadiendo juez invitado:', err);
      setError(err.response?.data?.error || 'Error al añadir juez invitado');
    } finally {
      setAddingGuestJudge(false);
    }
  };

  const handleDeleteGuestJudge = async (guestJudgeId: string, name: string) => {
    if (!confirm(`¿Eliminar juez invitado "${name}"? Esto también eliminará sus valoraciones.`)) {
      return;
    }

    try {
      await guestJudgesAPI.delete(guestJudgeId);
      setGuestJudges(prev => prev.filter(gj => gj.id !== guestJudgeId));
      
      // Remove ratings for this guest judge
      setGuestRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[guestJudgeId];
        return newRatings;
      });
      
      setSuccess(`Juez invitado "${name}" eliminado`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error eliminando juez invitado:', err);
      setError(err.response?.data?.error || 'Error al eliminar juez invitado');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('¿Eliminar esta foto?')) {
      return;
    }

    setDeletingPhoto(photoId);
    try {
      await photosAPI.delete(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSuccess('Foto eliminada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error eliminando foto:', err);
      setError(err.response?.data?.error || 'Error al eliminar foto');
    } finally {
      setDeletingPhoto('');
    }
  };

  const handlePhotoUploaded = async () => {
    // Refresh photos list
    if (selectedMatch) {
      try {
        const photosRes = await photosAPI.getByMatch(selectedMatch);
        setPhotos(photosRes.data || []);
      } catch (err) {
        console.error('Error al recargar fotos:', err);
      }
    }
  };

  const calculateAverage = () => {
    const regularScores = Object.values(ratings).filter(r => r).map(r => parseFloat(r));
    const guestScores = Object.values(guestRatings).filter(r => r).map(r => parseFloat(r));
    const allScores = [...regularScores, ...guestScores];
    
    if (allScores.length === 0) return 0;
    return (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMatch) {
      setError('Selecciona un partido');
      return;
    }
    
    if (!selectedPlayer) {
      setError('Selecciona un jugador');
      return;
    }

    const ratingsToSubmit = Object.entries(ratings).filter(([_, score]) => score);
    const guestRatingsToSubmit = Object.entries(guestRatings).filter(([_, score]) => score);
    
    if (ratingsToSubmit.length === 0 && guestRatingsToSubmit.length === 0) {
      setError('Ingresa al menos una valoración');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update goals and cards first
      await matchPlayersAPI.update(selectedPlayer, {
        goals,
        cards,
      });

      // Submit regular ratings
      await Promise.all(
        ratingsToSubmit.map(([judgeId, score]) =>
          ratingsAPI.create({
            matchPlayerId: selectedPlayer,
            judgeId,
            score: parseFloat(score),
          })
        )
      );
      
      // Submit guest ratings
      await Promise.all(
        guestRatingsToSubmit.map(([guestJudgeId, score]) =>
          guestRatingsAPI.create({
            matchPlayerId: selectedPlayer,
            guestJudgeId,
            score: parseFloat(score),
          })
        )
      );

      setSuccess('¡Valoraciones, goles y tarjetas guardadas exitosamente!');
      
      // Reload match players to get updated stats
      const response = await matchPlayersAPI.getByMatch(selectedMatch);
      setMatchPlayers(response.data);
      
      setSelectedPlayer('');
      setRatings({});
      setGuestRatings({});
      setGoals(0);
      setCards('');
    } catch (err: any) {
      console.error('Error guardando valoraciones:', err);
      // If it's a duplicate error, clear the success state
      if (err.response?.status === 400 && err.response?.data?.error?.includes('duplicate')) {
        setError('Este juez ya ha valorado a este jugador. Contacta al admin para modificar.');
      } else {
        setError(err.response?.data?.error || 'Error al guardar las valoraciones');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPlayerData = matchPlayers.find(p => p.id === selectedPlayer);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminFeedbackModal
        isOpen={Boolean(error || success)}
        title={error ? 'Operacion fallida' : 'Operacion exitosa'}
        message={error || success}
        tone={error ? 'error' : 'success'}
        onClose={() => {
          setError('');
          setSuccess('');
        }}
      />

      <h3 className="text-lg md:text-xl font-semibold">Valoraciones de Jueces</h3>

      <div>
        <label className="block text-xs md:text-sm font-medium mb-2">Selecciona Partido</label>
        <div className="relative">
          <input
            type="text"
            value={isMatchMenuOpen ? matchSearch : selectedMatchData ? getMatchPrimaryLabel(selectedMatchData) : ''}
            onChange={(e) => handleMatchInputChange(e.target.value)}
            onFocus={() => setIsMatchMenuOpen(true)}
            onBlur={() => {
              window.setTimeout(() => {
                setIsMatchMenuOpen(false);
              }, 150);
            }}
            onKeyDown={handleMatchKeyDown}
            placeholder="Buscar por rival o fecha"
            className={`w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${
              isMatchMenuOpen ? 'rounded-b-none border-b-0' : ''
            }`}
            role="combobox"
            aria-expanded={isMatchMenuOpen}
            aria-controls="match-results-listbox"
            aria-autocomplete="list"
            autoComplete="off"
          />

          {isMatchMenuOpen && (
            <div
              id="match-results-listbox"
              className="absolute z-20 mt-0 w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-300 bg-white shadow-lg"
              role="listbox"
            >
              <div className="max-h-[32rem] overflow-y-auto">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match, index) => (
                    <button
                      key={match.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleMatchSelect(match);
                      }}
                      onMouseEnter={() => setFocusedMatchIndex(index)}
                      className={`w-full border-l-4 px-4 py-2 text-left transition ${
                        selectedMatch === match.id
                          ? 'border-green-600 bg-green-50'
                          : index === focusedMatchIndex
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-transparent hover:bg-gray-50'
                      }`}
                      role="option"
                      aria-selected={selectedMatch === match.id}
                    >
                      <div className="truncate text-sm font-medium text-gray-900">{match.opponent}</div>
                      <div className="text-xs text-gray-600">
                        {formatMatchDate(match.date)} • {getMatchSecondaryLabel(match)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500">No se encontraron partidos.</div>
                )}
              </div>

              {filteredMatches.length > 15 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
                  Mostrando los partidos filtrados en un menú con scroll. Desliza para ver más resultados.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <>
          {/* Guest Judges Section */}
          <div className="space-y-3 p-4 md:p-6 border rounded bg-amber-50">
            <h4 className="text-xs md:text-sm font-semibold text-amber-900">Jueces Invitados</h4>
            <p className="text-[10px] md:text-xs text-amber-700">
              Agrega jueces temporales para este partido. Sus valoraciones tendrán la misma validez que los jueces principales.
            </p>
            
            {/* List of guest judges */}
            {guestJudges.length > 0 && (
              <div className="space-y-2">
                {guestJudges.map(gj => (
                  <div key={gj.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3 md:p-4 rounded border">
                    <span className="text-xs md:text-sm font-medium text-gray-900 flex-1 break-words">{gj.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGuestJudge(gj.id, gj.name)}
                      className="w-full md:w-auto text-white bg-red-600 hover:bg-red-700 text-xs px-3 py-2 md:px-4 md:py-2 rounded transition font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add new guest judge */}
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newGuestJudgeName}
                onChange={(e) => setNewGuestJudgeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newGuestJudgeName.trim() && !addingGuestJudge) {
                      handleAddGuestJudge(e as any);
                    }
                  }
                }}
                placeholder="Nombre del juez invitado"
                className="flex-1 px-4 py-3 md:py-2 border rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddGuestJudge}
                disabled={addingGuestJudge || !newGuestJudgeName.trim()}
                className="w-full md:w-auto bg-amber-600 text-white px-4 py-3 md:py-2 rounded text-xs md:text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
              >
                {addingGuestJudge ? 'Añadiendo...' : 'Agregar Juez'}
              </button>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <PhotoUpload 
              matchId={selectedMatch} 
              onPhotoUploaded={handlePhotoUploaded}
            />
          </div>

          {/* Photos Gallery */}
          {photos.length > 0 && (
            <div className="space-y-3 p-4 md:p-6 border rounded bg-gray-50">
              <h4 className="text-xs md:text-sm font-semibold text-gray-800">Fotos del Partido ({photos.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group aspect-square">
                    <img
                      src={photo.url}
                      alt="Match photo"
                      className="w-full h-full object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={deletingPhoto === photo.id}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Selecciona Jugador</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              required
              className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="">Elige un jugador</option>
              {matchPlayers.map(mp => (
                <option key={mp.id} value={mp.id}>
                  #{mp.player.number} - {mp.player.name} ({mp.position})
                  {mp.goals > 0 ? ` ⚽${mp.goals}` : ''}
                  {mp.cards ? ` ${formatCardsLabel(mp.cards)}` : ''}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {selectedPlayer && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 md:p-6 rounded border-l-4 border-blue-600 space-y-2">
            <p className="text-xs md:text-sm mb-2">
              <span className="font-medium">{selectedPlayerData?.player.name}</span>
              {' '}({'posición: ' + selectedPlayerData?.position}) - {selectedMatchData?.opponent}
            </p>
            {(Object.values(ratings).filter(r => r).length > 0 || Object.values(guestRatings).filter(r => r).length > 0) ? (
              <p className="text-[10px] md:text-xs text-blue-700 font-semibold">
                ✓ {Object.values(ratings).filter(r => r).length + Object.values(guestRatings).filter(r => r).length} valoración(es) en progreso
              </p>
            ) : (
              <p className="text-[10px] md:text-xs text-blue-700">
                Sin valoraciones previas - ingresa las nuevas
              </p>
            )}
          </div>

          {/* Goals and Cards Section */}
          <div className="p-4 md:p-6 border rounded bg-gray-50 space-y-3 md:space-y-4">
            <h4 className="font-medium text-sm md:text-base">Estadísticas del Partido</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Goles</label>
                <input
                  type="number"
                  value={goals}
                  onChange={(e) => setGoals(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-3 md:py-2 border rounded text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Tarjetas</label>
                <select
                  value={cards}
                  onChange={(e) => setCards(e.target.value)}
                  className="w-full px-4 py-3 md:py-2 border rounded text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin tarjetas</option>
                  <option value="Y">Amarilla (Y)</option>
                  <option value="R">Roja (R)</option>
                  <option value="YY">Doble Amarilla (YY)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm md:text-base">Jueces Principales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              {judges.map(judge => (
                <div key={judge.id} className={`p-3 border rounded transition-colors ${ratings[judge.id] ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                  <label className="block text-xs md:text-sm font-medium mb-2 text-gray-900">
                    {judge.name}
                  </label>
                  <input
                    type="number"
                    value={ratings[judge.id] || ''}
                    onChange={(e) => handleRatingChange(judge.id, e.target.value)}
                    min="-10"
                    max="10"
                    step="0.5"
                    placeholder="Ej: 8.5"
                    className="w-full px-4 py-3 md:py-2 border rounded text-sm md:text-base [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] md:text-xs text-gray-500 mt-2">Incluye .5</p>
                </div>
              ))}
            </div>
            
            {/* Guest Judges Ratings */}
            {guestJudges.length > 0 && (
              <>
                <h4 className="font-medium text-sm md:text-base mt-6 text-amber-900">Jueces Invitados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                  {guestJudges.map(guestJudge => (
                    <div key={guestJudge.id} className={`p-3 border rounded transition-colors ${guestRatings[guestJudge.id] ? 'bg-amber-50 border-amber-300' : 'bg-gray-50'}`}>
                      <label className="block text-xs md:text-sm font-medium mb-2 text-gray-900">
                        {guestJudge.name}
                        <span className="ml-1 text-[10px] md:text-xs text-amber-600 font-normal">(inv.)</span>
                      </label>
                      <input
                        type="number"
                        value={guestRatings[guestJudge.id] || ''}
                        onChange={(e) => handleGuestRatingChange(guestJudge.id, e.target.value)}
                        min="-10"
                        max="10"
                        step="0.5"
                        placeholder="Ej: 8.5"
                        className="w-full px-4 py-3 md:py-2 border rounded text-sm md:text-base [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[10px] md:text-xs text-gray-500 mt-2">Incluye .5</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-gray-100 p-4 md:p-6 rounded">
            <p className="text-xs md:text-sm font-semibold">
              Promedio de Valoración: <span className="text-lg md:text-xl">{calculateAverage()}/10</span>
              {(Object.values(ratings).filter(r => r).length > 0 || Object.values(guestRatings).filter(r => r).length > 0) && (
                <span className="text-[10px] md:text-xs text-gray-600 ml-2 block md:inline-block mt-1 md:mt-0">
                  ({Object.values(ratings).filter(r => r).length + Object.values(guestRatings).filter(r => r).length} jueces)
                </span>
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 md:py-2 bg-indigo-600 text-white rounded font-medium text-sm md:text-base hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Guardando...' : 'Guardar Valoraciones'}
          </button>
        </div>
      )}
    </form>
  );
}
