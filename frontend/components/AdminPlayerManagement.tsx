'use client';

import { useState, useEffect } from 'react';
import { playersAPI, teamAPI, ratingsAPI } from '@/lib/api';

interface Player {
  id: string;
  name: string;
  number: number;
}

export default function AdminPlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamId, setTeamId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    number: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load team first
  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await teamAPI.getTeam();
        setTeamId(response.data.id);
      } catch (err) {
        setError('Error al cargar el equipo');
      }
    };
    loadTeam();
  }, []);

  // Load players when team is loaded
  useEffect(() => {
    if (teamId) {
      loadPlayers();
    }
  }, [teamId]);

  const loadPlayers = async () => {
    try {
      const response = await playersAPI.getAll(teamId);
      setPlayers(response.data);
    } catch (err) {
      setError('Error al cargar los jugadores');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.number) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // Update player
        await playersAPI.update(editingId, {
          name: formData.name,
          number: parseInt(formData.number),
        });
        setSuccess('¡Jugador actualizado exitosamente!');
        setEditingId(null);
      } else {
        // Create new player
        await playersAPI.create({
          name: formData.name,
          number: parseInt(formData.number),
          teamId,
        });
        setSuccess('¡Jugador agregado exitosamente!');
      }
      setFormData({ name: '', number: '' });
      loadPlayers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el jugador');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingId(player.id);
    setFormData({ name: player.name, number: player.number.toString() });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', number: '' });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este jugador?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Note: You may need to implement DELETE endpoint in playersAPI
      // For now, this calls update API - you should add a delete method
      await playersAPI.delete(id);
      setSuccess('¡Jugador eliminado exitosamente!');
      loadPlayers();
    } catch (err: any) {
      setError('Error al eliminar el jugador. Asegúrate de que el jugador no esté asociado a partidos');
    } finally {
      setLoading(false);
    }
  };

  const handleClearRatings = async () => {
    if (!confirm('Esto borrara todas las valoraciones. Quieres continuar?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await ratingsAPI.deleteAll();
      setSuccess(`Valoraciones eliminadas: ${response.data.deleted}`);
    } catch (err: any) {
      setError('Error al eliminar las valoraciones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Editar Jugador' : 'Agregar Jugador'}
        </h3>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded mb-4">{success}</div>}

        <form onSubmit={handleAddOrUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Jugador</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dorsal (Número)</label>
            <input
              type="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              placeholder="1-99"
              min="1"
              max="99"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white p-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : editingId ? 'Actualizar Jugador' : 'Agregar Jugador'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-400 text-white p-2 rounded font-medium hover:bg-gray-500"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Plantilla Actual ({players.length})</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={handleClearRatings}
            disabled={loading}
            className="bg-red-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Borrar todas las valoraciones
          </button>
          <p className="text-xs text-gray-500 self-center">
            Esto permite eliminar jugadores con valoraciones previas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map(player => (
            <div key={player.id} className={`p-4 border rounded ${editingId === player.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-gray-500">Dorsal #{player.number}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(player)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    disabled={loading}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {players.length === 0 && (
          <p className="text-gray-500">No hay jugadores registrados</p>
        )}
      </div>
    </div>
  );
}
