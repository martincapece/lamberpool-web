'use client';

import { useState, useEffect } from 'react';
import { tournamentsAPI, seasonsAPI, competitionsAPI, teamAPI } from '@/lib/api';

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

export default function AdminTournamentForm() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teamId, setTeamId] = useState('');
  
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
  });

  const [seasonForm, setSeasonForm] = useState({
    tournamentId: '',
    year: new Date().getFullYear(),
  });

  const [competitionForm, setCompetitionForm] = useState({
    seasonId: '',
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load team and tournaments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Cargando datos iniciales...');
        const teamRes = await teamAPI.getTeam();
        setTeamId(teamRes.data.id);
        console.log('Team cargado:', teamRes.data.id);

        const tournamentsRes = await tournamentsAPI.getAll(teamRes.data.id);
        console.log('Torneos cargados:', tournamentsRes.data);
        setTournaments(tournamentsRes.data);
      } catch (err: any) {
        console.error('Error cargando datos iniciales:', err);
        setError('Error al cargar los datos');
      }
    };
    loadData();
  }, []);

  // Load seasons when tournament is selected
  useEffect(() => {
    if (seasonForm.tournamentId) {
      const loadSeasons = async () => {
        try {
          setLoadingSeasons(true);
          console.log('Cargando temporadas para torneo:', seasonForm.tournamentId);
          const seasonsRes = await seasonsAPI.getAll(seasonForm.tournamentId);
          console.log('Temporadas cargadas:', seasonsRes.data);
          setSeasons(seasonsRes.data);
          setCompetitions([]); // Clear competitions when tournament changes
          setCompetitionForm({ seasonId: '', name: '' });
        } catch (err: any) {
          console.error('Error cargando temporadas:', err);
          setError('Error al cargar las temporadas');
        } finally {
          setLoadingSeasons(false);
        }
      };
      loadSeasons();
    }
  }, [seasonForm.tournamentId]);

  // Load competitions when season is selected
  useEffect(() => {
    if (competitionForm.seasonId) {
      const loadCompetitions = async () => {
        try {
          setLoadingCompetitions(true);
          console.log('Cargando competiciones para temporada:', competitionForm.seasonId);
          const competitionsRes = await competitionsAPI.getAll(competitionForm.seasonId);
          console.log('Competiciones cargadas:', competitionsRes.data);
          setCompetitions(competitionsRes.data);
        } catch (err: any) {
          console.error('Error cargando competiciones:', err);
          setError('Error al cargar las competiciones');
        } finally {
          setLoadingCompetitions(false);
        }
      };
      loadCompetitions();
    }
  }, [competitionForm.seasonId]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tournamentForm.name) {
      setError('El nombre del torneo es requerido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await tournamentsAPI.create({
        name: tournamentForm.name,
        teamId,
      });

      setSuccess('¡Torneo creado exitosamente!');
      setTournamentForm({ name: '' });
      
      // Reload tournaments
      const tournamentsRes = await tournamentsAPI.getAll(teamId);
      console.log('Torneos actualizados:', tournamentsRes.data);
      setTournaments(tournamentsRes.data);
    } catch (err: any) {
      console.error('Error creando torneo:', err);
      setError(err.response?.data?.error || 'Error al crear el torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seasonForm.tournamentId || !seasonForm.year) {
      setError('Selecciona un torneo y año');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await seasonsAPI.create({
        tournamentId: seasonForm.tournamentId,
        year: seasonForm.year,
      });

      setSuccess('¡Temporada creada exitosamente!');
      
      // Reload seasons
      const seasonsRes = await seasonsAPI.getAll(seasonForm.tournamentId);
      console.log('Temporadas actualizadas:', seasonsRes.data);
      setSeasons(seasonsRes.data);
      setSeasonForm({ tournamentId: seasonForm.tournamentId, year: new Date().getFullYear() });
    } catch (err: any) {
      console.error('Error creando temporada:', err);
      setError(err.response?.data?.error || 'Error al crear la temporada');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">Gestionar Torneos</h3>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      {/* Create Tournament */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-semibold mb-4">Crear Nuevo Torneo</h4>
        <form onSubmit={handleCreateTournament} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Torneo</label>
            <input
              type="text"
              value={tournamentForm.name}
              onChange={(e) => setTournamentForm({ name: e.target.value })}
              placeholder="Ej: Liga Nuñez - Tercera División"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Torneo'}
          </button>
        </form>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Torneos existentes:</p>
          {tournaments.length === 0 ? (
            <p className="text-sm text-gray-500">No hay torneos aún</p>
          ) : (
            <ul className="space-y-1">
              {tournaments.map(t => (
                <li key={t.id} className="text-sm bg-white p-2 rounded border">
                  {t.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Create Season */}
      {tournaments.length > 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-md font-semibold mb-4">Crear Nueva Temporada</h4>
          <form onSubmit={handleCreateSeason} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Torneo</label>
              <select
                value={seasonForm.tournamentId}
                onChange={(e) => setSeasonForm({ ...seasonForm, tournamentId: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un torneo</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Año</label>
              <input
                type="number"
                value={seasonForm.year}
                onChange={(e) => setSeasonForm({ ...seasonForm, year: parseInt(e.target.value) })}
                min="2000"
                max="2100"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !seasonForm.tournamentId}
              className="w-full bg-green-600 text-white p-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Temporada'}
            </button>
          </form>
          {seasonForm.tournamentId && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Temporadas existentes:</p>
              {loadingSeasons ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : seasons.length === 0 ? (
                <p className="text-sm text-gray-500">No hay temporadas en este torneo aún</p>
              ) : (
                <ul className="space-y-1">
                  {seasons.map(s => (
                    <li key={s.id} className="text-sm bg-white p-2 rounded border">
                      {s.year}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-600">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">📌 Paso 1:</span> Primero crea un torneo arriba para poder crear temporadas.
          </p>
        </div>
      )}

      {/* Create Competition */}
      {seasons.length > 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-md font-semibold mb-4">Crear Nueva Competición</h4>
          <form onSubmit={handleCreateCompetition} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Temporada</label>
              <select
                value={competitionForm.seasonId}
                onChange={(e) => setCompetitionForm({ ...competitionForm, seasonId: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una temporada</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de Competición</label>
              <input
                type="text"
                value={competitionForm.name}
                onChange={(e) => setCompetitionForm({ ...competitionForm, name: e.target.value })}
                placeholder="Ej: Fase Regular, Instancia Final"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {competitionForm.seasonId && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Competiciones existentes:</p>
              {loadingCompetitions ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : competitions.length === 0 ? (
                <p className="text-sm text-gray-500">No hay competiciones en esta temporada aún</p>
              ) : (
                <ul className="space-y-1">
                  {competitions.map(c => (
                    <li key={c.id} className="text-sm bg-white p-2 rounded border">
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-600">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">📌 Paso 2:</span> Crea una temporada (año) para poder crear competiciones.
          </p>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-800 mb-2">
          <span className="font-semibold">ℹ️ Instrucciones:</span>
        </p>
        <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
          <li>Crea un <strong>torneo</strong> (ej: Liga Nuñez)</li>
          <li>Selecciona el torneo y crea una <strong>temporada</strong> (ej: año 2025)</li>
          <li>Selecciona la temporada y crea una <strong>competición</strong> (ej: Fase Regular)</li>
          <li>Luego podrás crear partidos dentro de la competición</li>
        </ol>
      </div>
    </div>
  );
}
