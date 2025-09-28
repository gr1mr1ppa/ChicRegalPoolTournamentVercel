import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TournamentSchedule, PlayerStats, Day, Round, Matchup, SavedTournament } from './types';
import { generateSchedule } from './services/geminiService';
import ScheduleDisplay from './components/ScheduleDisplay';
import PlayerEditor from './components/PlayerEditor';
import StatisticsDisplay from './components/StatisticsDisplay';
import PastTournamentsDisplay from './components/PastTournamentsDisplay';
import CumulativePointsDisplay from './components/CumulativePointsDisplay';
import ConfirmationDialog from './components/ConfirmationDialog';
import { LoadingSpinnerIcon } from './components/icons/LoadingSpinnerIcon';
import { ErrorIcon } from './components/icons/ErrorIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { PencilIcon } from './components/icons/PencilIcon';

type View = 'schedule' | 'editPlayers' | 'statistics' | 'pastTournaments' | 'cumulativePoints';

const App: React.FC = () => {
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`)
  );
  const [schedule, setSchedule] = useState<TournamentSchedule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start in loading state
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('schedule');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>('Tournament Schedule');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(scheduleTitle);
  const [pastTournaments, setPastTournaments] = useState<SavedTournament[]>([]);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Unified function for generating a schedule.
  // Wrapped in useCallback with an empty dependency array because setters from useState are stable.
  // This function's identity will not change across re-renders.
  const runScheduleGeneration = useCallback(async (currentPlayers: string[]) => {
    setIsLoading(true);
    setError(null);
    setSchedule(null);

    const numPlayers = currentPlayers.length;
    const numDays = 6;
    // When the selected number of players is 8, do 4 rounds per day. Otherwise, 3 rounds.
    const numRounds = numPlayers === 8 ? 4 : 3;

    try {
      const generatedScheduleFromApi = await generateSchedule(currentPlayers, numDays, numRounds);
      
      // Augment the schedule data with a place to store scores, winners, and dates
      const scheduleWithScores: TournamentSchedule = generatedScheduleFromApi.map(day => ({
        ...day,
        winner: null,
        date: null,
        isLocked: false,
        rounds: day.rounds.map(round => ({
          ...round,
          matchups: round.matchups.map(matchup => ({
            players: matchup.players,
            scores: [null, null]
          }))
        }))
      }));

      setSchedule(scheduleWithScores);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the schedule.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Effect for initial data load. Runs only once on mount.
  useEffect(() => {
    const loadInitialData = async () => {
      // Load past tournaments from localStorage
      const saved = localStorage.getItem('pastTournaments');
      if (saved) {
          try {
              const parsedTournaments = JSON.parse(saved);
              if (Array.isArray(parsedTournaments)) {
                  setPastTournaments(parsedTournaments);
              } else {
                  localStorage.removeItem('pastTournaments');
              }
          } catch (error) {
              console.error("Failed to parse past tournaments from localStorage:", error);
              localStorage.removeItem('pastTournaments');
          }
      }
      
      // Generate the initial schedule using the unified function.
      const initialPlayerNames = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`);
      await runScheduleGeneration(initialPlayerNames);
    };

    loadInitialData();
  }, [runScheduleGeneration]);

  // Effect to close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect to sync current title for editing with the saved title
  useEffect(() => {
    setCurrentTitle(scheduleTitle);
  }, [scheduleTitle]);


  const handleSavePlayers = (newNames: string[]) => {
    // If player count is different, we must regenerate the schedule.
    // The new names are applied, and we start fresh.
    if (newNames.length !== playerNames.length) {
        setPlayerNames(newNames);
        setView('schedule');
        runScheduleGeneration(newNames);
        return; // End of operation
    }

    // If player count is the same, we check for name changes and patch the existing schedule.
    const oldNames = playerNames;
    const nameMap: { [key: string]: string } = {};
    let namesHaveChanged = false;
    oldNames.forEach((oldName, index) => {
        if (newNames[index] && oldName !== newNames[index]) {
            nameMap[oldName] = newNames[index];
            namesHaveChanged = true;
        }
    });

    if (namesHaveChanged) {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;

            const newSchedule: TournamentSchedule = JSON.parse(JSON.stringify(prevSchedule));

            newSchedule.forEach((day: Day) => {
                if (day.winner && nameMap[day.winner]) {
                    day.winner = nameMap[day.winner];
                }
                day.rounds.forEach((round: Round) => {
                    round.matchups.forEach((matchup: Matchup) => {
                        if (matchup.players?.[0] && nameMap[matchup.players[0]]) {
                            matchup.players[0] = nameMap[matchup.players[0]];
                        }
                        if (matchup.players?.[1] && nameMap[matchup.players[1]]) {
                            matchup.players[1] = nameMap[matchup.players[1]];
                        }
                    });
                });
            });
            return newSchedule;
        });
    }

    // Always update player names state and switch view
    setPlayerNames(newNames);
    setView('schedule');
  };

  const handleScoreChange = (dayIndex: number, roundIndex: number, matchupIndex: number, playerIndex: 0 | 1, score: string) => {
    const newScore = score === '' ? null : parseInt(score, 10);

    // Prevent non-numeric or negative values from being set
    if (score !== '' && (isNaN(newScore!) || newScore! < 0)) {
      return;
    }

    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      
      // Create a deep copy to avoid direct state mutation.
      const newSchedule = JSON.parse(JSON.stringify(prevSchedule)); 
      
      newSchedule[dayIndex]
        .rounds[roundIndex]
        .matchups[matchupIndex]
        .scores[playerIndex] = newScore;
          
      return newSchedule;
    });
  };

  const handleWinnerChange = (dayIndex: number, winnerName: string) => {
    setSchedule(prevSchedule => {
        if (!prevSchedule) return null;
        
        const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
        
        const trimmedName = winnerName.trim();
        newSchedule[dayIndex].winner = trimmedName === '' ? null : trimmedName;
        
        return newSchedule;
    });
  };

  const handleDateChange = (dayIndex: number, newDate: string) => {
    setSchedule(prevSchedule => {
        if (!prevSchedule) return null;
        
        const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
        
        const trimmedDate = newDate.trim();
        newSchedule[dayIndex].date = trimmedDate === '' ? null : trimmedDate;
        
        return newSchedule;
    });
  };

  const handleSubstitutePlayer = (dayIndex: number, originalPlayer: string, substitutePlayer: string) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
      const day = newSchedule[dayIndex];
      
      // Add the substitution record
      day.substitutions = day.substitutions || {};
      day.substitutions[originalPlayer] = substitutePlayer;

      // Nullify scores for the original player for that day
      day.rounds.forEach((round: Round) => {
        round.matchups.forEach((matchup: Matchup) => {
          if (matchup.players[0] === originalPlayer) {
            matchup.scores[0] = null;
          }
          if (matchup.players[1] === originalPlayer) {
            matchup.scores[1] = null;
          }
        });
      });

      return newSchedule;
    });
  };

  const handleMatchupPlayersChange = (
    dayIndex: number,
    roundIndex: number,
    matchupIndex: number,
    newPlayers: [string, string]
  ) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      
      const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
      const matchup = newSchedule[dayIndex]
        .rounds[roundIndex]
        .matchups[matchupIndex];

      matchup.players = newPlayers;
      matchup.scores = [null, null]; // Reset scores when players change
          
      return newSchedule;
    });
  };

  const handleToggleDayLock = (dayIndex: number) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
      const day = newSchedule[dayIndex];
      day.isLocked = !day.isLocked;
      return newSchedule;
    });
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  };

  const handleTitleSave = () => {
    if (currentTitle.trim() === '') {
        setCurrentTitle(scheduleTitle); 
    } else {
        setScheduleTitle(currentTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setCurrentTitle(scheduleTitle);
      setIsEditingTitle(false);
    }
  };

  const handleShuffleRound = (dayIndex: number, roundIndex: number) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;

      const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
      const roundToShuffle = newSchedule[dayIndex]?.rounds[roundIndex];

      if (roundToShuffle) {
        // Fisher-Yates shuffle algorithm
        const matchups = roundToShuffle.matchups;
        for (let i = matchups.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [matchups[i], matchups[j]] = [matchups[j], matchups[i]];
        }
      }
      
      return newSchedule;
    });
  };

  const playerStats = useMemo<PlayerStats[]>(() => {
    if (!schedule) return [];

    const statsMap: { [key: string]: { totalPoints: number; totalWins: number } } = {};
    playerNames.forEach(name => {
      statsMap[name] = { totalPoints: 0, totalWins: 0 };
    });

    schedule.forEach(day => {
      const subsForDay = day.substitutions || {};
      const substitutedPlayers = new Set(Object.keys(subsForDay));

      day.rounds.forEach(round => {
        round.matchups.forEach(matchup => {
          const [player1, player2] = matchup.players;
          const [score1, score2] = matchup.scores;

          // Only count points if the player is in the main list AND not substituted for the day
          if (score1 !== null && statsMap[player1] && !substitutedPlayers.has(player1)) {
            statsMap[player1].totalPoints += score1;
            if (score1 >= 10) {
              statsMap[player1].totalWins += 1;
            }
          }

          if (score2 !== null && statsMap[player2] && !substitutedPlayers.has(player2)) {
            statsMap[player2].totalPoints += score2;
            if (score2 >= 10) {
              statsMap[player2].totalWins += 1;
            }
          }
        });
      });
    });

    return Object.entries(statsMap).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [schedule, playerNames]);

  const handleResetTournamentClick = () => {
    setIsSettingsMenuOpen(false);
    setIsResetConfirmOpen(true);
  };
  
  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    
    const defaultPlayerNames = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`);

    // This is the critical fix: By setting schedule to null at the same time as
    // playerNames, we prevent an inconsistent state where the statistics `useMemo`
    // would try to calculate stats using the OLD schedule but the NEW player names,
    // causing a silent render crash.
    setPlayerNames(defaultPlayerNames);
    setScheduleTitle('Tournament Schedule');
    setSchedule(null); // This prevents the render error.
    
    // Now that the state is clean, generate the new schedule.
    // The runScheduleGeneration function will set isLoading to true.
    runScheduleGeneration(defaultPlayerNames);
  };


  const handleEditPlayersClick = () => {
    setIsSettingsMenuOpen(false);
    setView('editPlayers');
  };

  const handleEndAndSaveTournament = () => {
    if (!schedule || !scheduleTitle) {
      alert("There is no tournament data to save.");
      return;
    }
    setIsSettingsMenuOpen(false);
    setIsEndConfirmOpen(true);
  };

  const handleConfirmEndAndSave = () => {
    setIsEndConfirmOpen(false);
    if (!schedule || !scheduleTitle) {
        return;
    }
    try {
      const newSavedTournament: SavedTournament = {
        id: Date.now().toString(),
        title: scheduleTitle.trim(),
        savedDate: new Date().toLocaleDateString(),
        stats: playerStats,
      };

      const saved = localStorage.getItem('pastTournaments');
      let currentTournaments: SavedTournament[] = [];
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                  currentTournaments = parsed;
              }
          } catch {
              currentTournaments = [];
          }
      }

      const updatedPastTournaments = [...currentTournaments, newSavedTournament];
      
      localStorage.setItem('pastTournaments', JSON.stringify(updatedPastTournaments));
      
      setPastTournaments(updatedPastTournaments);
      setScheduleTitle('Tournament Schedule');
      runScheduleGeneration(playerNames);
      setView('schedule');
    } catch (error) {
        console.error("Failed to save tournament:", error);
        alert("Error: Could not save the tournament. Your browser's local storage might be full or disabled.");
    }
  };
    
  const handleDeleteTournament = (tournamentId: string) => {
    const updatedTournaments = pastTournaments.filter(t => t.id !== tournamentId);
    try {
      localStorage.setItem('pastTournaments', JSON.stringify(updatedTournaments));
      setPastTournaments(updatedTournaments);
    } catch (error) {
      console.error("Failed to delete tournament from storage:", error);
      alert("Error: Could not delete the tournament. Your browser's local storage might be full or disabled.");
    }
  };


  return (
    <>
      <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-orange-400">
              Chic Regal Pool Tournament
            </h1>
          </header>

          <main>
            {view === 'editPlayers' ? (
              <PlayerEditor 
                initialNames={playerNames}
                onSave={handleSavePlayers}
              />
            ) : view === 'statistics' ? (
              <StatisticsDisplay 
                stats={playerStats}
                onBack={() => setView('schedule')}
              />
            ) : view === 'pastTournaments' ? (
              <PastTournamentsDisplay
                  tournaments={pastTournaments}
                  onBack={() => setView('schedule')}
                  onDelete={handleDeleteTournament}
              />
            ) : view === 'cumulativePoints' ? (
              <CumulativePointsDisplay
                playerNames={playerNames}
                schedule={schedule!}
                onBack={() => setView('schedule')}
              />
            ) : (
              <>
                {isEditingTitle ? (
                  <input
                      type="text"
                      value={currentTitle}
                      onChange={handleTitleChange}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="w-full bg-gray-800 text-3xl font-bold text-center text-slate-100 mb-8 p-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      autoFocus
                  />
                ) : (
                  <div 
                      className="group relative flex justify-center items-center gap-2 mb-8 cursor-pointer"
                      onClick={handleTitleClick}
                      title="Click to rename schedule"
                  >
                      <h2 className="text-3xl font-bold text-slate-100 p-2 rounded-md group-hover:bg-gray-900/50 transition-colors duration-200">
                          {scheduleTitle}
                      </h2>
                      <PencilIcon className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                )}

                <div className="relative z-10 bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => setView('cumulativePoints')}
                        disabled={isLoading || !schedule}
                        className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors duration-300"
                      >
                        Cumulative Points
                      </button>
                    <button
                      onClick={() => setView('statistics')}
                      disabled={isLoading || !schedule}
                      className="w-full sm:w-auto bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:opacity-50 transition-colors duration-300"
                    >
                      Leaderboards
                    </button>
                    <button
                      onClick={() => setView('pastTournaments')}
                      disabled={isLoading}
                      className="w-full sm:w-auto bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition-colors duration-300"
                    >
                      Past Tournaments
                    </button>
                    <div className="relative w-full sm:w-auto">
                      <button
                        onClick={() => setIsSettingsMenuOpen(prev => !prev)}
                        disabled={isLoading}
                        className="w-full bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors duration-300 flex items-center justify-center gap-2"
                        aria-haspopup="true"
                        aria-expanded={isSettingsMenuOpen}
                      >
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                      </button>
                      {isSettingsMenuOpen && (
                        <div
                          ref={settingsMenuRef}
                          className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-700"
                          role="menu"
                          aria-orientation="vertical"
                        >
                          <div className="py-1" role="none">
                            <button
                              onClick={handleEditPlayersClick}
                              className="text-slate-200 block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors duration-150"
                              role="menuitem"
                            >
                              Edit Players
                            </button>
                            <button
                              onClick={handleEndAndSaveTournament}
                              disabled={!schedule}
                              className="text-teal-400 block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150"
                              role="menuitem"
                            >
                              End and Save Tournament
                            </button>
                            <div className="border-t border-gray-700 my-1" role="separator"></div>
                            <button
                              onClick={handleResetTournamentClick}
                              disabled={!schedule || isLoading}
                              className="text-red-400 block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-150"
                              role="menuitem"
                            >
                              Reset Tournament
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg">
                      <LoadingSpinnerIcon />
                      <p className="mt-4 text-orange-300 text-lg">Generating your schedule...</p>
                      <p className="text-slate-400 text-sm">This may take a moment.</p>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center justify-center p-6 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                      <ErrorIcon />
                      <span className="ml-3 font-medium">{error}</span>
                    </div>
                  )}
                  {schedule && !isLoading && (
                    <ScheduleDisplay 
                      schedule={schedule}
                      playerNames={playerNames}
                      onScoreChange={handleScoreChange}
                      onWinnerChange={handleWinnerChange}
                      onDateChange={handleDateChange}
                      onShuffleRound={handleShuffleRound}
                      onSubstitutePlayer={handleSubstitutePlayer}
                      onMatchupPlayersChange={handleMatchupPlayersChange}
                      onToggleDayLock={handleToggleDayLock}
                    />
                  )}
                </div>
              </>
            )}
          </main>
          <footer className="text-center mt-12 text-slate-500 text-sm">
              <p>Powered by Google Gemini API. UI crafted with Tailwind CSS and React.</p>
          </footer>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
        title="Reset Tournament?"
        message="This will clear all scores, dates, and custom names, then generate a completely new schedule. This action cannot be undone."
      />
      <ConfirmationDialog
        isOpen={isEndConfirmOpen}
        onConfirm={handleConfirmEndAndSave}
        onCancel={() => setIsEndConfirmOpen(false)}
        title={`End and Save "${scheduleTitle}"?`}
        message="This will archive the current stats and start a new tournament with the same players."
      />
    </>
  );
};

export default App;