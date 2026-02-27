'use client';

import { useState, useEffect } from 'react';
import { championshipsAPI } from '@/lib/api';

interface Championship {
  id: string;
  year: number;
  season: string;
  division: string;
  tournament: string;
  title: string;
  jerseyUrl?: string;
  altJerseyUrl?: string;
  description?: string;
  order?: number;
}

export default function ChampionshipTimeline() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Función para generar el nombre de archivo de arquero
  const getGoalkeeperJerseyUrl = (year: number, season: string): string | null => {
    if (year === 2024 && season.toLowerCase().includes('clausura')) {
      return '/jerseys/2024-clausura-arq.png';
    }
    if (year === 2025 && season.toLowerCase().includes('apertura')) {
      return '/jerseys/2025-apertura-arq.png';
    }
    if (year === 2025 && season.toLowerCase().includes('clausura')) {
      return '/jerseys/2025-clausura-arq.png';
    }
    return null;
  };

  useEffect(() => {
    const loadChampionships = async () => {
      try {
        const response = await championshipsAPI.getAll();
        setChampionships(response.data);
      } catch (err) {
        console.error('Error loading championships:', err);
        setError('Error al cargar los campeonatos');
      } finally {
        setLoading(false);
      }
    };

    loadChampionships();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Cargando historia...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  if (championships.length === 0) {
    return <div className="text-center py-12 text-gray-600">No hay campeonatos registrados</div>;
  }

  // Crear array plano y determinar el lado para cada uno
  const sortedChampionships = championships
    .sort((a, b) => {
      // Primero por año descendente
      if (b.year !== a.year) return b.year - a.year;
      // Dentro del mismo año, por order descendente
      return (b.order || 0) - (a.order || 0);
    })
    .map((champ, index) => {
      // Determinar lado: 2026 siempre derecha, luego alternado
      let side: 'left' | 'right';
      if (champ.year === 2026) {
        side = 'right'; // Ambos torneos 2026 van a la derecha
      } else {
        // Contar cuántos de 2026 hay antes para ajustar el offset
        const count2026Before = championships.filter(c => c.year === 2026).length;
        const adjustedIndex = index - count2026Before;
        side = adjustedIndex % 2 === 0 ? 'left' : 'right';
      }
      return { ...champ, side };
    });

  return (
    <div className="py-8 md:py-12">
      {/* Timeline */}
      <div className="relative">
        {/* Línea central */}
        <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 via-red-500 to-black" />

        {/* Items */}
        <div className="space-y-6 md:space-y-4">
          {sortedChampionships.map((championship) => (
            <div
              key={championship.id}
              className={`flex gap-3 md:gap-6 lg:gap-8 ${championship.side === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              {/* Contenido */}
              <div className="flex-1 ml-14 md:ml-0 md:w-1/2">
                <div className={`bg-white border-2 rounded-lg p-3 md:p-4 lg:p-6 shadow-lg hover:shadow-xl transition ${
                  championship.title === 'Campeonato' 
                    ? 'border-red-600 border-4' 
                    : championship.title === 'Próximo'
                    ? 'border-gray-300 border-dashed border-4 bg-gray-50'
                    : 'border-gray-200'
                }`}>
                  {/* Año y Título */}
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
                    <span className="text-xl md:text-2xl lg:text-3xl font-black text-black">{championship.year}</span>
                    <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs lg:text-sm font-bold text-white ${
                      championship.title === 'Campeonato' 
                        ? 'bg-red-600' 
                        : championship.title === 'Próximo'
                        ? 'bg-blue-600'
                        : 'bg-gray-400'
                    }`}>
                      {championship.title === 'Campeonato' 
                        ? '🏆 CAMPEÓN' 
                        : championship.title === 'Próximo'
                        ? '🚀 PRÓXIMO'
                        : '🥈 SUBCAMPEÓN'}
                    </span>
                  </div>

                  {/* Competición */}
                  <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1">
                    {championship.division}
                  </h3>
                  <p className="text-[10px] md:text-xs lg:text-sm text-gray-600 mb-2">
                    {championship.tournament} • Torneo {championship.season}
                  </p>

                  {/* Descripción */}
                  {championship.description && (
                    <p className="text-[10px] md:text-xs lg:text-sm text-gray-700 mb-3 md:mb-4 italic">
                      {championship.description}
                    </p>
                  )}

                  {/* Camisetas */}
                  {(championship.jerseyUrl || championship.altJerseyUrl) && (
                    <div className="mt-2 md:mt-4">
                      {/* Layout para 2026: 2x2 grid */}
                      {championship.year === 2026 ? (
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          {/* Columna izquierda arriba: Titular jugador */}
                          {championship.jerseyUrl && (
                            <div className="text-center">
                              <img
                                src={championship.jerseyUrl}
                                alt="Titular"
                                className="h-20 sm:h-24 md:h-32 lg:h-40 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Titular</p>
                            </div>
                          )}

                          {/* Columna derecha arriba: Suplente jugador */}
                          {championship.altJerseyUrl && (
                            <div className="text-center">
                              <img
                                src={championship.altJerseyUrl}
                                alt="Suplente"
                                className="h-20 sm:h-24 md:h-32 lg:h-40 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Suplente</p>
                            </div>
                          )}

                          {/* Columna izquierda abajo: Titular arquero */}
                          <div className="text-center">
                            <img
                              src="/jerseys/2025-apertura-arq.png"
                              alt="Titular Arquero"
                              className="h-20 sm:h-24 md:h-32 lg:h-40 mx-auto object-contain mb-1 md:mb-2"
                            />
                            <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Arquero</p>
                          </div>

                          {/* Columna derecha abajo: Suplente arquero */}
                          <div className="text-center">
                            <img
                              src="/jerseys/2025-clausura-arq.png"
                              alt="Suplente Arquero"
                              className="h-20 sm:h-24 md:h-32 lg:h-40 mx-auto object-contain mb-1 md:mb-2"
                            />
                            <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Arquero</p>
                          </div>
                        </div>
                      ) : championship.year === 2024 ? (
                        /* Layout para 2024: 2 columnas (Titular + Arquero) */
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          {championship.jerseyUrl && (
                            <div className="text-center">
                              <img
                                src={championship.jerseyUrl}
                                alt="Titular"
                                className="h-20 sm:h-24 md:h-32 lg:h-48 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Titular</p>
                            </div>
                          )}
                          {getGoalkeeperJerseyUrl(championship.year, championship.season) && (
                            <div className="text-center">
                              <img
                                src={getGoalkeeperJerseyUrl(championship.year, championship.season)!}
                                alt="Arquero"
                                className="h-20 sm:h-24 md:h-32 lg:h-48 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Arquero</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Layout para 2025: 3 columnas (Titular + Suplente + Arquero) */
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                          {championship.jerseyUrl && (
                            <div className="text-center">
                              <img
                                src={championship.jerseyUrl}
                                alt="Titular"
                                className="h-20 sm:h-24 md:h-32 lg:h-48 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Titular</p>
                            </div>
                          )}
                          {championship.altJerseyUrl && (
                            <div className="text-center">
                              <img
                                src={championship.altJerseyUrl}
                                alt="Suplente"
                                className="h-20 sm:h-24 md:h-32 lg:h-48 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Suplente</p>
                            </div>
                          )}
                          {getGoalkeeperJerseyUrl(championship.year, championship.season) && (
                            <div className="text-center">
                              <img
                                src={getGoalkeeperJerseyUrl(championship.year, championship.season)!}
                                alt="Arquero"
                                className="h-20 sm:h-24 md:h-32 lg:h-48 mx-auto object-contain mb-1 md:mb-2"
                              />
                              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-600">Arquero</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Punto en la línea */}
              <div className="hidden md:flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full border-4 ${
                  championship.title === 'Campeonato' 
                    ? 'bg-red-600 border-white shadow-lg shadow-red-600/50' 
                    : championship.title === 'Próximo'
                    ? 'bg-blue-600 border-white shadow-lg shadow-blue-600/50'
                    : 'bg-gray-400 border-white'
                } relative z-10`} />
              </div>

              {/* Espacio vacío para el otro lado */}
              <div className="hidden md:block flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
