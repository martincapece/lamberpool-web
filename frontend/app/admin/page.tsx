'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminTournamentForm from '@/components/AdminTournamentForm';
import AdminMatchForm from '@/components/AdminMatchForm';
import AdminMatchManagement from '@/components/AdminMatchManagement';
import AdminPlayerManagement from '@/components/AdminPlayerManagement';
import AdminRatingForm from '@/components/AdminRatingForm';
import AdminPhotoUpload from '@/components/AdminPhotoUpload';
import AdminCompetitionsManager from '@/components/AdminCompetitionsManager';
import AdminFinalTablePhotos from '@/components/AdminFinalTablePhotos';

type AdminTab = 'tournaments' | 'matches' | 'manage-matches' | 'players' | 'ratings' | 'photos' | 'competitions' | 'final-tables';

export default function AdminPage() {
  const { isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('tournaments');

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'tournaments', label: 'Torneos', icon: '🏆' },
    { id: 'competitions', label: 'Competencias', icon: '🗂️' },
    { id: 'matches', label: 'Crear Partido', icon: '⚽' },
    { id: 'manage-matches', label: 'Gestionar Partidos', icon: '⚙️' },
    { id: 'players', label: 'Gestionar Jugadores', icon: '👥' },
    { id: 'ratings', label: 'Valoraciones', icon: '⭐' },
    { id: 'photos', label: 'Fotos Partido', icon: '📸' },
    { id: 'final-tables', label: 'Tablas Finales', icon: '📊' },
  ];

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Inicia sesión para acceder a esta área.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-gray-600">Gestiona partidos, jugadores y valoraciones</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'tournaments' && <AdminTournamentForm />}
          {activeTab === 'competitions' && <AdminCompetitionsManager />}
          {activeTab === 'matches' && <AdminMatchForm />}
          {activeTab === 'manage-matches' && <AdminMatchManagement />}
          {activeTab === 'players' && <AdminPlayerManagement />}
          {activeTab === 'ratings' && <AdminRatingForm />}
          {activeTab === 'photos' && <AdminPhotoUpload />}
          {activeTab === 'final-tables' && <AdminFinalTablePhotos />}
        </div>
      </div>
    </div>
  );
}
