import React, { useState } from 'react';
import { SavedTournament } from '../types';
import Leaderboard from './Leaderboard';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import ConfirmationDialog from './ConfirmationDialog';

interface PastTournamentsDisplayProps {
  tournaments: SavedTournament[];
  onBack: () => void;
  onDelete: (tournamentId: string) => void;
}

const PastTournamentsDisplay: React.FC<PastTournamentsDisplayProps> = ({ tournaments, onBack, onDelete }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<{ id: string; title: string } | null>(null);

  // Sort tournaments by saved date, newest first
  const sortedTournaments = [...tournaments].sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

  const handleToggle = (id: string) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };

  const handleDeleteClick = (e: React.MouseEvent, tournament: { id: string; title: string }) => {
    e.stopPropagation(); // Prevent the accordion from toggling
    setTournamentToDelete(tournament);
    setIsDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (!tournamentToDelete) return;
    
    // If we are deleting the currently expanded item, collapse it.
    if (expandedId === tournamentToDelete.id) {
        setExpandedId(null);
    }
    onDelete(tournamentToDelete.id);
    
    // Reset state
    setIsDeleteConfirmOpen(false);
    setTournamentToDelete(null);
  };

  return (
    <>
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center">
          Past Tournaments
        </h2>
        {sortedTournaments.length === 0 ? (
          <p className="text-center text-slate-400">No past tournaments have been saved yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedTournaments.map(t => {
              const isExpanded = expandedId === t.id;
              const sortedByPoints = [...t.stats].sort((a, b) => b.totalPoints - a.totalPoints);
              const sortedByWins = [...t.stats].sort((a, b) => b.totalWins - a.totalWins);

              return (
                <div key={t.id} className="bg-gray-950/50 rounded-lg overflow-hidden border border-gray-800 transition-all duration-300">
                  <div className="flex items-center gap-2 p-2">
                    <button
                      onClick={() => handleToggle(t.id)}
                      className="flex flex-grow items-center justify-between text-left hover:bg-gray-800/80 transition-colors duration-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 w-full"
                      aria-expanded={isExpanded}
                      aria-controls={`tournament-details-${t.id}`}
                    >
                      <div>
                        <h3 className="font-bold text-lg text-slate-100">{t.title}</h3>
                        <p className="text-sm text-slate-400">Saved: {t.savedDate}</p>
                      </div>
                      <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, { id: t.id, title: t.title })}
                      className="flex-shrink-0 p-3 bg-red-900/50 text-red-300 rounded-md hover:bg-red-800/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete tournament ${t.title}`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Collapsible content */}
                  <div
                    id={`tournament-details-${t.id}`}
                    className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                        <div className="p-4 md:p-6 border-t border-gray-700/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Leaderboard title="Final Leaderboard (Points)" players={sortedByPoints} dataKey="totalPoints" unit="pts"/>
                            <Leaderboard title="Final Leaderboard (Wins)" players={sortedByWins} dataKey="totalWins" unit="wins" />
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <button
              onClick={onBack}
              className="bg-gray-800 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors duration-300"
            >
              Back to Current Schedule
            </button>
          </div>
      </div>
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        title="Delete Tournament?"
        message={`Are you sure you want to delete the tournament "${tournamentToDelete?.title}"? This action cannot be undone.`}
      />
    </>
  );
};

export default PastTournamentsDisplay;