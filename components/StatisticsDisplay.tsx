import React, { useMemo } from 'react';
import { PlayerStats } from '../types';
import Leaderboard from './Leaderboard';

interface StatisticsDisplayProps {
  stats: PlayerStats[];
  onBack: () => void;
}

const StatisticsDisplay: React.FC<StatisticsDisplayProps> = ({ stats, onBack }) => {

  const sortedByPoints = useMemo(() => 
    [...stats].sort((a, b) => b.totalPoints - a.totalPoints),
    [stats]
  );

  const sortedByWins = useMemo(() => 
    [...stats].sort((a, b) => b.totalWins - a.totalWins),
    [stats]
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-slate-100 mb-4">Leaderboards</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Leaderboard title="Leaderboard (Points)" players={sortedByPoints} dataKey="totalPoints" unit="pts"/>
        <Leaderboard title="Leaderboard (Wins)" players={sortedByWins} dataKey="totalWins" unit="wins" />
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="bg-gray-800 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors duration-300"
        >
          Back to Schedule
        </button>
      </div>
    </div>
  );
};

export default StatisticsDisplay;