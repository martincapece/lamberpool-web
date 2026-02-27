'use client'

import CompetitionsGrid from '@/components/CompetitionsGrid';

export default function Home() {

  return (
    <div className="space-y-8 md:space-y-10 px-4 md:px-0">
      {/* Hero Banner con Foto del Equipo */}
      <section className="relative h-48 md:h-96 rounded-lg md:rounded-2xl overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center filter brightness-75"
          style={{
            backgroundImage: `url('/team-photo.jpeg')`,
            backgroundPosition: 'center 30%',
            backgroundSize: 'cover',
          }}
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Contenido flotante */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-7xl font-black text-white text-center drop-shadow-lg tracking-wider px-4">
            LAMBERPOOL
          </h1>
          <div className="mt-2 md:mt-4 h-1 w-20 md:w-32 bg-red-600 rounded-full" />
          <p className="mt-3 md:mt-6 text-xs md:text-lg text-white/90 text-center max-w-2xl px-4">
            ¡Te Lambo To'a y Te Enchulo!
          </p>
        </div>
      </section>

      {/* Sección de Competencias */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-lg md:rounded-2xl p-4 md:p-10 shadow-lg border-t-4 border-red-600">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">Competencias Disputadas</h2>
        <p className="text-gray-300 max-w-2xl text-sm md:text-base">
          Clickea sobre una competencia para ver todos los partidos. Si está disponible, visualiza la tabla final.
        </p>
      </section>

      {/* Grid de Competencias - Contenedor centralizado */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-7xl">
          <CompetitionsGrid />
        </div>
      </div>
    </div>
  );
}
