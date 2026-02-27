'use client';

import { useState, useEffect } from 'react';
import {
  competitionsAPI,
  matchesAPI,
  tournamentsAPI,
  seasonsAPI,
  teamAPI,
  playersAPI,
  matchPlayersAPI,
} from '@/lib/api';

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

interface Player {
  id: string;
  name: string;
  number: number;
}

export default function AdminMatchForm() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamId, setTeamId] = useState('');
  const [existingMatches, setExistingMatches] = useState<any[]>([]);
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

  const [formData, setFormData] = useState({
    opponent: '',
    date: '',
    goalsFor: '',
    goalsAgainst: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load tournaments
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        console.log('Cargando datos iniciales...');
        const teamRes = await teamAPI.getTeam();
        setTeamId(teamRes.data.id);
        console.log('Team cargado:', teamRes.data.id);

        const tournamentsRes = await tournamentsAPI.getAll(teamRes.data.id);
        console.log('Torneos cargados:', tournamentsRes.data);
        setTournaments(tournamentsRes.data);

        const playersRes = await playersAPI.getAll(teamRes.data.id);
        console.log('Jugadores cargados:', playersRes.data);
        setPlayers(playersRes.data);
      } catch (err: any) {
        console.error('Error cargando torneos:', err);
        setError('Error al cargar los torneos');
      }
    };
    loadTournaments();
  }, []);

  // Load seasons when tournament changes
  useEffect(() => {
    if (selectedTournament) {
      const loadSeasons = async () => {
        try {
          console.log('Cargando temporadas para torneo:', selectedTournament);
          const seasonsRes = await seasonsAPI.getAll(selectedTournament);
          console.log('Temporadas cargadas:', seasonsRes.data);
          setSeasons(seasonsRes.data);
          setSelectedSeason('');
          setCompetitions([]);
          setSelectedCompetition('');
          setCompetitionForm({ seasonId: '', name: '' });
          setSelectedParticipants({});
          setSlotAssignments({});
        } catch (err: any) {
          console.error('Error cargando temporadas:', err);
          setError('Error al cargar las temporadas');
        }
      };
      loadSeasons();
    }
  }, [selectedTournament]);

  // Load competitions when season changes
  useEffect(() => {
    if (selectedSeason) {
      const loadCompetitions = async () => {
        try {
          setLoadingCompetitions(true);
          console.log('Cargando competiciones para temporada:', selectedSeason);
          const competitionsRes = await competitionsAPI.getAll(selectedSeason);
          console.log('Competiciones cargadas:', competitionsRes.data);
          setCompetitions(competitionsRes.data);
          setSelectedCompetition('');
          setCompetitionForm({ seasonId: selectedSeason, name: '' });
          setSelectedParticipants({});
          setSlotAssignments({});
        } catch (err: any) {
          console.error('Error cargando competiciones:', err);
          setError('Error al cargar las competiciones');
        } finally {
          setLoadingCompetitions(false);
        }
      };
      loadCompetitions();
    }
  }, [selectedSeason]);

  useEffect(() => {
    if (!selectedCompetition || !teamId) {
      setExistingMatches([]);
      return;
    }

    const loadMatches = async () => {
      try {
        setLoadingMatches(true);
        const matchesRes = await matchesAPI.getAll(selectedCompetition, teamId);
        setExistingMatches(matchesRes.data);
      } catch (err: any) {
        console.error('Error cargando partidos:', err);
        setError('Error al cargar los partidos');
      } finally {
        setLoadingMatches(false);
      }
    };

    loadMatches();
  }, [selectedCompetition, teamId]);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!competitionForm.seasonId || !competitionForm.name) {
      setError('La temporada y nombre de competición son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creando competición:', competitionForm);
      await competitionsAPI.create({
        seasonId: competitionForm.seasonId,
        name: competitionForm.name,
      });

      setSuccess('¡Competición creada exitosamente!');
      
      // Reload competitions
      const competitionsRes = await competitionsAPI.getAll(competitionForm.seasonId);
      console.log('Competiciones actualizadas:', competitionsRes.data);
      setCompetitions(competitionsRes.data);
      setCompetitionForm({ seasonId: competitionForm.seasonId, name: '' });
    } catch (err: any) {
      console.error('Error creando competición:', err);
      setError(err.response?.data?.error || 'Error al crear la competición');
    } finally {
      setLoading(false);
    }
  };

  const slots = formationSlotsMap[formationKey];
  const assignedIds = new Set(Object.values(slotAssignments).filter(Boolean));

  const toggleParticipant = (playerId: string) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  const handleAssign = (slotId: string, playerId: string) => {
    setSlotAssignments((prev) => ({ ...prev, [slotId]: playerId }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('¿Eliminar este partido? Esta accion no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await matchesAPI.delete(matchId);
      setSuccess('Partido eliminado exitosamente');
      const matchesRes = await matchesAPI.getAll(selectedCompetition, teamId);
      setExistingMatches(matchesRes.data);
    } catch (err: any) {
      console.error('Error eliminando partido:', err);
      setError(err.response?.data?.error || 'Error al eliminar el partido');
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

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await matchesAPI.deleteAll(selectedCompetition);
      setSuccess(`Partidos eliminados: ${response.data.deleted}`);
      setExistingMatches([]);
    } catch (err: any) {
      console.error('Error eliminando partidos:', err);
      setError(err.response?.data?.error || 'Error al eliminar los partidos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompetition) {
      setError('Selecciona una competición');
      return;
    }

    if (!formData.opponent || !formData.date || !formData.goalsFor || !formData.goalsAgainst) {
      setError('Completa todos los campos del partido');
      return;
    }

    const participantIds = Object.entries(selectedParticipants)
      .filter(([_, selected]) => selected)
      .map(([playerId]) => playerId);
    if (participantIds.length === 0) {
      setError('Selecciona al menos un jugador que participo del partido');
      return;
    }

    if (participantIds.length < slots.length) {
      setError('Debes seleccionar al menos 8 jugadores (arquero + 7 de campo)');
      return;
    }

    const missingSlot = slots.find((slot) => !slotAssignments[slot.id]);
    if (missingSlot) {
      setError(`Completa la alineacion: falta ${missingSlot.label}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creando partido:', { competitionId: selectedCompetition, teamId, ...formData });
      const matchRes = await matchesAPI.create({
        competitionId: selectedCompetition,
        teamId,
        opponent: formData.opponent,
        date: formData.date,
        goalsFor: parseInt(formData.goalsFor),
        goalsAgainst: parseInt(formData.goalsAgainst),
      });

      const matchId = matchRes.data.id;
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

      setSuccess('¡Partido creado exitosamente!');
      setFormData({ opponent: '', date: '', goalsFor: '', goalsAgainst: '' });
      setSelectedParticipants({});
      setSlotAssignments({});
    } catch (err: any) {
      console.error('Error creando partido:', err);
      setError(err.response?.data?.error || 'Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">Crear Partido</h3>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      {/* Select Tournament */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold mb-4">Paso 1: Selecciona Torneo</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Torneo</label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un torneo</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Select Season */}
      {selectedTournament && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-md font-semibold mb-4">Paso 2: Selecciona Temporada</h4>
          <div>
            <label className="block text-sm font-medium mb-1">Temporada (Año)</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una temporada</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.year}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Create or Select Competition */}
      {selectedSeason && (
        <div className="space-y-4">
          {/* Existing competitions */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-semibold mb-4">Paso 3: Selecciona o Crea Competición</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Competiciones Existentes:</label>
              {loadingCompetitions ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : competitions.length === 0 ? (
                <p className="text-sm text-gray-500">No hay competiciones en esta temporada aún</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map(c => (
                    <label key={c.id} className="flex items-center p-2 bg-white border rounded hover:bg-blue-50 cursor-pointer">
                      <input
                        type="radio"
                        name="competition"
                        value={c.id}
                        checked={selectedCompetition === c.id}
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Create new competition */}
            <div className="border-t pt-4">
              <h5 className="text-sm font-semibold mb-3">O Crea una Nueva Competición:</h5>
              <form onSubmit={handleCreateCompetition} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de Competición</label>
                  <input
                    type="text"
                    value={competitionForm.name}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, name: e.target.value })}
                    placeholder="Ej: Fase Regular, Playoff, Final"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !competitionForm.seasonId}
                  className="w-full bg-purple-600 text-white p-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Competición'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Select Participants */}
      {selectedCompetition && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-md font-semibold mb-2">Paso 4: Jugadores Convocados</h4>
          <p className="text-sm text-gray-600">Selecciona los jugadores que participaron (titulares y suplentes).</p>

          {players.length === 0 ? (
            <p className="text-sm text-gray-500">No hay jugadores cargados en el equipo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((player) => (
                <label key={player.id} className="flex items-center gap-2 bg-white border rounded p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedParticipants[player.id])}
                    onChange={() => toggleParticipant(player.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">
                    #{player.number} - {player.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formation */}
      {selectedCompetition && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-md font-semibold mb-2">Paso 5: Formacion y Posiciones</h4>
          <div className="max-w-xs">
            <label className="block text-sm font-medium mb-1">Formacion</label>
            <select
              value={formationKey}
              onChange={(e) => {
                setFormationKey(e.target.value as FormationKey);
                setSlotAssignments({});
              }}
              className="w-full p-2 border rounded"
            >
              <option value="2-4-1">2-4-1</option>
              <option value="3-3-1">3-3-1</option>
            </select>
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
                      {players
                        .filter((player) => selectedParticipants[player.id])
                        .map((player) => (
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
                        {players
                          .filter((player) => selectedParticipants[player.id])
                          .map((player) => (
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
                        {players
                          .filter((player) => selectedParticipants[player.id])
                          .map((player) => (
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
                      {players
                        .filter((player) => selectedParticipants[player.id])
                        .map((player) => (
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
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold">Partidos existentes</h4>
            <button
              type="button"
              onClick={handleDeleteAllMatches}
              disabled={loading}
              className="text-xs bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 disabled:opacity-50"
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
                <div key={match.id} className="flex items-center justify-between bg-white border rounded p-3">
                  <div>
                    <p className="text-sm font-semibold">vs {match.opponent}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(match.date).toLocaleDateString('es-ES')} — {match.goalsFor} - {match.goalsAgainst}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMatch(match.id)}
                    disabled={loading}
                    className="text-xs bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Match */}
      {selectedCompetition && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-md font-semibold mb-4">Paso 6: Detalles del Partido</h4>

          <div>
            <label className="block text-sm font-medium mb-1">Rival</label>
            <input
              type="text"
              name="opponent"
              value={formData.opponent}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Equipo Rival FC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha del Partido</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Goles a Favor</label>
              <input
                type="number"
                name="goalsFor"
                value={formData.goalsFor}
                onChange={handleChange}
                required
                min="0"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Goles en Contra</label>
              <input
                type="number"
                name="goalsAgainst"
                value={formData.goalsAgainst}
                onChange={handleChange}
                required
                min="0"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Partido'}
          </button>
        </form>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-800 mb-2">
          <span className="font-semibold">ℹ️ Instrucciones:</span>
        </p>
        <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
          <li>Selecciona un <strong>torneo</strong></li>
          <li>Selecciona una <strong>temporada</strong> (año)</li>
          <li>Selecciona una <strong>competición</strong> o crea una nueva</li>
          <li>Selecciona los <strong>jugadores</strong> convocados</li>
          <li>Define la <strong>formacion</strong> y posiciones</li>
          <li>Completa los detalles del <strong>partido</strong></li>
        </ol>
      </div>
    </div>
  );
}
