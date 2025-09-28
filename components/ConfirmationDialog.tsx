import React, { useEffect, useRef } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      dialogRef.current?.focus(); // Focus the dialog for accessibility
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

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
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all"
            tabIndex={-1}
        >
            <h2 id="dialog-title" className="text-2xl font-bold text-orange-400 mb-4">{title}</h2>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="flex justify-end gap-4">
            <button
                onClick={onCancel}
                className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
            >
                Confirm
            </button>
            </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
