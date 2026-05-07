interface MatchCardProps {
  opponent: string;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
}

export default function MatchCard({
  opponent,
  date,
  goalsFor,
  goalsAgainst,
  result,
}: MatchCardProps) {
  const resultColor =
    result === 'W'
      ? 'bg-green-100 text-green-800'
      : result === 'D'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

  const resultText = result === 'W' ? 'VICTORIA' : result === 'D' ? 'EMPATE' : 'DERROTA';

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 border-l-4 border-blue-600">
      <div className="flex justify-between items-start gap-3 mb-3 md:mb-4">
        <div>
          <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-800">vs {opponent}</h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">{new Date(date).toLocaleDateString('es-ES')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold ${resultColor}`}>
          {resultText}
        </span>
      </div>

      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-800">
        {goalsFor} <span className="text-lg md:text-2xl lg:text-3xl">-</span> {goalsAgainst}
      </div>
    </div>
  )
}
