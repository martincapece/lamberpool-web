'use client';

import { useEffect, useMemo, useState } from 'react';
import { matchesAPI, matchPlayersAPI, playersAPI, teamAPI } from '@/lib/api';
import AdminFeedbackModal from './AdminFeedbackModal';

interface Match {
  id: string;
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  youtubeUrl?: string | null;
  status?: 'PLAYED' | 'CANCELED';
  awardedTo?: 'LAMBERPOOL' | 'OPPONENT' | null;
  cancelReason?: string | null;
}

interface MatchPlayer {
  id: string;
  playerId: string;
  position: string;
  goals: number;
  cards: string;
  player: {
    name: string;
    number: number;
  };
}

interface Player {
  id: string;
  name: string;
  number: number;
}

type FormationKey = '2-4-1' | '3-3-1';
type MatchStatus = 'PLAYED' | 'CANCELED';

interface FormationSlot {
  id: string;
  label: string;
}

interface MatchFormState {
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  youtubeUrl: string;
  status: MatchStatus;
  awardedTo: 'LAMBERPOOL' | 'OPPONENT';
  cancelReason: string;
}

interface PlayerEditState {
  goals: number;
  cards: string;
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

const createEmptyMatchForm = (): MatchFormState => ({
  opponent: '',
  date: '',
  goalsFor: 0,
  goalsAgainst: 0,
  youtubeUrl: '',
  status: 'PLAYED',
  awardedTo: 'LAMBERPOOL',
  cancelReason: '',
});

const toDateInputValue = (value?: string) => {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
};

const applyCanceledScore = (awardedTo: 'LAMBERPOOL' | 'OPPONENT') => ({
  goalsFor: awardedTo === 'LAMBERPOOL' ? 3 : 0,
  goalsAgainst: awardedTo === 'LAMBERPOOL' ? 0 : 3,
});

export default function AdminMatchManagement() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [formationKey, setFormationKey] = useState<FormationKey>('2-4-1');
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});
  const [matchForm, setMatchForm] = useState<MatchFormState>(createEmptyMatchForm());
  const [playerEdits, setPlayerEdits] = useState<Record<string, PlayerEditState>>({});
  const [newPlayerId, setNewPlayerId] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [savingPlayers, setSavingPlayers] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const teamResponse = await teamAPI.getTeam();
        const [matchesResponse, playersResponse] = await Promise.all([
          matchesAPI.getAll(undefined, teamResponse.data.id),
          playersAPI.getAll(teamResponse.data.id),
        ]);
        setMatches(matchesResponse.data);
        setPlayers(playersResponse.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los partidos y jugadores');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedMatch) {
      setMatchPlayers([]);
      setSlotAssignments({});
      setPlayerEdits({});
      setMatchForm(createEmptyMatchForm());
      return;
    }

    const selectedMatchData = matches.find((match) => match.id === selectedMatch);
    if (selectedMatchData) {
      const awardedTo = selectedMatchData.awardedTo === 'OPPONENT' ? 'OPPONENT' : 'LAMBERPOOL';
      setMatchForm({
        opponent: selectedMatchData.opponent,
        date: toDateInputValue(selectedMatchData.date),
        goalsFor: selectedMatchData.goalsFor,
        goalsAgainst: selectedMatchData.goalsAgainst,
        youtubeUrl: selectedMatchData.youtubeUrl || '',
        status: selectedMatchData.status || 'PLAYED',
        awardedTo,
        cancelReason: selectedMatchData.cancelReason || '',
      });
    }

    const loadMatchPlayers = async () => {
      try {
        const response = await matchPlayersAPI.getByMatch(selectedMatch);
        const loadedPlayers = response.data;
        setMatchPlayers(loadedPlayers);

        const assignments: Record<string, string> = {};
        const edits: Record<string, PlayerEditState> = {};

        loadedPlayers.forEach((matchPlayer: MatchPlayer) => {
          if (matchPlayer.position !== 'BENCH') {
            assignments[matchPlayer.position] = matchPlayer.id;
          }

          edits[matchPlayer.id] = {
            goals: matchPlayer.goals,
            cards: matchPlayer.cards,
          };
        });

        setSlotAssignments(assignments);
        setPlayerEdits(edits);

        const defenders = loadedPlayers.filter((matchPlayer: MatchPlayer) => matchPlayer.position.startsWith('DEF_')).length;
        setFormationKey(defenders === 2 ? '2-4-1' : '3-3-1');
      } catch (err) {
        console.error(err);
        setError('Error al cargar los jugadores del partido');
      }
    };

    loadMatchPlayers();
  }, [selectedMatch, matches]);

  const slots = formationSlotsMap[formationKey];
  const assignedIds = new Set(Object.values(slotAssignments).filter(Boolean));
  const isCanceledMatch = matchForm.status === 'CANCELED';

  const benchPlayers = useMemo(
    () => matchPlayers.filter((matchPlayer) => !assignedIds.has(matchPlayer.id)),
    [assignedIds, matchPlayers]
  );

  const selectedMatchData = matches.find((match) => match.id === selectedMatch);
  const availablePlayers = players.filter(
    (player) => !matchPlayers.some((matchPlayer) => matchPlayer.playerId === player.id)
  );

  const handleAssign = (slotId: string, matchPlayerId: string) => {
    setSlotAssignments((previous) => ({ ...previous, [slotId]: matchPlayerId }));
  };

  const handlePlayerEditChange = (matchPlayerId: string, field: keyof PlayerEditState, value: string) => {
    setPlayerEdits((previous) => ({
      ...previous,
      [matchPlayerId]: {
        ...previous[matchPlayerId],
        [field]: field === 'goals' ? Math.max(0, parseInt(value || '0', 10) || 0) : value,
      },
    }));
  };

  const handleMatchFormChange = (field: keyof MatchFormState, value: string | number) => {
    setMatchForm((previous) => {
      const nextState = {
        ...previous,
        [field]: value,
      } as MatchFormState;

      if (field === 'status' && value === 'CANCELED') {
        return {
          ...nextState,
          ...applyCanceledScore(nextState.awardedTo),
        };
      }

      if (field === 'awardedTo' && nextState.status === 'CANCELED') {
        return {
          ...nextState,
          ...applyCanceledScore(value as 'LAMBERPOOL' | 'OPPONENT'),
        };
      }

      if (field === 'status' && value === 'PLAYED') {
        return {
          ...nextState,
          cancelReason: '',
        };
      }

      return nextState;
    });
  };

  const reloadMatches = async () => {
    const response = await matchesAPI.getAll();
    setMatches(response.data);
  };

  const reloadMatchPlayers = async () => {
    if (!selectedMatch) {
      return;
    }

    const response = await matchPlayersAPI.getByMatch(selectedMatch);
    setMatchPlayers(response.data);
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch) {
      return;
    }

    if (!matchForm.opponent.trim() || !matchForm.date) {
      setFeedback({
        title: 'Faltan datos del partido',
        message: 'Debes completar rival y fecha antes de guardar.',
        tone: 'error',
      });
      return;
    }

    try {
      setSavingMatch(true);
      setError('');
      await matchesAPI.update(selectedMatch, {
        opponent: matchForm.opponent,
        date: matchForm.date,
        goalsFor: matchForm.goalsFor,
        goalsAgainst: matchForm.goalsAgainst,
        youtubeUrl: matchForm.youtubeUrl || null,
        status: matchForm.status,
        awardedTo: matchForm.status === 'CANCELED' ? matchForm.awardedTo : undefined,
        cancelReason: matchForm.status === 'CANCELED' ? matchForm.cancelReason : undefined,
      });
      await reloadMatches();
      setFeedback({
        title: 'Partido actualizado',
        message: 'Los datos del partido se guardaron correctamente.',
        tone: 'success',
      });
    } catch (err: any) {
      setFeedback({
        title: 'No se pudo guardar el partido',
        message: err.response?.data?.error || 'Error al actualizar el partido',
        tone: 'error',
      });
    } finally {
      setSavingMatch(false);
    }
  };

  const handleSavePlayers = async () => {
    if (!selectedMatch) {
      return;
    }

    try {
      setSavingPlayers(true);
      setError('');
      await Promise.all(
        matchPlayers.map((matchPlayer) => {
          const newPosition = Object.keys(slotAssignments).find(
            (slotId) => slotAssignments[slotId] === matchPlayer.id
          ) || 'BENCH';

          return matchPlayersAPI.update(matchPlayer.id, {
            position: newPosition,
            goals: playerEdits[matchPlayer.id]?.goals ?? matchPlayer.goals,
            cards: playerEdits[matchPlayer.id]?.cards ?? matchPlayer.cards,
          });
        })
      );
      await reloadMatchPlayers();
      setFeedback({
        title: 'Jugadores actualizados',
        message: 'Las posiciones, goles y tarjetas del partido se guardaron correctamente.',
        tone: 'success',
      });
    } catch (err: any) {
      setFeedback({
        title: 'No se pudieron guardar los jugadores',
        message: err.response?.data?.error || 'Error al actualizar los jugadores del partido',
        tone: 'error',
      });
    } finally {
      setSavingPlayers(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedMatch || !newPlayerId) {
      return;
    }

    try {
      setAddingPlayer(true);
      await matchPlayersAPI.add({
        matchId: selectedMatch,
        playerId: newPlayerId,
        position: 'BENCH',
      });
      setNewPlayerId('');
      await reloadMatchPlayers();
      setFeedback({
        title: 'Jugador agregado',
        message: 'El jugador fue agregado al partido en el banco de suplentes.',
        tone: 'success',
      });
    } catch (err: any) {
      setFeedback({
        title: 'No se pudo agregar el jugador',
        message: err.response?.data?.error || 'Error al agregar el jugador al partido',
        tone: 'error',
      });
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleRemovePlayer = async (matchPlayerId: string, playerName: string) => {
    if (!confirm(`¿Quitar a ${playerName} de este partido?`)) {
      return;
    }

    try {
      await matchPlayersAPI.delete(matchPlayerId);
      await reloadMatchPlayers();
      setFeedback({
        title: 'Jugador quitado',
        message: `${playerName} fue eliminado del partido.`,
        tone: 'success',
      });
    } catch (err: any) {
      setFeedback({
        title: 'No se pudo quitar el jugador',
        message: err.response?.data?.error || 'Error al quitar el jugador del partido',
        tone: 'error',
      });
    }
  };

  const handleDeleteMatch = async () => {
    if (!selectedMatch) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await matchesAPI.delete(selectedMatch);
      setShowDeleteConfirm(false);
      setSelectedMatch('');
      await reloadMatches();
      setFeedback({
        title: 'Partido eliminado',
        message: 'El partido y sus datos asociados se eliminaron correctamente.',
        tone: 'success',
      });
    } catch (err: any) {
      setFeedback({
        title: 'No se pudo eliminar el partido',
        message: err.response?.data?.error || 'Error al eliminar el partido',
        tone: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminFeedbackModal
        isOpen={Boolean(feedback)}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        tone={feedback?.tone || 'info'}
        onClose={() => setFeedback(null)}
      />

      <div>
        <h3 className="text-lg font-semibold mb-4">Gestionar Partidos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Desde esta pantalla puedes corregir rival, fecha, estado del partido, video, jugadores, posiciones, goles y tarjetas.
        </p>
      </div>

      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Selecciona Partido</label>
        <select
          value={selectedMatch}
          onChange={(event) => setSelectedMatch(event.target.value)}
          className="w-full rounded border p-2"
          disabled={loading}
        >
          <option value="">Elige un partido</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.opponent} - {new Date(match.date).toLocaleDateString('es-ES')} ({match.goalsFor}-{match.goalsAgainst})
              {match.status === 'CANCELED' ? ' - Cancelado' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && selectedMatchData && (
        <div className="space-y-6">
          <div className="rounded border-l-4 border-blue-600 bg-blue-50 p-4">
            <h4 className="text-lg font-bold">Lamberpool FC vs {selectedMatchData.opponent}</h4>
            <p className="text-sm text-gray-600">
              {new Date(selectedMatchData.date).toLocaleDateString('es-ES')} - Resultado: {selectedMatchData.goalsFor}-{selectedMatchData.goalsAgainst}
            </p>
            {selectedMatchData.status === 'CANCELED' && (
              <p className="mt-2 text-sm font-medium text-amber-700">
                Partido cancelado. Favorable a {selectedMatchData.awardedTo === 'OPPONENT' ? selectedMatchData.opponent : 'Lamberpool FC'}.
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
            <h4 className="text-md font-semibold text-amber-900">Editar datos del partido</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rival</label>
                <input
                  type="text"
                  value={matchForm.opponent}
                  onChange={(event) => handleMatchFormChange('opponent', event.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={matchForm.date}
                  onChange={(event) => handleMatchFormChange('date', event.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>
            </div>

            <div className="rounded border border-amber-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Partido cancelado</p>
                  <p className="text-xs text-gray-500">Si lo marcas, el sistema fija automáticamente un 3-0 al equipo favorecido.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isCanceledMatch}
                  onChange={(event) => handleMatchFormChange('status', event.target.checked ? 'CANCELED' : 'PLAYED')}
                  className="h-5 w-5"
                />
              </div>

              {isCanceledMatch && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Equipo favorecido</label>
                    <select
                      value={matchForm.awardedTo}
                      onChange={(event) => handleMatchFormChange('awardedTo', event.target.value as 'LAMBERPOOL' | 'OPPONENT')}
                      className="w-full rounded border p-2"
                    >
                      <option value="LAMBERPOOL">Lamberpool FC</option>
                      <option value="OPPONENT">Rival</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Motivo o detalle</label>
                    <input
                      type="text"
                      value={matchForm.cancelReason}
                      onChange={(event) => handleMatchFormChange('cancelReason', event.target.value)}
                      className="w-full rounded border p-2"
                      placeholder="Ej: rival no se presento"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Goles a favor</label>
                <input
                  type="number"
                  min="0"
                  value={matchForm.goalsFor}
                  onChange={(event) => handleMatchFormChange('goalsFor', parseInt(event.target.value || '0', 10) || 0)}
                  disabled={isCanceledMatch}
                  className="w-full rounded border p-2 text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Goles en contra</label>
                <input
                  type="number"
                  min="0"
                  value={matchForm.goalsAgainst}
                  onChange={(event) => handleMatchFormChange('goalsAgainst', parseInt(event.target.value || '0', 10) || 0)}
                  disabled={isCanceledMatch}
                  className="w-full rounded border p-2 text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Resumen</label>
                <div className="flex h-10 items-center justify-center rounded border bg-white text-3xl font-bold text-blue-600">
                  {matchForm.goalsFor} - {matchForm.goalsAgainst}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Link YouTube</label>
              <input
                type="url"
                value={matchForm.youtubeUrl}
                onChange={(event) => handleMatchFormChange('youtubeUrl', event.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full rounded border p-2"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveMatch}
              disabled={savingMatch}
              className="w-full rounded bg-amber-600 p-3 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {savingMatch ? 'Guardando...' : 'Guardar datos del partido'}
            </button>
          </div>

          {!isCanceledMatch && (
            <div className="space-y-6 rounded-lg bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold">Formacion y jugadores</h4>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Formacion:</label>
                  <select
                    value={formationKey}
                    onChange={(event) => {
                      setFormationKey(event.target.value as FormationKey);
                      setSlotAssignments({});
                    }}
                    className="rounded border p-2"
                  >
                    <option value="2-4-1">2-4-1</option>
                    <option value="3-3-1">3-3-1</option>
                  </select>
                </div>
              </div>

              <div className="rounded border bg-white p-4">
                <h5 className="mb-3 text-sm font-semibold text-gray-800">Agregar jugador al partido</h5>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={newPlayerId}
                    onChange={(event) => setNewPlayerId(event.target.value)}
                    className="rounded border p-2"
                  >
                    <option value="">Selecciona un jugador disponible</option>
                    {availablePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        #{player.number} {player.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    disabled={!newPlayerId || addingPlayer}
                    className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {addingPlayer ? 'Agregando...' : 'Agregar al banco'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-blue-800">Arquero</h5>
                  {slots.filter((slot) => slot.id === 'GK').map((slot) => {
                    const assigned = slotAssignments[slot.id] || '';
                    return (
                      <div key={slot.id} className="rounded border-2 border-blue-300 bg-white p-3">
                        <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                        <select
                          value={assigned}
                          onChange={(event) => handleAssign(slot.id, event.target.value)}
                          className="w-full rounded border p-2 text-sm"
                        >
                          <option value="">Sin asignar</option>
                          {matchPlayers.map((matchPlayer) => (
                            <option
                              key={matchPlayer.id}
                              value={matchPlayer.id}
                              disabled={assignedIds.has(matchPlayer.id) && matchPlayer.id !== assigned}
                            >
                              #{matchPlayer.player.number} {matchPlayer.player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-green-800">Defensas</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {slots.filter((slot) => slot.id.startsWith('DEF_')).map((slot) => {
                      const assigned = slotAssignments[slot.id] || '';
                      return (
                        <div key={slot.id} className="rounded border-2 border-green-300 bg-white p-3">
                          <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                          <select
                            value={assigned}
                            onChange={(event) => handleAssign(slot.id, event.target.value)}
                            className="w-full rounded border p-2 text-sm"
                          >
                            <option value="">Sin asignar</option>
                            {matchPlayers.map((matchPlayer) => (
                              <option
                                key={matchPlayer.id}
                                value={matchPlayer.id}
                                disabled={assignedIds.has(matchPlayer.id) && matchPlayer.id !== assigned}
                              >
                                #{matchPlayer.player.number} {matchPlayer.player.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-yellow-800">Mediocampistas</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {slots.filter((slot) => slot.id.startsWith('MID_')).map((slot) => {
                      const assigned = slotAssignments[slot.id] || '';
                      return (
                        <div key={slot.id} className="rounded border-2 border-yellow-300 bg-white p-3">
                          <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                          <select
                            value={assigned}
                            onChange={(event) => handleAssign(slot.id, event.target.value)}
                            className="w-full rounded border p-2 text-sm"
                          >
                            <option value="">Sin asignar</option>
                            {matchPlayers.map((matchPlayer) => (
                              <option
                                key={matchPlayer.id}
                                value={matchPlayer.id}
                                disabled={assignedIds.has(matchPlayer.id) && matchPlayer.id !== assigned}
                              >
                                #{matchPlayer.player.number} {matchPlayer.player.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-red-800">Ataque</h5>
                  {slots.filter((slot) => slot.id.startsWith('FWD')).map((slot) => {
                    const assigned = slotAssignments[slot.id] || '';
                    return (
                      <div key={slot.id} className="rounded border-2 border-red-300 bg-white p-3">
                        <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                        <select
                          value={assigned}
                          onChange={(event) => handleAssign(slot.id, event.target.value)}
                          className="w-full rounded border p-2 text-sm"
                        >
                          <option value="">Sin asignar</option>
                          {matchPlayers.map((matchPlayer) => (
                            <option
                              key={matchPlayer.id}
                              value={matchPlayer.id}
                              disabled={assignedIds.has(matchPlayer.id) && matchPlayer.id !== assigned}
                            >
                              #{matchPlayer.player.number} {matchPlayer.player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {benchPlayers.length > 0 && (
                <div className="rounded bg-gray-100 p-4">
                  <h5 className="mb-2 text-sm font-bold text-gray-800">Suplentes</h5>
                  <div className="flex flex-wrap gap-2">
                    {benchPlayers.map((matchPlayer) => (
                      <span key={matchPlayer.id} className="rounded border bg-white px-3 py-1 text-sm">
                        #{matchPlayer.player.number} {matchPlayer.player.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded border bg-white p-4">
                <h5 className="mb-3 text-sm font-semibold text-gray-800">Goles, tarjetas y plantilla</h5>
                <div className="space-y-3">
                  {matchPlayers.map((matchPlayer) => (
                    <div key={matchPlayer.id} className="grid items-center gap-3 rounded border p-3 md:grid-cols-[1.5fr_120px_120px_auto]">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">#{matchPlayer.player.number} {matchPlayer.player.name}</p>
                        <p className="text-xs text-gray-500">Posicion actual: {matchPlayer.position}</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={playerEdits[matchPlayer.id]?.goals ?? 0}
                        onChange={(event) => handlePlayerEditChange(matchPlayer.id, 'goals', event.target.value)}
                        className="rounded border p-2 text-sm"
                        placeholder="Goles"
                      />
                      <select
                        value={playerEdits[matchPlayer.id]?.cards ?? ''}
                        onChange={(event) => handlePlayerEditChange(matchPlayer.id, 'cards', event.target.value)}
                        className="rounded border p-2 text-sm"
                      >
                        <option value="">Sin tarjetas</option>
                        <option value="Y">Amarilla</option>
                        <option value="R">Roja</option>
                        <option value="YY">Doble amarilla</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(matchPlayer.id, matchPlayer.player.name)}
                        className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePlayers}
                disabled={savingPlayers}
                className="w-full rounded bg-blue-600 p-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPlayers ? 'Guardando...' : 'Guardar posiciones, goles y tarjetas'}
              </button>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded bg-red-600 p-3 font-medium text-white hover:bg-red-700 transition"
            >
              Eliminar Partido
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
                <div className="space-y-4 p-6">
                  <h3 className="text-lg font-bold text-red-600">Confirmar eliminacion</h3>
                  <p className="text-gray-700">¿Estás seguro de que deseas eliminar este partido?</p>
                  <p className="rounded bg-gray-50 p-3 text-sm text-gray-500">
                    <strong>Lamberpool FC vs {selectedMatchData?.opponent}</strong>
                    <br />
                    {new Date(selectedMatchData?.date || '').toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm font-medium text-red-600">
                    Esta accion no se puede deshacer. Se eliminaran jugadores, valoraciones y fotos asociadas.
                  </p>
                </div>
                <div className="flex justify-end gap-3 rounded-b-lg bg-gray-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteMatch}
                    disabled={deleting}
                    className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}