'use client';

import { useState, useEffect } from 'react';
import { matchesAPI, matchPlayersAPI, ratingsAPI, judgesAPI, teamAPI, guestJudgesAPI, guestRatingsAPI, photosAPI } from '@/lib/api';
import PhotoUpload from './PhotoUpload';

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
}

export default function AdminRatingForm() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [guestJudges, setGuestJudges] = useState<GuestJudge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  
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

  // Load judges and matches
  useEffect(() => {
    const loadData = async () => {
      try {
        const judgesRes = await judgesAPI.getAll();
        setJudges(judgesRes.data);

        const teamRes = await teamAPI.getTeam();
        const matchesRes = await matchesAPI.getAll(undefined, teamRes.data.id);
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
          const response = await matchPlayersAPI.getByMatch(selectedMatch);
          setMatchPlayers(response.data);
          
          // Load guest judges for this match
          const guestJudgesRes = await guestJudgesAPI.getByMatch(selectedMatch);
          setGuestJudges(guestJudgesRes.data);
          
          // Load photos for this match
          const photosRes = await photosAPI.getByMatch(selectedMatch);
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

  const selectedMatchData = matches.find(m => m.id === selectedMatch);
  const selectedPlayerData = matchPlayers.find(p => p.id === selectedPlayer);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold">Valoraciones de Jueces</h3>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Selecciona Partido</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Elige un partido</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.opponent} - {m.date} ({m.goalsFor}-{m.goalsAgainst})
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <>
          {/* Guest Judges Section */}
          <div className="space-y-3 p-4 border rounded bg-amber-50">
            <h4 className="text-sm font-semibold text-amber-900">Jueces Invitados</h4>
            <p className="text-xs text-amber-700">
              Agrega jueces temporales para este partido. Sus valoraciones tendrán la misma validez que los jueces principales.
            </p>
            
            {/* List of guest judges */}
            {guestJudges.length > 0 && (
              <div className="space-y-2">
                {guestJudges.map(gj => (
                  <div key={gj.id} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm font-medium">{gj.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGuestJudge(gj.id, gj.name)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add new guest judge */}
            <div className="flex gap-2">
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
                className="flex-1 p-2 border rounded text-sm"
              />
              <button
                type="button"
                onClick={handleAddGuestJudge}
                disabled={addingGuestJudge || !newGuestJudgeName.trim()}
                className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
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
            <div className="space-y-3 p-4 border rounded bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-800">Fotos del Partido ({photos.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt="Match photo"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={deletingPhoto === photo.id}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Selecciona Jugador</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Elige un jugador</option>
              {matchPlayers.map(mp => (
                <option key={mp.id} value={mp.id}>
                  #{mp.player.number} - {mp.player.name} ({mp.position})
                  {mp.goals > 0 ? ` ⚽${mp.goals}` : ''}
                  {mp.cards ? ` 🟨${mp.cards}` : ''}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {selectedPlayer && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-600">
            <p className="text-sm mb-2">
              <span className="font-medium">{selectedPlayerData?.player.name}</span>
              {' '}({'posición: ' + selectedPlayerData?.position}) - {selectedMatchData?.opponent}
            </p>
            {(Object.values(ratings).filter(r => r).length > 0 || Object.values(guestRatings).filter(r => r).length > 0) ? (
              <p className="text-xs text-blue-700 font-semibold">
                ✓ {Object.values(ratings).filter(r => r).length + Object.values(guestRatings).filter(r => r).length} valoración(es) en progreso
              </p>
            ) : (
              <p className="text-xs text-blue-700">
                Sin valoraciones previas - ingresa las nuevas
              </p>
            )}
          </div>

          {/* Goals and Cards Section */}
          <div className="p-4 border rounded bg-gray-50 space-y-3">
            <h4 className="font-medium text-sm">Estadísticas del Partido</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goles</label>
                <input
                  type="number"
                  value={goals}
                  onChange={(e) => setGoals(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarjetas</label>
                <select
                  value={cards}
                  onChange={(e) => setCards(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sin tarjetas</option>
                  <option value="Y">Amarilla (Y)</option>
                  <option value="R">Roja (R)</option>
                  <option value="YY">Doble Amarilla (YY)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Jueces Principales</h4>
            {judges.map(judge => (
              <div key={judge.id} className={`p-3 border rounded ${ratings[judge.id] ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                <label className="block text-sm font-medium mb-2">
                  {judge.name}
                </label>
                <input
                  type="number"
                  value={ratings[judge.id] || ''}
                  onChange={(e) => handleRatingChange(judge.id, e.target.value)}
                  min="1"
                  max="10"
                  step="0.5"
                  placeholder="Ej: 8.5"
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            
            {/* Guest Judges Ratings */}
            {guestJudges.length > 0 && (
              <>
                <h4 className="font-medium text-sm mt-4 text-amber-900">Jueces Invitados</h4>
                {guestJudges.map(guestJudge => (
                  <div key={guestJudge.id} className={`p-3 border rounded ${guestRatings[guestJudge.id] ? 'bg-amber-50 border-amber-300' : 'bg-gray-50'}`}>
                    <label className="block text-sm font-medium mb-2">
                      {guestJudge.name}
                      <span className="ml-2 text-xs text-amber-600">(invitado)</span>
                    </label>
                    <input
                      type="number"
                      value={guestRatings[guestJudge.id] || ''}
                      onChange={(e) => handleGuestRatingChange(guestJudge.id, e.target.value)}
                      min="1"
                      max="10"
                      step="0.5"
                      placeholder="Ej: 8.5"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm">
              <span className="font-semibold">Promedio de Valoración:</span> {calculateAverage()}/10
              {(Object.values(ratings).filter(r => r).length > 0 || Object.values(guestRatings).filter(r => r).length > 0) && (
                <span className="text-xs text-gray-600 ml-2">
                  ({Object.values(ratings).filter(r => r).length + Object.values(guestRatings).filter(r => r).length} jueces)
                </span>
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Valoraciones'}
          </button>
        </div>
      )}
    </form>
  );
}
