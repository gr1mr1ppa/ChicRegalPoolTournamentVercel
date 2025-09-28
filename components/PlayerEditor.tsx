import React, { useState, useEffect } from 'react';
import { PencilIcon } from './icons/PencilIcon';
import ConfirmationDialog from './ConfirmationDialog';

interface PlayerEditorProps {
  initialNames: string[];
  onSave: (newNames: string[]) => void;
}

const PlayerEditor: React.FC<PlayerEditorProps> = ({ initialNames, onSave }) => {
  const [names, setNames] = useState<string[]>(initialNames);
  const [playerCount, setPlayerCount] = useState<number>(initialNames.length);
  const [isEditingPlayerCount, setIsEditingPlayerCount] = useState<boolean>(false);
  const [stagedPlayerCount, setStagedPlayerCount] = useState<number>(playerCount);
  const [isConfirmCountChangeOpen, setIsConfirmCountChangeOpen] = useState<boolean>(false);

  // This effect synchronizes the `names` array with `playerCount`.
  // It uses the functional form of `setNames` to avoid needing `names`
  // in the dependency array, which would cause an infinite loop.
  useEffect(() => {
    setNames(currentNames => {
      const currentLength = currentNames.length;
      if (playerCount > currentLength) {
        // Add new default player names
        const newPlayers = Array.from({ length: playerCount - currentLength }, (_, i) => `Player ${currentLength + i + 1}`);
        return [...currentNames, ...newPlayers];
      } else if (playerCount < currentLength) {
        // Remove players from the end
        return currentNames.slice(0, playerCount);
      }
      // No change needed
      return currentNames;
    });
  }, [playerCount]);

  const handleNameChange = (index: number, newName: string) => {
    const updatedNames = [...names];
    updatedNames[index] = newName;
    setNames(updatedNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before saving
    if (![8, 10, 12].includes(playerCount)) {
      alert("Number of players must be 8, 10, or 12.");
      return;
    }

    const cleanedNames = names.map(name => name.trim()).filter(name => name.length > 0);
    if (cleanedNames.length !== playerCount) {
      alert(`Please ensure all ${playerCount} player names are filled out.`);
      return;
    }
    onSave(cleanedNames);
  };

  const handleEditPlayerCount = () => {
    setStagedPlayerCount(playerCount); // Initialize staged count when editing starts
    setIsEditingPlayerCount(true);
  };

  const handleCancelEditPlayerCount = () => {
    setIsEditingPlayerCount(false);
  };

  const handleSavePlayerCount = () => {
    // Only open confirm dialog if the count has actually changed
    if (stagedPlayerCount !== playerCount) {
      setIsConfirmCountChangeOpen(true);
    } else {
      // If no change, just exit edit mode
      setIsEditingPlayerCount(false);
    }
  };

  const handleConfirmPlayerCountChange = () => {
    setPlayerCount(stagedPlayerCount);
    setIsEditingPlayerCount(false);
    setIsConfirmCountChangeOpen(false);
  };

  const PLAYER_COUNT_OPTIONS = [8, 10, 12];

  return (
    <>
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center">Edit Players</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-slate-300 text-sm">
              Number of Players
            </label>
            {isEditingPlayerCount ? (
              <div className="p-2 rounded-lg bg-gray-950/50 border border-gray-700">
                <div className="flex gap-2">
                  {PLAYER_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button" // Prevent form submission
                      onClick={() => setStagedPlayerCount(count)}
                      className={`flex-1 font-bold py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        stagedPlayerCount === count
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-transparent text-slate-300 hover:bg-gray-800 focus:ring-orange-500'
                      }`}
                    >
                      {count} Players
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        type="button"
                        onClick={handleCancelEditPlayerCount}
                        className="flex-1 bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSavePlayerCount}
                        disabled={stagedPlayerCount === playerCount}
                        className="flex-1 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Selection
                    </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-1 rounded-lg bg-gray-950/50 border border-gray-700">
                <span className="flex-grow font-bold text-slate-100 text-center py-2 px-4">{playerCount} Players</span>
                <button
                  type="button"
                  onClick={handleEditPlayerCount}
                  className="flex items-center gap-2 bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500"
                  aria-label="Change number of players"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-700"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {names.map((name, index) => (
              <div key={index}>
                <label htmlFor={`player-${index}`} className="block mb-1 font-semibold text-slate-300 text-sm">
                  Player {index + 1}
                </label>
                <input
                  type="text"
                  id={`player-${index}`}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                  required
                />
              </div>
            ))}
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-900/50"
            >
              Save & Return
            </button>
          </div>
        </form>
      </div>
      <ConfirmationDialog
        isOpen={isConfirmCountChangeOpen}
        onConfirm={handleConfirmPlayerCountChange}
        onCancel={() => setIsConfirmCountChangeOpen(false)}
        title="Change Player Count?"
        message="Changing the number of players will reset the current tournament schedule and clear all entered scores. Are you sure you want to continue?"
      />
    </>
  );
};

export default PlayerEditor;