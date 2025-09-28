import React, { useMemo, useState, useEffect } from 'react';
import { TournamentSchedule, Day, Round, Matchup } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ShuffleIcon } from './icons/ShuffleIcon';
import { SaveIcon } from './icons/SaveIcon';
import SubstitutionDialog from './SubstitutionDialog';
import ConfirmationDialog from './ConfirmationDialog';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';

interface ScheduleDisplayProps {
    schedule: TournamentSchedule;
    playerNames: string[];
    onScoreChange: (dayIndex: number, roundIndex: number, matchupIndex: number, playerIndex: 0 | 1, score: string) => void;
    onWinnerChange: (dayIndex: number, winnerName: string) => void;
    onDateChange: (dayIndex: number, newDate: string) => void;
    onShuffleRound: (dayIndex: number, roundIndex: number) => void;
    onSubstitutePlayer: (dayIndex: number, originalPlayer: string, substitutePlayer: string) => void;
    onToggleDayLock: (dayIndex: number) => void;
    onMatchupPlayersChange: (dayIndex: number, roundIndex: number, matchupIndex: number, newPlayers: [string, string]) => void;
}

const MatchupCard: React.FC<{ 
    matchup: Matchup;
    dayIndex: number;
    roundIndex: number;
    matchupIndex: number;
    onScoreChange: ScheduleDisplayProps['onScoreChange'];
    substitutions?: { [key: string]: string };
    isLocked?: boolean;
    allPlayers: string[];
    onMatchupPlayersChange: ScheduleDisplayProps['onMatchupPlayersChange'];
}> = ({ matchup, dayIndex, roundIndex, matchupIndex, onScoreChange, substitutions = {}, isLocked, allPlayers, onMatchupPlayersChange }) => {
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlayers, setEditedPlayers] = useState<[string, string]>(matchup.players);

    useEffect(() => {
        setEditedPlayers(matchup.players);
    }, [matchup.players]);

    const handleInputChange = (playerIndex: 0 | 1, event: React.ChangeEvent<HTMLInputElement>) => {
        onScoreChange(dayIndex, roundIndex, matchupIndex, playerIndex, event.target.value);
    };
    
    const handlePlayerChange = (playerIndex: 0 | 1, newPlayer: string) => {
        // Fix: Use a type assertion because spreading a tuple (`[string, string]`) creates a
        // standard array (`string[]`), which TypeScript won't assign back to a tuple type.
        const newEditedPlayers = [...editedPlayers] as [string, string];
        newEditedPlayers[playerIndex] = newPlayer;
        setEditedPlayers(newEditedPlayers);
    };

    const handleEditSaveClick = () => {
        if (isEditing) {
            // Save logic
            if (editedPlayers[0] === editedPlayers[1]) {
                alert("Players in a matchup must be different.");
                return;
            }
            onMatchupPlayersChange(dayIndex, roundIndex, matchupIndex, editedPlayers);
            setIsEditing(false);
        } else {
            // Enter edit mode
            setIsEditing(true);
        }
    };

    const substituteForPlayer1 = substitutions[matchup.players[0]];
    const substituteForPlayer2 = substitutions[matchup.players[1]];

    const player1DisplayName = substituteForPlayer1 ? `${substituteForPlayer1} (Sub)` : matchup.players[0];
    const player1Title = substituteForPlayer1 ? `${substituteForPlayer1} (for ${matchup.players[0]})` : matchup.players[0];
    
    const player2DisplayName = substituteForPlayer2 ? `${substituteForPlayer2} (Sub)` : matchup.players[1];
    const player2Title = substituteForPlayer2 ? `${substituteForPlayer2} (for ${matchup.players[1]})` : matchup.players[1];
    
    return (
        <div className="relative bg-gray-950/70 p-4 rounded-md flex items-center justify-around gap-2 transition-transform hover:scale-105 duration-200 text-center">
            {!isLocked && (
                <div className="absolute top-1 right-1 z-10">
                    <button
                        onClick={handleEditSaveClick}
                        className="p-1.5 rounded-full hover:bg-gray-800 text-slate-400 hover:text-orange-300 transition-colors duration-200"
                        title={isEditing ? 'Save Players' : 'Edit Players'}
                    >
                        {isEditing ? <SaveIcon className="w-5 h-5 text-teal-400" /> : <PencilIcon className="w-5 h-5" />}
                    </button>
                </div>
            )}
            
            {isEditing ? (
                 <>
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <select
                            value={editedPlayers[0]}
                            onChange={(e) => handlePlayerChange(0, e.target.value)}
                            className="w-full bg-gray-800/80 text-orange-300 text-center rounded-md p-1 focus:ring-2 focus:ring-orange-500 focus:outline-none transition font-medium"
                            aria-label={`Select player 1 for matchup ${matchupIndex + 1}`}
                        >
                            {allPlayers.map(p => <option key={`p1-${p}`} value={p}>{p}</option>)}
                        </select>
                         <input 
                            type="number" 
                            min="0"
                            value={matchup.scores[0] ?? ''}
                            onChange={(e) => handleInputChange(0, e)}
                            className="w-20 bg-gray-800/80 text-white text-center rounded-md p-1 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                            aria-label={`Score for ${editedPlayers[0]}`}
                        />
                    </div>
                    <span className="mx-1 text-slate-500 font-bold text-lg">vs</span>
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <select
                            value={editedPlayers[1]}
                            onChange={(e) => handlePlayerChange(1, e.target.value)}
                            className="w-full bg-gray-800/80 text-teal-300 text-center rounded-md p-1 focus:ring-2 focus:ring-teal-500 focus:outline-none transition font-medium"
                            aria-label={`Select player 2 for matchup ${matchupIndex + 1}`}
                        >
                             {allPlayers.map(p => <option key={`p2-${p}`} value={p}>{p}</option>)}
                        </select>
                        <input 
                            type="number" 
                            min="0"
                            value={matchup.scores[1] ?? ''}
                            onChange={(e) => handleInputChange(1, e)}
                            className="w-20 bg-gray-800/80 text-white text-center rounded-md p-1 focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                            aria-label={`Score for ${editedPlayers[1]}`}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <span className="font-medium text-orange-300 w-full truncate" title={player1Title}>
                            {player1DisplayName}
                        </span>
                        <input 
                            type="number" 
                            min="0"
                            value={matchup.scores[0] ?? ''}
                            onChange={(e) => handleInputChange(0, e)}
                            disabled={isLocked}
                            className="w-20 bg-gray-800/80 text-white text-center rounded-md p-1 focus:ring-2 focus:ring-orange-500 focus:outline-none transition disabled:bg-gray-900 disabled:cursor-not-allowed"
                            aria-label={`Score for ${matchup.players[0]}`}
                        />
                    </div>
                    
                    <span className="mx-1 text-slate-500 font-bold text-lg">vs</span>

                    <div className="flex flex-col items-center gap-2 flex-1">
                        <span className="font-medium text-teal-300 w-full truncate" title={player2Title}>
                            {player2DisplayName}
                        </span>
                        <input 
                            type="number" 
                            min="0"
                            value={matchup.scores[1] ?? ''}
                            onChange={(e) => handleInputChange(1, e)}
                            disabled={isLocked}
                            className="w-20 bg-gray-800/80 text-white text-center rounded-md p-1 focus:ring-2 focus:ring-teal-500 focus:outline-none transition disabled:bg-gray-900 disabled:cursor-not-allowed"
                            aria-label={`Score for ${matchup.players[1]}`}
                        />
                    </div>
                </>
            )}
        </div>
    );
};


const RoundCard: React.FC<{ 
    round: Round;
    dayIndex: number;
    roundIndex: number;
    onScoreChange: ScheduleDisplayProps['onScoreChange'];
    onShuffleRound: (dayIndex: number, roundIndex: number) => void;
    substitutions?: { [key: string]: string };
    isLocked?: boolean;
    allPlayers: string[];
    onMatchupPlayersChange: ScheduleDisplayProps['onMatchupPlayersChange'];
}> = ({ round, dayIndex, roundIndex, onScoreChange, onShuffleRound, substitutions, isLocked, allPlayers, onMatchupPlayersChange }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-3 border-b-2 border-gray-700 pb-2">
                <h4 className="text-lg font-semibold text-slate-300">Round {round.round}</h4>
                <button
                    onClick={() => onShuffleRound(dayIndex, roundIndex)}
                    disabled={isLocked}
                    className="p-1.5 rounded-full hover:bg-gray-800 text-slate-400 hover:text-orange-300 transition-colors duration-200 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Shuffle matchups in this round"
                    aria-label={`Shuffle matchups for day ${dayIndex + 1}, round ${round.round}`}
                >
                    <ShuffleIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {round.matchups.map((matchup, matchupIndex) => (
                    <MatchupCard 
                        matchup={matchup}
                        key={`${dayIndex}-${roundIndex}-${matchupIndex}-${matchup.players.join('-')}`} // Key now includes players to handle re-ordering
                        dayIndex={dayIndex}
                        roundIndex={roundIndex}
                        matchupIndex={matchupIndex}
                        onScoreChange={onScoreChange}
                        substitutions={substitutions}
                        isLocked={isLocked}
                        allPlayers={allPlayers}
                        onMatchupPlayersChange={onMatchupPlayersChange}
                    />
                ))}
            </div>
        </div>
    );
};

const DayCard: React.FC<{ 
    day: Day;
    dayIndex: number;
    onScoreChange: ScheduleDisplayProps['onScoreChange'];
    onWinnerChange: (dayIndex: number, winnerName: string) => void;
    onDateChange: (dayIndex: number, newDate: string) => void;
    onShuffleRound: (dayIndex: number, roundIndex: number) => void;
    onSubstitutePlayer: (dayIndex: number, originalPlayer: string, substitutePlayer: string) => void;
    onToggleDayLock: (dayIndex: number) => void;
    allPlayers: string[];
    onMatchupPlayersChange: ScheduleDisplayProps['onMatchupPlayersChange'];
}> = ({ day, dayIndex, onScoreChange, onWinnerChange, onDateChange, onShuffleRound, onSubstitutePlayer, onToggleDayLock, allPlayers, onMatchupPlayersChange }) => {
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [currentDate, setCurrentDate] = useState(day.date || '');
    const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
    const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
    
    useEffect(() => {
        setCurrentDate(day.date || '');
    }, [day.date]);

    const handleDateSave = () => {
        onDateChange(dayIndex, currentDate);
        setIsEditingDate(false);
    };

    const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleDateSave();
        } else if (e.key === 'Escape') {
            setCurrentDate(day.date || '');
            setIsEditingDate(false);
        }
    };
    
    const handleConfirmLockToggle = () => {
      onToggleDayLock(dayIndex);
      setIsLockConfirmOpen(false);
    };

    const dailyPlayerScores = useMemo(() => {
        const scores: { [key: string]: number } = {};
        const substitutionMap = day.substitutions || {};
        const allPlayersForDay = new Set<string>();
    
        // First, find all original players scheduled for the day
        day.rounds.forEach(round => {
            round.matchups.forEach(matchup => {
                allPlayersForDay.add(matchup.players[0]);
                allPlayersForDay.add(matchup.players[1]);
            });
        });
    
        // Initialize scores for all original players to 0
        allPlayersForDay.forEach(p => {
            scores[p] = 0;
        });
    
        // Calculate scores, attributing to substitutes where applicable
        day.rounds.forEach(round => {
            round.matchups.forEach(matchup => {
                const [p1, p2] = matchup.players;
                const [s1, s2] = matchup.scores;
    
                const sub1 = substitutionMap[p1];
                const sub2 = substitutionMap[p2];
    
                const scoreHolder1 = sub1 ? `${sub1} (Sub)` : p1;
                const scoreHolder2 = sub2 ? `${sub2} (Sub)` : p2;
    
                if (s1 !== null) {
                    scores[scoreHolder1] = (scores[scoreHolder1] || 0) + s1;
                }
    
                if (s2 !== null) {
                    scores[scoreHolder2] = (scores[scoreHolder2] || 0) + s2;
                }
            });
        });
    
        // Filter out original players who were substituted
        const finalScores = Object.entries(scores).filter(([name]) => {
            return !Object.keys(substitutionMap).includes(name);
        });
    
        return finalScores
            .map(([name, points]) => ({ name, points }))
            .sort((a, b) => b.points - a.points);
    }, [day]);

    const dayParticipants = useMemo(() => {
        const participants = new Set<string>();
        const substitutionMap = day.substitutions || {};

        day.rounds.forEach(round => {
            round.matchups.forEach(matchup => {
                const [p1, p2] = matchup.players;
                
                // If p1 was substituted, add the substitute's name. Otherwise, add p1.
                participants.add(substitutionMap[p1] || p1);

                // If p2 was substituted, add the substitute's name. Otherwise, add p2.
                participants.add(substitutionMap[p2] || p2);
            });
        });
        
        return Array.from(participants).sort();
    }, [day]);

    const playersAvailableToSubstitute = useMemo(() => {
        const playerSet = new Set<string>();
        day.rounds.forEach(round => {
            round.matchups.forEach(matchup => {
                playerSet.add(matchup.players[0]);
                playerSet.add(matchup.players[1]);
            });
        });
        const alreadySubstituted = Object.keys(day.substitutions || {});
        return Array.from(playerSet).filter(p => !alreadySubstituted.includes(p)).sort();
    }, [day]);


    return (
      <>
        <div className="bg-gray-900/60 p-6 rounded-lg shadow-xl border border-gray-700 backdrop-blur-sm">
            <div className="flex flex-wrap gap-4 justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold text-orange-400">Game {day.day}</h3>
                    {isEditingDate && !day.isLocked ? (
                        <input
                          type="text"
                          value={currentDate}
                          onChange={(e) => setCurrentDate(e.target.value)}
                          onBlur={handleDateSave}
                          onKeyDown={handleDateKeyDown}
                          className="bg-gray-800 text-slate-100 text-sm p-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none w-40"
                          placeholder="e.g., July 4th"
                          autoFocus
                        />
                    ) : (
                        <div
                            className={`group relative ${day.isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                            onClick={() => !day.isLocked && setIsEditingDate(true)}
                            title={day.isLocked ? day.date || 'Date is locked' : "Set/Edit Date"}
                        >
                            {day.date ? (
                                <div className={`flex items-center gap-2 bg-gray-950/50 p-2 rounded-md ${!day.isLocked && 'group-hover:bg-gray-800/80 transition-colors'}`}>
                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold text-slate-100 text-sm">{day.date}</span>
                                    {!day.isLocked && <PencilIcon className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                            ) : (
                                <button disabled={day.isLocked} className="flex items-center gap-2 bg-gray-800/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>Add Date</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 text-right">
                    <div className="flex items-center gap-2">
                        <label htmlFor={`winner-select-${dayIndex}`} className="text-sm font-semibold text-yellow-400 shrink-0">
                            🏆 Winner:
                        </label>
                        <select
                            id={`winner-select-${dayIndex}`}
                            value={day.winner || ''}
                            onChange={(e) => onWinnerChange(dayIndex, e.target.value)}
                            disabled={day.isLocked}
                            className="w-full sm:w-48 bg-gray-800 text-slate-100 text-sm font-semibold p-2 rounded-md focus:ring-2 focus:ring-yellow-500 focus:outline-none transition disabled:bg-gray-900 disabled:cursor-not-allowed"
                            aria-label={`Select winner for Game ${day.day}`}
                        >
                            <option value="">-- Select Winner --</option>
                            {dayParticipants.map(player => (
                            <option key={player} value={player}>{player}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={() => setIsSubDialogOpen(true)}
                        disabled={day.isLocked || playersAvailableToSubstitute.length === 0}
                        className="bg-sky-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Substitute
                    </button>
                    <button 
                        onClick={() => setIsLockConfirmOpen(true)}
                        className={`font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                            day.isLocked 
                                ? 'bg-yellow-600/80 text-white hover:bg-yellow-500'
                                : 'bg-green-600/80 text-white hover:bg-green-500'
                        }`}
                    >
                        {day.isLocked ? <><LockClosedIcon className="w-4 h-4" /> Edit Day</> : <><LockOpenIcon className="w-4 h-4" /> Save Day</>}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {day.rounds.map((round, roundIndex) => (
                    <RoundCard 
                        round={round} 
                        key={roundIndex}
                        dayIndex={dayIndex}
                        roundIndex={roundIndex}
                        onScoreChange={onScoreChange}
                        onShuffleRound={onShuffleRound}
                        substitutions={day.substitutions}
                        isLocked={day.isLocked}
                        allPlayers={allPlayers}
                        onMatchupPlayersChange={onMatchupPlayersChange}
                    />
                ))}
            </div>

            {dailyPlayerScores.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <h4 className="text-xl font-semibold text-slate-300 mb-4">Game {day.day} Summary</h4>
                    <ul className="space-y-2">
                        {dailyPlayerScores.map((playerStat, index) => (
                             <li key={playerStat.name} className="flex items-center justify-between bg-gray-950/40 p-3 rounded-md">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-md text-slate-400 w-6 text-center">{index + 1}</span>
                                    <span className="font-medium text-slate-200">{playerStat.name}</span>
                                </div>
                                <span className="font-bold text-lg text-teal-300">{playerStat.points} <span className="text-xs text-slate-400">pts</span></span>
                             </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
        <SubstitutionDialog 
            isOpen={isSubDialogOpen}
            onClose={() => setIsSubDialogOpen(false)}
            onSave={(original, substitute) => onSubstitutePlayer(dayIndex, original, substitute)}
            players={playersAvailableToSubstitute}
        />
        <ConfirmationDialog
            isOpen={isLockConfirmOpen}
            onConfirm={handleConfirmLockToggle}
            onCancel={() => setIsLockConfirmOpen(false)}
            title={day.isLocked ? 'Unlock Day for Editing?' : 'Save and Lock Day?'}
            message={day.isLocked 
                ? 'Unlocking this day will allow you to change scores, the winner, and the date. Are you sure you want to proceed?' 
                : 'This will lock all scores, the date, and the winner for this day to prevent accidental changes. You can edit it again later if needed.'
            }
        />
      </>
    );
};


const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, onScoreChange, onWinnerChange, onDateChange, onShuffleRound, onSubstitutePlayer, onToggleDayLock, playerNames, onMatchupPlayersChange }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // When the schedule changes (e.g., new tournament generated), reset to the first day.
  // This prevents an out-of-bounds error if the new schedule has fewer days than the previous one.
  useEffect(() => {
    setActiveDayIndex(0);
  }, [schedule]);
  
  const activeDay = schedule[activeDayIndex];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-gray-700 pb-3 justify-center">
        {schedule.map((day, index) => (
          <button
            key={day.day}
            onClick={() => setActiveDayIndex(index)}
            className={`font-bold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              activeDayIndex === index
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-800 text-slate-300 hover:bg-gray-700 focus:ring-orange-500'
            }`}
          >
            Game {day.day}
          </button>
        ))}
      </div>
      
      {activeDay && (
        <DayCard 
            day={activeDay} 
            key={activeDayIndex} // Add key to ensure component re-mounts on day change
            dayIndex={activeDayIndex}
            onScoreChange={onScoreChange}
            onWinnerChange={onWinnerChange}
            onDateChange={onDateChange}
            onShuffleRound={onShuffleRound}
            onSubstitutePlayer={onSubstitutePlayer}
            onToggleDayLock={onToggleDayLock}
            allPlayers={playerNames}
            onMatchupPlayersChange={onMatchupPlayersChange}
        />
      )}
    </div>
  );
};

export default ScheduleDisplay;