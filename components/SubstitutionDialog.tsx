import React, { useState, useEffect, useRef } from 'react';

interface SubstitutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (originalPlayer: string, substitutePlayer: string) => void;
  players: string[];
}

const SubstitutionDialog: React.FC<SubstitutionDialogProps> = ({ isOpen, onClose, onSave, players }) => {
  const [originalPlayer, setOriginalPlayer] = useState<string>('');
  const [substitutePlayer, setSubstitutePlayer] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setOriginalPlayer(players[0] || '');
      setSubstitutePlayer('');
      dialogRef.current?.focus();
    }
  }, [isOpen, players]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (originalPlayer && substitutePlayer.trim()) {
      onSave(originalPlayer, substitutePlayer.trim());
      onClose();
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md m-4"
        tabIndex={-1}
      >
        <h2 id="dialog-title" className="text-2xl font-bold text-orange-400 mb-6">Substitute Player</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="original-player" className="block mb-2 font-semibold text-slate-300 text-sm">
              Player to Substitute
            </label>
            <select
              id="original-player"
              value={originalPlayer}
              onChange={(e) => setOriginalPlayer(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-orange-500"
            >
              {players.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="substitute-player" className="block mb-2 font-semibold text-slate-300 text-sm">
              Substitute's Name
            </label>
            <input
              type="text"
              id="substitute-player"
              value={substitutePlayer}
              onChange={(e) => setSubstitutePlayer(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-700 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-orange-500"
              placeholder="Enter name"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!originalPlayer || !substitutePlayer.trim()}
            className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Substitute
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionDialog;
