'use client';

import { OutputScores } from '@/types';
import { TrendingUp, Shield, Zap } from 'lucide-react';

interface ScoreDisplayProps {
  scores: OutputScores;
}

interface CircleProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  sublabel?: string;
}

function CircleProgress({ value, size = 80, strokeWidth = 6, color, label, sublabel }: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-gray-300">{label}</div>
        {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
      </div>
    </div>
  );
}

function getBadgeColor(value: number, type: 'detection' | 'positive'): string {
  if (type === 'detection') {
    if (value < 30) return 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50';
    if (value < 60) return 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50';
    return 'bg-red-900/40 text-red-400 border-red-700/50';
  } else {
    if (value >= 70) return 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50';
    if (value >= 40) return 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50';
    return 'bg-red-900/40 text-red-400 border-red-700/50';
  }
}

function getDetectionLabel(value: number): string {
  if (value < 30) return 'Low Risk';
  if (value < 60) return 'Medium Risk';
  return 'High Risk';
}

function getEngagementLabel(value: number): string {
  if (value >= 70) return 'High';
  if (value >= 40) return 'Medium';
  return 'Low';
}

export default function ScoreDisplay({ scores }: ScoreDisplayProps) {
  const { humanScore, aiDetectability, engagementPotential, improvements, strengths } = scores;

  return (
    <div className="space-y-4">
      {/* Main scores */}
      <div className="flex items-center justify-around p-4 bg-gray-900/40 rounded-xl border border-gray-800">
        <CircleProgress
          value={humanScore}
          color="#8b5cf6"
          label="Human Score"
          sublabel={humanScore >= 70 ? 'Sounds Human' : humanScore >= 40 ? 'Mixed' : 'Still AI-ish'}
        />

        <div className="flex flex-col gap-3">
          {/* AI Detectability */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">AI Detectability</div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(aiDetectability, 'detection')}`}>
                {aiDetectability}% — {getDetectionLabel(aiDetectability)}
              </span>
            </div>
          </div>

          {/* Engagement */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Engagement</div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(engagementPotential, 'positive')}`}>
                {engagementPotential}% — {getEngagementLabel(engagementPotential)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">What works well</span>
          </div>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {improvements && improvements.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Suggestions</span>
          </div>
          <ul className="space-y-1">
            {improvements.map((imp, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                <span className="text-yellow-500 mt-0.5">→</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
