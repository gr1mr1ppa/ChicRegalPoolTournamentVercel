import React from 'react';
import { PlayerStats } from '../types';

interface LeaderboardProps {
  title: string;
  players: PlayerStats[];
  dataKey: 'totalPoints' | 'totalWins';
  unit: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ title, players, dataKey, unit }) => (
  <div className="bg-gray-900/60 p-6 rounded-lg shadow-xl border border-gray-700 backdrop-blur-sm">
    <h3 className="text-2xl font-bold text-orange-400 mb-6 text-center">{title}</h3>
    <ul className="space-y-3">
      {players.map((player, index) => (
        <li key={player.name} className="flex items-center justify-between bg-gray-950/50 p-3 rounded-md">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-slate-400 w-6 text-center">{index + 1}</span>
            <span className="font-medium text-slate-200">{player.name}</span>
          </div>
          <span className="font-bold text-xl text-teal-300">{player[dataKey]} <span className="text-sm text-slate-400">{unit}</span></span>
        </li>
      ))}
      {players.length === 0 && (
        <p className="text-slate-400 text-center">No statistics to display yet.</p>
      )}
    </ul>
  </div>
);

export default Leaderboard;