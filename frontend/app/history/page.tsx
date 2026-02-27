'use client';

import ChampionshipTimeline from '@/components/ChampionshipTimeline';

export default function HistoryPage() {
  return (
    <div className="space-y-8 md:space-y-12">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-lg md:rounded-2xl p-6 md:p-12 border-l-8 border-red-600">
        <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4">Historia de Lamberpool FC</h1>
        <p className="text-sm md:text-lg text-gray-300 max-w-3xl">
          Conoce el recorrido del equipo a través de sus campeonatos y logros. Desde sus inicios, Lamberpool FC ha demostrado pasión, 
          dedicación y excelencia en cada torneo que disputa. 🔥
        </p>
      </section>

      {/* Timeline */}
      <ChampionshipTimeline />

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-4 border-red-600 rounded-lg p-6 text-center shadow-lg">
          <p className="text-4xl md:text-5xl font-black text-red-600">1</p>
          <p className="text-gray-700 font-bold mt-2">Campeonato</p>
          <p className="text-xs md:text-sm text-gray-600">4ta División Liga Nuñez 2025</p>
        </div>
        <div className="bg-white border-4 border-gray-400 rounded-lg p-6 text-center shadow-lg">
          <p className="text-4xl md:text-5xl font-black text-gray-600">2</p>
          <p className="text-gray-700 font-bold mt-2">Subcampeonatos</p>
          <p className="text-xs md:text-sm text-gray-600">1ra (2024) y 5ta (2025)</p>
        </div>
        <div className="bg-black border-4 border-white rounded-lg p-6 text-center shadow-lg">
          <p className="text-4xl md:text-5xl font-black text-white">3</p>
          <p className="text-white font-bold mt-2">Años Activo</p>
          <p className="text-xs md:text-sm text-gray-400">Desde 2024</p>
        </div>
      </section>
    </div>
  );
}
