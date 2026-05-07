'use client';

import { useState, useEffect } from 'react';
import { playersAPI, teamAPI, ratingsAPI } from '@/lib/api';
import AdminFeedbackModal from './AdminFeedbackModal';

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

      <div>
        <h3 className="text-lg md:text-xl font-semibold mb-4">
          {editingId ? 'Editar Jugador' : 'Agregar Jugador'}
        </h3>

        <form onSubmit={handleAddOrUpdate} className="space-y-3 md:space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">Nombre del Jugador</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">Dorsal (Número)</label>
              <input
                type="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="1-99"
                min="1"
                max="99"
                className="w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base [appearance:textfield]"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-auto bg-green-600 text-white px-6 py-3 md:py-2 rounded font-medium text-sm md:text-base hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Guardando...' : editingId ? 'Actualizar Jugador' : 'Agregar Jugador'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 md:flex-auto bg-gray-400 text-white px-6 py-3 md:py-2 rounded font-medium text-sm md:text-base hover:bg-gray-500 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg md:text-xl font-semibold mb-4">Plantilla Actual ({players.length})</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <button
            type="button"
            onClick={handleClearRatings}
            disabled={loading}
            className="w-full md:w-auto bg-red-600 text-white px-4 py-2 md:py-2 rounded text-xs md:text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            Borrar todas las valoraciones
          </button>
          <p className="text-xs md:text-sm text-gray-600 flex-1">
            Esto permite eliminar jugadores con valoraciones previas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {players.map(player => (
            <div key={player.id} className={`p-4 border rounded transition-colors ${editingId === player.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base text-gray-900">{player.name}</p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">Dorsal #{player.number}</p>
                </div>
                <div className="w-full md:w-auto flex gap-2">
                  <button
                    onClick={() => handleEdit(player)}
                    className="flex-1 md:flex-none text-white bg-blue-600 hover:bg-blue-700 text-xs md:text-sm px-3 md:px-4 py-2 rounded font-medium transition disabled:opacity-50"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="flex-1 md:flex-none text-white bg-red-600 hover:bg-red-700 text-xs md:text-sm px-3 md:px-4 py-2 rounded font-medium transition disabled:opacity-50"
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
          <p className="text-gray-500 text-center py-8 text-xs md:text-sm">No hay jugadores registrados</p>
        )}
      </div>
    </div>
  );
}
