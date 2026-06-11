'use client';

import { useState } from 'react';

export interface ComparisonPoint {
  matchId: string;
  dateLabel: string;
  opponent: string;
  competitionName: string;
  shortLabel: string;
  playerAValue: number | null;
  playerBValue: number | null;
}

interface PlayerComparisonChartProps {
  points: ComparisonPoint[];
  playerALabel: string;
  playerBLabel: string;
  metricLabel: string;
  metricKey: 'rating' | 'goals' | 'cards' | 'combined';
  playerAColor?: string;
  playerBColor?: string;
}

const DEFAULT_PLAYER_A_COLOR = '#0ea5e9';
const DEFAULT_PLAYER_B_COLOR = '#ef4444';

function roundValue(value: number, fixed = 2): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(fixed);
}

function getMetricPrefix(metricKey: PlayerComparisonChartProps['metricKey']): string {
  if (metricKey === 'goals') {
    return 'Goles';
  }

  if (metricKey === 'cards') {
    return 'Tarjetas';
  }

  if (metricKey === 'combined') {
    return 'Indice ELO';
  }

  return 'Rating';
}

function computeTickValues(
  metricKey: PlayerComparisonChartProps['metricKey'],
  minValue: number,
  maxValue: number
): number[] {
  if (metricKey === 'goals' || metricKey === 'cards') {
    const minInteger = Math.floor(minValue);
    const maxInteger = Math.ceil(maxValue);

    if (minInteger === maxInteger) {
      return [minInteger - 1, minInteger, minInteger + 1];
    }

    const values: number[] = [];
    for (let value = minInteger; value <= maxInteger; value++) {
      values.push(value);
    }

    return values;
  }

  const totalTicks = 6;
  const range = maxValue - minValue || 1;
  return Array.from({ length: totalTicks }, (_, index) => maxValue - (index / (totalTicks - 1)) * range);
}

export default function PlayerComparisonChart({
  points,
  playerALabel,
  playerBLabel,
  metricLabel,
  metricKey,
  playerAColor = DEFAULT_PLAYER_A_COLOR,
  playerBColor = DEFAULT_PLAYER_B_COLOR,
}: PlayerComparisonChartProps) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return null;
  }

  const width = Math.max(900, points.length * 110);
  const height = 420;
  const paddingLeft = 60;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 130;

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
  const tickValues = computeTickValues(metricKey, minValue, maxValue);
  const yMin = Math.min(...tickValues);
  const yMax = Math.max(...tickValues);
  const yRange = yMax - yMin || 1;

  const chartInnerWidth = width - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (points.length <= 1) {
      return paddingLeft + chartInnerWidth / 2;
    }

    return paddingLeft + (index / (points.length - 1)) * chartInnerWidth;
  };

  const getY = (value: number) => {
    const normalized = (value - yMin) / yRange;
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

  const metricPrefix = getMetricPrefix(metricKey);
  const activePoint = activePointIndex !== null ? points[activePointIndex] : null;
  const activeX = activePointIndex !== null ? getX(activePointIndex) : null;

  const formatTick = (value: number) => {
    if (metricKey === 'goals' || metricKey === 'cards') {
      return String(Math.round(value));
    }

    if (metricKey === 'rating') {
      return roundValue(value, 1);
    }

    return roundValue(value, 0);
  };

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

      <div className="relative overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <svg width={width} height={height} role="img" aria-label={`Comparativa ${metricLabel}`}>
          {tickValues.map((tickValue, index) => {
            const y = getY(tickValue);
            return (
              <g key={`tick-${index}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                  {formatTick(tickValue)}
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
                  <g>
                    <circle
                      cx={x}
                      cy={getY(point.playerAValue)}
                      r="6"
                      fill="transparent"
                      onMouseEnter={() => setActivePointIndex(index)}
                      onMouseLeave={() => setActivePointIndex((current) => (current === index ? null : current))}
                      onTouchStart={() => setActivePointIndex(index)}
                    />
                    <circle cx={x} cy={getY(point.playerAValue)} r="4" fill={playerAColor} />
                  </g>
                )}
                {point.playerBValue !== null && (
                  <g>
                    <circle
                      cx={x}
                      cy={getY(point.playerBValue)}
                      r="6"
                      fill="transparent"
                      onMouseEnter={() => setActivePointIndex(index)}
                      onMouseLeave={() => setActivePointIndex((current) => (current === index ? null : current))}
                      onTouchStart={() => setActivePointIndex(index)}
                    />
                    <circle cx={x} cy={getY(point.playerBValue)} r="4" fill={playerBColor} />
                  </g>
                )}
                <text
                  x={x}
                  y={height - 18}
                  textAnchor="end"
                  transform={`rotate(-45 ${x} ${height - 18})`}
                  fontSize="9"
                  fill="#4b5563"
                >
                  {point.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {activePoint && activeX !== null && (
          <div
            className="pointer-events-none absolute z-20 min-w-56 rounded-md border border-gray-200 bg-white/95 p-3 text-xs text-gray-700 shadow-lg"
            style={{
              left: Math.max(8, Math.min(activeX - 110, width - 260)),
              top: 10,
            }}
          >
            <p className="font-semibold text-gray-900">
              {activePoint.dateLabel} - {activePoint.opponent}
            </p>
            <p className="text-gray-500">{activePoint.competitionName}</p>
            <div className="mt-2 space-y-1">
              <p style={{ color: playerAColor }}>
                {metricPrefix} [{playerALabel}]:{' '}
                {activePoint.playerAValue !== null ? roundValue(activePoint.playerAValue, metricKey === 'rating' ? 2 : 0) : '-'}
              </p>
              <p style={{ color: playerBColor }}>
                {metricPrefix} [{playerBLabel}]:{' '}
                {activePoint.playerBValue !== null ? roundValue(activePoint.playerBValue, metricKey === 'rating' ? 2 : 0) : '-'}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500 md:hidden">
        Desliza horizontalmente para ver todos los partidos y toca un punto para ver detalle.
      </p>
    </div>
  );
}
