'use client';

import { useState, useEffect } from 'react';
import { matchesAPI, matchPlayersAPI } from '@/lib/api';

interface Match {
  id: string;
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  youtubeUrl?: string;
}

interface MatchPlayer {
  id: string;
  playerId: string;
  position: string;
  player: {
    name: string;
    number: number;
  };
}

type FormationKey = '2-4-1' | '3-3-1';

interface FormationSlot {
  id: string;
  label: string;
}

const formationSlotsMap: Record<FormationKey, FormationSlot[]> = {
  '2-4-1': [
    { id: 'GK', label: 'Arquero' },
    { id: 'DEF_C1', label: 'Defensa Central' },
    { id: 'DEF_C2', label: 'Defensa Central' },
    { id: 'MID_L', label: 'Medio Izquierdo' },
    { id: 'MID_C1', label: 'Medio Central' },
    { id: 'MID_C2', label: 'Medio Central' },
    { id: 'MID_R', label: 'Medio Derecho' },
    { id: 'FWD', label: 'Delantero' },
  ],
  '3-3-1': [
    { id: 'GK', label: 'Arquero' },
    { id: 'DEF_L', label: 'Defensa Izquierdo' },
    { id: 'DEF_C', label: 'Defensa Central' },
    { id: 'DEF_R', label: 'Defensa Derecho' },
    { id: 'MID_L', label: 'Medio Izquierdo' },
    { id: 'MID_C', label: 'Medio Central' },
    { id: 'MID_R', label: 'Medio Derecho' },
    { id: 'FWD', label: 'Delantero' },
  ],
};

export default function AdminMatchManagement() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [formationKey, setFormationKey] = useState<FormationKey>('2-4-1');
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});
  
  // Nuevos estados para goles y YouTube
  const [matchScoreForm, setMatchScoreForm] = useState({
    goalsFor: 0,
    goalsAgainst: 0,
    youtubeUrl: '',
  });
  const [savingScore, setSavingScore] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await matchesAPI.getAll();
      setMatches(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedMatch) {
      loadMatchPlayers();
      // Cargar datos del partido para el formulario de goles/youtube
      const match = matches.find(m => m.id === selectedMatch);
      if (match) {
        setMatchScoreForm({
          goalsFor: match.goalsFor,
          goalsAgainst: match.goalsAgainst,
          youtubeUrl: match.youtubeUrl || '',
        });
      }
    } else {
      setMatchPlayers([]);
      setSlotAssignments({});
      setMatchScoreForm({ goalsFor: 0, goalsAgainst: 0, youtubeUrl: '' });
    }
  }, [selectedMatch, matches]);

  const loadMatchPlayers = async () => {
    try {
      const response = await matchPlayersAPI.getByMatch(selectedMatch);
      const players = response.data;
      setMatchPlayers(players);

      // Cargar las posiciones actuales en slotAssignments
      const assignments: Record<string, string> = {};
      players.forEach((mp: MatchPlayer) => {
        if (mp.position !== 'BENCH') {
          assignments[mp.position] = mp.id;
        }
      });
      setSlotAssignments(assignments);

      // Detectar formación actual (cuenta defensas)
      const defCount = players.filter((mp: MatchPlayer) => mp.position.startsWith('DEF_')).length;
      setFormationKey(defCount === 2 ? '2-4-1' : '3-3-1');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = (slotId: string, matchPlayerId: string) => {
    setSlotAssignments((prev) => ({ ...prev, [slotId]: matchPlayerId }));
  };

  const handleSavePositions = async () => {
    if (!selectedMatch) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Actualizar cada jugador con su nueva posición
      await Promise.all(
        matchPlayers.map((mp) => {
          const newPosition = Object.keys(slotAssignments).find(
            (slotId) => slotAssignments[slotId] === mp.id
          ) || 'BENCH';
          
          return matchPlayersAPI.update(mp.id, { position: newPosition });
        })
      );

      setSuccess('¡Posiciones actualizadas exitosamente!');
      loadMatchPlayers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar posiciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScore = async () => {
    if (!selectedMatch) return;

    setSavingScore(true);
    setError('');
    setSuccess('');

    try {
      await matchesAPI.update(selectedMatch, {
        goalsFor: matchScoreForm.goalsFor,
        goalsAgainst: matchScoreForm.goalsAgainst,
        youtubeUrl: matchScoreForm.youtubeUrl || null,
      });

      setSuccess('¡Resultado y YouTube actualizados exitosamente!');
      loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar resultado');
    } finally {
      setSavingScore(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!selectedMatch) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await matchesAPI.delete(selectedMatch);
      setSuccess('¡Partido eliminado exitosamente!');
      setShowDeleteConfirm(false);
      setSelectedMatch('');
      loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar el partido');
    } finally {
      setDeleting(false);
    }
  };

  const slots = formationSlotsMap[formationKey];
  const assignedIds = new Set(Object.values(slotAssignments).filter(Boolean));
  const benchPlayers = matchPlayers.filter((mp) => !assignedIds.has(mp.id));
  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Gestionar Posiciones de Partidos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona un partido para modificar las posiciones de los jugadores en la formación.
        </p>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Selecciona Partido</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Elige un partido</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.opponent} - {new Date(m.date).toLocaleDateString('es-ES')} ({m.goalsFor}-{m.goalsAgainst})
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && selectedMatchData && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-600">
            <h4 className="font-bold text-lg">
              Lamberpool FC vs {selectedMatchData.opponent}
            </h4>
            <p className="text-sm text-gray-600">
              {new Date(selectedMatchData.date).toLocaleDateString('es-ES')} - 
              Resultado: {selectedMatchData.goalsFor}-{selectedMatchData.goalsAgainst}
            </p>
          </div>

          {/* Sección de edición de goles y YouTube */}
          <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-300 space-y-4">
            <h4 className="text-md font-semibold text-amber-900">📊 Editar Resultado y Video</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goles a Favor</label>
                <input
                  type="number"
                  value={matchScoreForm.goalsFor}
                  onChange={(e) => setMatchScoreForm({ ...matchScoreForm, goalsFor: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full p-2 border rounded text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goles en Contra</label>
                <input
                  type="number"
                  value={matchScoreForm.goalsAgainst}
                  onChange={(e) => setMatchScoreForm({ ...matchScoreForm, goalsAgainst: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full p-2 border rounded text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
                <div className="flex items-center justify-center text-3xl font-bold text-blue-600 h-10 bg-white border rounded">
                  {matchScoreForm.goalsFor} - {matchScoreForm.goalsAgainst}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link YouTube (opcional)</label>
              <input
                type="url"
                value={matchScoreForm.youtubeUrl}
                onChange={(e) => setMatchScoreForm({ ...matchScoreForm, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full p-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Puedes agregar o modificar el link en cualquier momento</p>
            </div>

            <button
              onClick={handleSaveScore}
              disabled={savingScore}
              className="w-full bg-amber-600 text-white p-3 rounded font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {savingScore ? '⏳ Guardando...' : '💾 Guardar Resultado y Video'}
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold">Formación y Posiciones</h4>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Formación:</label>
                <select
                  value={formationKey}
                  onChange={(e) => {
                    setFormationKey(e.target.value as FormationKey);
                    setSlotAssignments({});
                  }}
                  className="p-2 border rounded"
                >
                  <option value="2-4-1">2-4-1</option>
                  <option value="3-3-1">3-3-1</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {/* Arquero */}
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Arquero</h5>
                {slots.filter(s => s.id === 'GK').map((slot) => {
                  const assigned = slotAssignments[slot.id] || '';
                  return (
                    <div key={slot.id} className="bg-white border-2 border-blue-300 rounded p-3">
                      <label className="block text-xs text-gray-600 mb-1">{slot.label}</label>
                      <select
                        value={assigned}
                        onChange={(e) => handleAssign(slot.id, e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="">Sin asignar</option>
                        {matchPlayers.map((mp) => (
                          <option
                            key={mp.id}
                            value={mp.id}
                            disabled={assignedIds.has(mp.id) && mp.id !== assigned}
                          >
                            #{mp.player.number} {mp.player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Defensas */}
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-green-800 uppercase tracking-wide">Defensas</h5>
                <div className="grid grid-cols-1 gap-2">
                  {slots.filter(s => s.id.startsWith('DEF_')).map((slot) => {
                    const assigned = slotAssignments[slot.id] || '';
                    return (
                      <div key={slot.id} className="bg-white border-2 border-green-300 rounded p-3">
                        <label className="block text-xs text-gray-600 mb-1">{slot.label}</label>
                        <select
                          value={assigned}
                          onChange={(e) => handleAssign(slot.id, e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="">Sin asignar</option>
                          {matchPlayers.map((mp) => (
                            <option
                              key={mp.id}
                              value={mp.id}
                              disabled={assignedIds.has(mp.id) && mp.id !== assigned}
                            >
                              #{mp.player.number} {mp.player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Medios */}
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">Mediocampistas</h5>
                <div className="grid grid-cols-1 gap-2">
                  {slots.filter(s => s.id.startsWith('MID_')).map((slot) => {
                    const assigned = slotAssignments[slot.id] || '';
                    return (
                      <div key={slot.id} className="bg-white border-2 border-yellow-300 rounded p-3">
                        <label className="block text-xs text-gray-600 mb-1">{slot.label}</label>
                        <select
                          value={assigned}
                          onChange={(e) => handleAssign(slot.id, e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="">Sin asignar</option>
                          {matchPlayers.map((mp) => (
                            <option
                              key={mp.id}
                              value={mp.id}
                              disabled={assignedIds.has(mp.id) && mp.id !== assigned}
                            >
                              #{mp.player.number} {mp.player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delanteros */}
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-red-800 uppercase tracking-wide">Ataque</h5>
                {slots.filter(s => s.id.startsWith('FWD')).map((slot) => {
                  const assigned = slotAssignments[slot.id] || '';
                  return (
                    <div key={slot.id} className="bg-white border-2 border-red-300 rounded p-3">
                      <label className="block text-xs text-gray-600 mb-1">{slot.label}</label>
                      <select
                        value={assigned}
                        onChange={(e) => handleAssign(slot.id, e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="">Sin asignar</option>
                        {matchPlayers.map((mp) => (
                          <option
                            key={mp.id}
                            value={mp.id}
                            disabled={assignedIds.has(mp.id) && mp.id !== assigned}
                          >
                            #{mp.player.number} {mp.player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suplentes */}
            {benchPlayers.length > 0 && (
              <div className="bg-gray-100 p-4 rounded">
                <h5 className="text-sm font-bold text-gray-800 mb-2">Suplentes</h5>
                <div className="flex flex-wrap gap-2">
                  {benchPlayers.map((mp) => (
                    <span key={mp.id} className="bg-white px-3 py-1 rounded border text-sm">
                      #{mp.player.number} {mp.player.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSavePositions}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Posiciones'}
            </button>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 text-white p-3 rounded font-medium hover:bg-red-700 transition"
              >
                🗑️ Eliminar Partido
              </button>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-red-600">
                      ⚠️ Confirmar eliminación
                    </h3>
                    <p className="text-gray-700">
                      ¿Estás seguro de que deseas eliminar este partido?
                    </p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                      <strong>Lamberpool FC vs {selectedMatchData?.opponent}</strong>
                      <br />
                      {new Date(selectedMatchData?.date || '').toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los datos asociados (jugadores, valoraciones, fotos).
                    </p>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteMatch}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
