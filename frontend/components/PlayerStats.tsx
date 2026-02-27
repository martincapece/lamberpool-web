interface PlayerStatsProps {
  name: string;
  number: number;
  goals: number;
  rating: number;
  matches?: number;
}

export default function PlayerStats({ name, number, goals, rating, matches = 0 }: PlayerStatsProps) {
  const ratingColor =
    rating >= 8
      ? 'text-green-600'
      : rating >= 6
        ? 'text-blue-600'
        : rating >= 4
          ? 'text-yellow-600'
          : rating > 0
            ? 'text-red-600'
            : 'text-gray-400';

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-2 md:mb-3">
        <div>
          <p className="text-xs md:text-sm text-gray-500">#{number}</p>
          <h3 className="text-base md:text-lg font-bold text-gray-800">{name}</h3>
        </div>
        <span className={`text-xl md:text-2xl font-bold ${ratingColor}`}>
          {rating > 0 ? rating.toFixed(1) : 'S/N'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm">
        <div className="text-center">
          <p className="text-gray-500 text-[10px] md:text-xs">Partidos</p>
          <p className="text-base md:text-lg font-bold text-blue-600">{matches}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-[10px] md:text-xs">Goles</p>
          <p className="text-base md:text-lg font-bold text-green-600">{goals}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-[10px] md:text-xs">Valoración</p>
          <p className={`text-base md:text-lg font-bold ${ratingColor}`}>
            {rating > 0 ? rating.toFixed(1) : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
