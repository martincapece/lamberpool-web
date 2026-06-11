interface ComparisonPoint {
  matchId: string;
  label: string;
  shortLabel: string;
  playerAValue: number | null;
  playerBValue: number | null;
}

interface PlayerComparisonChartProps {
  points: ComparisonPoint[];
  playerALabel: string;
  playerBLabel: string;
  metricLabel: string;
  playerAColor?: string;
  playerBColor?: string;
}

const DEFAULT_PLAYER_A_COLOR = '#0ea5e9';
const DEFAULT_PLAYER_B_COLOR = '#ef4444';

function roundValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function PlayerComparisonChart({
  points,
  playerALabel,
  playerBLabel,
  metricLabel,
  playerAColor = DEFAULT_PLAYER_A_COLOR,
  playerBColor = DEFAULT_PLAYER_B_COLOR,
}: PlayerComparisonChartProps) {
  if (points.length === 0) {
    return null;
  }

  const width = Math.max(760, points.length * 100);
  const height = 320;
  const paddingLeft = 56;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 70;

  const values = points
    .flatMap((point) => [point.playerAValue, point.playerBValue])
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length === 0) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        No hay valores suficientes para graficar la metrica seleccionada en los partidos compartidos.
      </div>
    );
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const chartInnerWidth = width - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (points.length <= 1) {
      return paddingLeft + chartInnerWidth / 2;
    }

    return paddingLeft + (index / (points.length - 1)) * chartInnerWidth;
  };

  const getY = (value: number) => {
    const normalized = (value - minValue) / valueRange;
    return paddingTop + chartInnerHeight - normalized * chartInnerHeight;
  };

  const buildPath = (key: 'playerAValue' | 'playerBValue') => {
    let path = '';
    let hasStartedSegment = false;

    points.forEach((point, index) => {
      const value = point[key];
      if (value === null) {
        hasStartedSegment = false;
        return;
      }

      const x = getX(index);
      const y = getY(value);

      if (!hasStartedSegment) {
        path += `M ${x} ${y}`;
        hasStartedSegment = true;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks }, (_, tickIndex) => {
    const ratio = tickIndex / (yTicks - 1);
    return maxValue - ratio * valueRange;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: playerAColor }} />
          <span className="font-medium">{playerALabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: playerBColor }} />
          <span className="font-medium">{playerBLabel}</span>
        </div>
        <span className="text-xs text-gray-500">Metrica: {metricLabel}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <svg width={width} height={height} role="img" aria-label={`Comparativa ${metricLabel}`}>
          {tickValues.map((tickValue, index) => {
            const y = getY(tickValue);
            return (
              <g key={`tick-${index}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                  {roundValue(tickValue)}
                </text>
              </g>
            );
          })}

          <line
            x1={paddingLeft}
            y1={paddingTop + chartInnerHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartInnerHeight}
            stroke="#9ca3af"
            strokeWidth="1"
          />

          <path d={buildPath('playerAValue')} fill="none" stroke={playerAColor} strokeWidth="2.5" />
          <path d={buildPath('playerBValue')} fill="none" stroke={playerBColor} strokeWidth="2.5" />

          {points.map((point, index) => {
            const x = getX(index);
            return (
              <g key={point.matchId}>
                {point.playerAValue !== null && (
                  <circle cx={x} cy={getY(point.playerAValue)} r="4" fill={playerAColor}>
                    <title>{`${playerALabel}: ${roundValue(point.playerAValue)} | ${point.label}`}</title>
                  </circle>
                )}
                {point.playerBValue !== null && (
                  <circle cx={x} cy={getY(point.playerBValue)} r="4" fill={playerBColor}>
                    <title>{`${playerBLabel}: ${roundValue(point.playerBValue)} | ${point.label}`}</title>
                  </circle>
                )}
                <text
                  x={x}
                  y={height - 16}
                  textAnchor="end"
                  transform={`rotate(-35 ${x} ${height - 16})`}
                  fontSize="10"
                  fill="#4b5563"
                >
                  {point.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
