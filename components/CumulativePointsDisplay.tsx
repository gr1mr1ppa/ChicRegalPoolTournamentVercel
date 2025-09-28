import React, { useMemo } from 'react';
import { TournamentSchedule } from '../types';

interface CumulativePointsDisplayProps {
  playerNames: string[];
  schedule: TournamentSchedule;
  onBack: () => void;
}

interface PlayerPointData {
  name: string;
  dailyScores: number[];
  total: number;
  lowestScoreIndex: number;
}

const CumulativePointsDisplay: React.FC<CumulativePointsDisplayProps> = ({ playerNames, schedule, onBack }) => {
  const pointsData = useMemo<PlayerPointData[]>(() => {
    const playerPointsMap: Map<string, { dailyScores: number[] }> = new Map(
      playerNames.map(name => [name, { dailyScores: Array(schedule.length).fill(0) }])
    );

    schedule.forEach((day, dayIndex) => {
      const substitutedPlayersForDay = new Set(Object.keys(day.substitutions || {}));
      
      day.rounds.forEach(round => {
        round.matchups.forEach(matchup => {
          const [player1, player2] = matchup.players;
          const [score1, score2] = matchup.scores;
          
          if (score1 !== null && !substitutedPlayersForDay.has(player1)) {
            const playerData = playerPointsMap.get(player1);
            if (playerData) {
              playerData.dailyScores[dayIndex] += score1;
            }
          }

          if (score2 !== null && !substitutedPlayersForDay.has(player2)) {
            const playerData = playerPointsMap.get(player2);
            if (playerData) {
              playerData.dailyScores[dayIndex] += score2;
            }
          }
        });
      });
    });
    
    const result = Array.from(playerPointsMap.entries())
      .map(([name, data]) => {
        const { dailyScores } = data;
        
        if (dailyScores.length === 0) {
          return { name, dailyScores, total: 0, lowestScoreIndex: -1 };
        }

        const minScore = Math.min(...dailyScores);
        const lowestScoreIndex = dailyScores.indexOf(minScore);
        
        const sum = dailyScores.reduce((acc, score) => acc + score, 0);
        const total = sum - minScore;

        return { name, dailyScores, total, lowestScoreIndex };
      })
      .sort((a, b) => b.total - a.total);

    return result;
  }, [playerNames, schedule]);

  const numDays = schedule?.length || 0;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-2xl sm:text-3xl font-bold text-orange-400 mb-6 text-center">Cumulative Points</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm sm:text-base text-left text-slate-300 border-collapse">
          <thead className="bg-gray-950/50 text-xs sm:text-sm text-slate-400 uppercase">
            <tr>
              <th scope="col" className="p-3 font-semibold tracking-wider text-left sticky left-0 bg-gray-950/50 z-10">Player</th>
              {Array.from({ length: numDays }, (_, i) => (
                <th key={i} scope="col" className="p-3 font-semibold tracking-wider text-center">Day {i + 1}</th>
              ))}
              <th scope="col" className="p-3 font-semibold tracking-wider text-center font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {pointsData.map(({ name, dailyScores, total, lowestScoreIndex }) => (
              <tr key={name} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-3 font-medium text-slate-100 whitespace-nowrap sticky left-0 bg-gray-900/80 backdrop-blur-sm">{name}</td>
                {dailyScores.map((score, i) => (
                  <td 
                    key={i} 
                    className={`p-3 text-center ${i === lowestScoreIndex ? 'text-red-400 font-bold' : ''}`}
                    title={i === lowestScoreIndex ? 'Lowest score (dropped from total)' : `Points for Day ${i + 1}`}
                  >
                    {score}
                  </td>
                ))}
                <td className="p-3 font-bold text-teal-300 text-center text-lg">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default CumulativePointsDisplay;