'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginModal() {
  const { login, isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(username, password)) {
      setShowModal(false);
      setUsername('');
      setPassword('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  if (isAdmin) {
    return null; // Don't show if already logged in
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-2 md:bottom-4 right-2 md:right-4 bg-gray-800 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm hover:bg-gray-900 transition z-40"
      >
        🔐 Admin
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Iniciar Sesión Admin</h2>

            {error && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 bg-red-100 text-red-700 rounded text-xs md:text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 md:p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                  placeholder="admin"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 md:p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2 pt-2 md:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    setUsername('');
                    setPassword('');
                  }}
                  className="flex-1 px-3 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded hover:bg-gray-50 text-xs md:text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-xs md:text-sm"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
