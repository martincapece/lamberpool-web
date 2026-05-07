'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  competitionsAPI,
  matchesAPI,
  tournamentsAPI,
  seasonsAPI,
  teamAPI,
  playersAPI,
  matchPlayersAPI,
} from '@/lib/api';
import AdminFeedbackModal from './AdminFeedbackModal';

interface Tournament {
  id: string;
  name: string;
}

interface Season {
  id: string;
  year: number;
}

interface Competition {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  number: number;
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  status?: 'PLAYED' | 'CANCELED';
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
  goalsFor: string;
  goalsAgainst: string;
  status: MatchStatus;
  awardedTo: 'LAMBERPOOL' | 'OPPONENT';
  cancelReason: string;
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

const createEmptyForm = (): MatchFormState => ({
  opponent: '',
  date: '',
  goalsFor: '',
  goalsAgainst: '',
  status: 'PLAYED',
  awardedTo: 'LAMBERPOOL',
  cancelReason: '',
});

const applyCanceledScore = (awardedTo: 'LAMBERPOOL' | 'OPPONENT') => ({
  goalsFor: awardedTo === 'LAMBERPOOL' ? '3' : '0',
  goalsAgainst: awardedTo === 'LAMBERPOOL' ? '0' : '3',
});

export default function AdminMatchForm() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamId, setTeamId] = useState('');
  const [existingMatches, setExistingMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [competitionForm, setCompetitionForm] = useState({
    seasonId: '',
    name: '',
  });
  const [formationKey, setFormationKey] = useState<FormationKey>('2-4-1');
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>({});
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<MatchFormState>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const teamResponse = await teamAPI.getTeam();
        setTeamId(teamResponse.data.id);

        const [tournamentsResponse, playersResponse] = await Promise.all([
          tournamentsAPI.getAll(teamResponse.data.id),
          playersAPI.getAll(teamResponse.data.id),
        ]);

        setTournaments(tournamentsResponse.data);
        setPlayers(playersResponse.data);
      } catch (err: any) {
        console.error('Error cargando datos iniciales:', err);
        setError('Error al cargar los torneos y jugadores');
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedTournament) {
      setSeasons([]);
      setSelectedSeason('');
      setCompetitions([]);
      setSelectedCompetition('');
      return;
    }

    const loadSeasons = async () => {
      try {
        const seasonsResponse = await seasonsAPI.getAll(selectedTournament);
        setSeasons(seasonsResponse.data);
        setSelectedSeason('');
        setCompetitions([]);
        setSelectedCompetition('');
      } catch (err) {
        console.error(err);
        setError('Error al cargar las temporadas');
      }
    };

    loadSeasons();
  }, [selectedTournament]);

  useEffect(() => {
    if (!selectedSeason) {
      setCompetitions([]);
      setSelectedCompetition('');
      return;
    }

    const loadCompetitions = async () => {
      try {
        setLoadingCompetitions(true);
        const competitionsResponse = await competitionsAPI.getAll(selectedSeason);
        setCompetitions(competitionsResponse.data);
        setSelectedCompetition('');
        setCompetitionForm({ seasonId: selectedSeason, name: '' });
      } catch (err) {
        console.error(err);
        setError('Error al cargar las competiciones');
      } finally {
        setLoadingCompetitions(false);
      }
    };

    loadCompetitions();
  }, [selectedSeason]);

  useEffect(() => {
    if (!selectedCompetition || !teamId) {
      setExistingMatches([]);
      return;
    }

    const loadMatches = async () => {
      try {
        setLoadingMatches(true);
        const matchesResponse = await matchesAPI.getAll(selectedCompetition, teamId);
        setExistingMatches(matchesResponse.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los partidos');
      } finally {
        setLoadingMatches(false);
      }
    };

    loadMatches();
  }, [selectedCompetition, teamId]);

  const slots = formationSlotsMap[formationKey];
  const assignedIds = new Set(Object.values(slotAssignments).filter(Boolean));
  const isCanceledMatch = formData.status === 'CANCELED';

  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedParticipants[player.id]),
    [players, selectedParticipants]
  );

  const updateFormData = (field: keyof MatchFormState, value: string) => {
    setFormData((previous) => {
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
          goalsFor: previous.goalsFor === '3' || previous.goalsFor === '0' ? '' : previous.goalsFor,
          goalsAgainst: previous.goalsAgainst === '3' || previous.goalsAgainst === '0' ? '' : previous.goalsAgainst,
          cancelReason: '',
        };
      }

      return nextState;
    });
  };

  const toggleParticipant = (playerId: string) => {
    setSelectedParticipants((previous) => ({
      ...previous,
      [playerId]: !previous[playerId],
    }));
  };

  const handleAssign = (slotId: string, playerId: string) => {
    setSlotAssignments((previous) => ({ ...previous, [slotId]: playerId }));
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('¿Eliminar este partido? Esta accion no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      await matchesAPI.delete(matchId);
      const matchesResponse = await matchesAPI.getAll(selectedCompetition, teamId);
      setExistingMatches(matchesResponse.data);
      setFeedback({
        title: 'Partido eliminado',
        message: 'El partido se eliminó correctamente.',
        tone: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        title: 'No se pudo eliminar el partido',
        message: err.response?.data?.error || 'Error al eliminar el partido',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    if (!selectedCompetition) {
      return;
    }

    if (!confirm('¿Eliminar todos los partidos de esta competencia?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await matchesAPI.deleteAll(selectedCompetition);
      setExistingMatches([]);
      setFeedback({
        title: 'Partidos eliminados',
        message: `Se eliminaron ${response.data.deleted} partido(s) de la competencia seleccionada.`,
        tone: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        title: 'No se pudieron eliminar los partidos',
        message: err.response?.data?.error || 'Error al eliminar los partidos',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompetition = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!competitionForm.seasonId || !competitionForm.name) {
      setFeedback({
        title: 'Faltan datos de la competencia',
        message: 'La temporada y el nombre de la competencia son obligatorios.',
        tone: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      await competitionsAPI.create({
        seasonId: competitionForm.seasonId,
        name: competitionForm.name,
      });
      const competitionsResponse = await competitionsAPI.getAll(competitionForm.seasonId);
      setCompetitions(competitionsResponse.data);
      setCompetitionForm({ seasonId: competitionForm.seasonId, name: '' });
      setFeedback({
        title: 'Competencia creada',
        message: 'La competencia se creó correctamente y ya está disponible para cargar partidos.',
        tone: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        title: 'No se pudo crear la competencia',
        message: err.response?.data?.error || 'Error al crear la competencia',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCompetition) {
      setFeedback({
        title: 'Falta la competencia',
        message: 'Selecciona una competencia antes de crear el partido.',
        tone: 'error',
      });
      return;
    }

    if (!formData.opponent.trim() || !formData.date) {
      setFeedback({
        title: 'Faltan datos del partido',
        message: 'Debes completar rival y fecha.',
        tone: 'error',
      });
      return;
    }

    if (!isCanceledMatch && (!formData.goalsFor || !formData.goalsAgainst)) {
      setFeedback({
        title: 'Falta el resultado',
        message: 'Completa goles a favor y en contra.',
        tone: 'error',
      });
      return;
    }

    if (!isCanceledMatch) {
      const participantIds = Object.entries(selectedParticipants)
        .filter(([, selected]) => selected)
        .map(([playerId]) => playerId);

      if (participantIds.length === 0) {
        setFeedback({
          title: 'Faltan jugadores convocados',
          message: 'Selecciona al menos un jugador que haya participado del partido.',
          tone: 'error',
        });
        return;
      }

      if (participantIds.length < slots.length) {
        setFeedback({
          title: 'Faltan jugadores titulares',
          message: 'Debes seleccionar al menos ocho jugadores para completar la formacion.',
          tone: 'error',
        });
        return;
      }

      const missingSlot = slots.find((slot) => !slotAssignments[slot.id]);
      if (missingSlot) {
        setFeedback({
          title: 'Formacion incompleta',
          message: `Completa la alineacion. Falta asignar ${missingSlot.label}.`,
          tone: 'error',
        });
        return;
      }
    }

    try {
      setLoading(true);
      const matchResponse = await matchesAPI.create({
        competitionId: selectedCompetition,
        teamId,
        opponent: formData.opponent,
        date: formData.date,
        goalsFor: parseInt(formData.goalsFor || '0', 10),
        goalsAgainst: parseInt(formData.goalsAgainst || '0', 10),
        status: formData.status,
        awardedTo: isCanceledMatch ? formData.awardedTo : undefined,
        cancelReason: isCanceledMatch ? formData.cancelReason : undefined,
      });

      if (!isCanceledMatch) {
        const matchId = matchResponse.data.id;
        const participantIds = Object.entries(selectedParticipants)
          .filter(([, selected]) => selected)
          .map(([playerId]) => playerId);
        const assignedPlayerIds = Object.values(slotAssignments);
        const benchIds = participantIds.filter((playerId) => !assignedPlayerIds.includes(playerId));

        await Promise.all([
          ...Object.entries(slotAssignments).map(([slotId, playerId]) =>
            matchPlayersAPI.add({
              matchId,
              playerId,
              position: slotId,
            })
          ),
          ...benchIds.map((playerId) =>
            matchPlayersAPI.add({
              matchId,
              playerId,
              position: 'BENCH',
            })
          ),
        ]);
      }

      const matchesResponse = await matchesAPI.getAll(selectedCompetition, teamId);
      setExistingMatches(matchesResponse.data);
      setFormData(createEmptyForm());
      setSelectedParticipants({});
      setSlotAssignments({});
      setFeedback({
        title: 'Partido creado',
        message: isCanceledMatch
          ? 'El partido cancelado se registró correctamente con resultado 3-0 automático.'
          : 'El partido y su plantilla se crearon correctamente.',
        tone: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        title: 'No se pudo crear el partido',
        message: err.response?.data?.error || 'Error al crear el partido',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminFeedbackModal
        isOpen={Boolean(feedback)}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        tone={feedback?.tone || 'info'}
        onClose={() => setFeedback(null)}
      />

      <h3 className="text-lg md:text-xl font-semibold">Crear Partido</h3>

      {error && <div className="rounded bg-red-100 p-3 md:p-4 text-red-700 text-xs md:text-sm">{error}</div>}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-base md:text-md font-semibold text-amber-900">Estado del partido</h4>
            <p className="text-xs md:text-sm text-amber-800 mt-1">
              Si fue cancelado, selecciona al equipo favorecido y el sistema asignará un 3-0 automáticamente.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2 md:mt-0">
            <input
              type="checkbox"
              checked={isCanceledMatch}
              onChange={(event) => updateFormData('status', event.target.checked ? 'CANCELED' : 'PLAYED')}
              className="h-5 w-5 cursor-pointer"
            />
            <span className="text-xs md:text-sm font-medium text-amber-900">Cancelado</span>
          </label>
        </div>

        {isCanceledMatch && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs md:text-sm font-medium text-gray-700">Equipo favorecido</label>
              <select
                value={formData.awardedTo}
                onChange={(event) => updateFormData('awardedTo', event.target.value)}
                className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              >
                <option value="LAMBERPOOL">Lamberpool FC</option>
                <option value="OPPONENT">Rival</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs md:text-sm font-medium text-gray-700">Detalle de la cancelacion</label>
              <input
                type="text"
                value={formData.cancelReason}
                onChange={(event) => updateFormData('cancelReason', event.target.value)}
                placeholder="Ej: rival no se presento"
                className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-gray-50 p-4 md:p-6 border-b-4 border-blue-200">
        <h4 className="text-base md:text-md font-semibold mb-4">🔹 Paso 1: Selecciona Torneo</h4>
        <div>
          <label className="mb-2 block text-xs md:text-sm font-medium">Torneo</label>
          <select
            value={selectedTournament}
            onChange={(event) => setSelectedTournament(event.target.value)}
            className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          >
            <option value="">Selecciona un torneo</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedTournament && (
        <div className="rounded-lg bg-gray-50 p-4 md:p-6 border-b-4 border-blue-200">
          <h4 className="text-base md:text-md font-semibold mb-4">🔹 Paso 2: Selecciona Temporada</h4>
          <div>
            <label className="mb-2 block text-xs md:text-sm font-medium">Temporada (Año)</label>
            <select
              value={selectedSeason}
              onChange={(event) => setSelectedSeason(event.target.value)}
              className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="">Selecciona una temporada</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.year}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedSeason && (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 md:p-6 border-b-4 border-blue-200">
            <h4 className="text-base md:text-md font-semibold mb-4">🔹 Paso 3: Selecciona o crea competencia</h4>
            <div className="mb-4">
              <label className="mb-2 block text-xs md:text-sm font-medium">Competiciones existentes</label>
              {loadingCompetitions ? (
                <p className="text-xs md:text-sm text-gray-500">Cargando...</p>
              ) : competitions.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500">No hay competiciones en esta temporada aún.</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map((competition) => (
                    <label key={competition.id} className="flex cursor-pointer items-center gap-3 rounded border bg-white p-3 md:p-2 hover:bg-blue-50">
                      <input
                        type="radio"
                        name="competition"
                        value={competition.id}
                        checked={selectedCompetition === competition.id}
                        onChange={(event) => setSelectedCompetition(event.target.value)}
                        className="h-4 w-4 text-blue-600 cursor-pointer"
                      />
                      <span className="text-xs md:text-sm font-medium">{competition.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h5 className="mb-3 text-xs md:text-sm font-semibold">O crea una nueva competencia</h5>
              <form onSubmit={handleCreateCompetition} className="space-y-3">
                <div>
                  <label className="mb-2 block text-xs md:text-sm font-medium">Nombre de competencia</label>
                  <input
                    type="text"
                    value={competitionForm.name}
                    onChange={(event) => setCompetitionForm({ ...competitionForm, name: event.target.value })}
                    placeholder="Ej: Fase Regular, Playoff, Final"
                    className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !competitionForm.seasonId}
                  className="w-full px-6 py-3 md:py-2 bg-purple-600 text-white rounded font-medium text-sm md:text-base hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Creando...' : 'Crear Competencia'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedCompetition && !isCanceledMatch && (
        <div className="rounded-lg bg-gray-50 p-4 md:p-6 border-b-4 border-blue-200 space-y-4">
          <h4 className="text-base md:text-md font-semibold mb-2">🔹 Paso 4: Jugadores convocados</h4>
          <p className="text-xs md:text-sm text-gray-600">Selecciona los jugadores que participaron, incluidos suplentes.</p>

          {players.length === 0 ? (
            <p className="text-xs md:text-sm text-gray-500">No hay jugadores cargados en el equipo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((player) => (
                <label key={player.id} className="flex items-center gap-3 rounded border bg-white p-3 cursor-pointer hover:bg-blue-50">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedParticipants[player.id])}
                    onChange={() => toggleParticipant(player.id)}
                    className="h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm font-medium">
                    #{player.number} - {player.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCompetition && !isCanceledMatch && (
        <div className="rounded-lg bg-gray-50 p-4 md:p-6 border-b-4 border-blue-200 space-y-4">
          <h4 className="text-base md:text-md font-semibold mb-2">🔹 Paso 5: Formacion y posiciones</h4>
          <div className="max-w-xs">
            <label className="mb-2 block text-xs md:text-sm font-medium">Formacion</label>
            <select
              value={formationKey}
              onChange={(event) => {
                setFormationKey(event.target.value as FormationKey);
                setSlotAssignments({});
              }}
              className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="2-4-1">2-4-1</option>
              <option value="3-3-1">3-3-1</option>
            </select>
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
                      className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {selectedPlayers.map((player) => (
                        <option
                          key={player.id}
                          value={player.id}
                          disabled={assignedIds.has(player.id) && player.id !== assigned}
                        >
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <h5 className="text-xs md:text-sm font-bold uppercase tracking-wide text-green-800">Defensas</h5>
              <div className="grid grid-cols-1 gap-2">
                {slots.filter((slot) => slot.id.startsWith('DEF_')).map((slot) => {
                  const assigned = slotAssignments[slot.id] || '';
                  return (
                    <div key={slot.id} className="rounded border-2 border-green-300 bg-white p-3">
                      <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                      <select
                        value={assigned}
                        onChange={(event) => handleAssign(slot.id, event.target.value)}
                        className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                      >
                        <option value="">Sin asignar</option>
                        {selectedPlayers.map((player) => (
                          <option
                            key={player.id}
                            value={player.id}
                            disabled={assignedIds.has(player.id) && player.id !== assigned}
                          >
                            #{player.number} {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs md:text-sm font-bold uppercase tracking-wide text-yellow-800">Mediocampistas</h5>
              <div className="grid grid-cols-1 gap-2">
                {slots.filter((slot) => slot.id.startsWith('MID_')).map((slot) => {
                  const assigned = slotAssignments[slot.id] || '';
                  return (
                    <div key={slot.id} className="rounded border-2 border-yellow-300 bg-white p-3">
                      <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                      <select
                        value={assigned}
                        onChange={(event) => handleAssign(slot.id, event.target.value)}
                        className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                      >
                        <option value="">Sin asignar</option>
                        {selectedPlayers.map((player) => (
                          <option
                            key={player.id}
                            value={player.id}
                            disabled={assignedIds.has(player.id) && player.id !== assigned}
                          >
                            #{player.number} {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs md:text-sm font-bold uppercase tracking-wide text-red-800">Ataque</h5>
              {slots.filter((slot) => slot.id.startsWith('FWD')).map((slot) => {
                const assigned = slotAssignments[slot.id] || '';
                return (
                  <div key={slot.id} className="rounded border-2 border-red-300 bg-white p-3">
                    <label className="mb-1 block text-xs text-gray-600">{slot.label}</label>
                    <select
                      value={assigned}
                      onChange={(event) => handleAssign(slot.id, event.target.value)}
                      className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {selectedPlayers.map((player) => (
                        <option
                          key={player.id}
                          value={player.id}
                          disabled={assignedIds.has(player.id) && player.id !== assigned}
                        >
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedCompetition && (
        <div className="rounded-lg bg-gray-50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold">Partidos existentes</h4>
            <button
              type="button"
              onClick={handleDeleteAllMatches}
              disabled={loading}
              className="rounded bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700 disabled:opacity-50"
            >
              Eliminar todos los partidos
            </button>
          </div>

          {loadingMatches ? (
            <p className="text-sm text-gray-500">Cargando partidos...</p>
          ) : existingMatches.length === 0 ? (
            <p className="text-sm text-gray-500">No hay partidos registrados en esta competencia.</p>
          ) : (
            <div className="space-y-2">
              {existingMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between rounded border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold">vs {match.opponent}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(match.date).toLocaleDateString('es-ES')} - {match.goalsFor} - {match.goalsAgainst}
                      {match.status === 'CANCELED' ? ' - Cancelado' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(match.id)}
                    disabled={loading}
                    className="rounded bg-red-500 px-3 py-2 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCompetition && (
        <form onSubmit={handleSubmit} className="rounded-lg bg-gray-50 p-6 space-y-4">
          <h4 className="text-md font-semibold mb-4">Paso 6: Detalles del partido</h4>

          <div>
            <label className="mb-1 block text-sm font-medium">Rival</label>
            <input
              type="text"
              name="opponent"
              value={formData.opponent}
              onChange={(event) => updateFormData('opponent', event.target.value)}
              required
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Equipo Rival FC"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Fecha del partido</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={(event) => updateFormData('date', event.target.value)}
              required
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Goles a favor</label>
              <input
                type="number"
                name="goalsFor"
                value={formData.goalsFor}
                onChange={(event) => updateFormData('goalsFor', event.target.value)}
                required
                min="0"
                disabled={isCanceledMatch}
                className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Goles en contra</label>
              <input
                type="number"
                name="goalsAgainst"
                value={formData.goalsAgainst}
                onChange={(event) => updateFormData('goalsAgainst', event.target.value)}
                required
                min="0"
                disabled={isCanceledMatch}
                className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Partido'}
          </button>
        </form>
      )}

      <div className="rounded border-l-4 border-blue-600 bg-blue-50 p-4">
        <p className="mb-2 text-sm text-blue-800">
          <span className="font-semibold">Instrucciones:</span>
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Selecciona un torneo.</li>
          <li>Selecciona una temporada.</li>
          <li>Selecciona o crea una competencia.</li>
          <li>Si el partido se jugó, elige convocados y formacion.</li>
          <li>Si fue cancelado, marca el checkpoint y elige al equipo favorecido.</li>
          <li>Completa rival, fecha y guarda el partido.</li>
        </ol>
      </div>
    </div>
  );
}