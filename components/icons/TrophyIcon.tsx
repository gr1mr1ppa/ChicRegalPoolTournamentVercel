import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={className || "w-5 h-5"}
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            d="M15.5 3A2.5 2.5 0 0013 5.5V6h-6V5.5A2.5 2.5 0 007 3c-1.38 0-2.5 1.12-2.5 2.5V10c0 .17.02.34.05.5H3a1 1 0 00-1 1v1a1 1 0 001 1h.05a4.5 4.5 0 004.45 4.95A4.5 4.5 0 0012.5 18a4.5 4.5 0 004.45-3.05H17a1 1 0 001-1v-1a1 1 0 00-1-1h-1.55a4.42 4.42 0 00.05-.5V5.5C18 4.12 16.88 3 15.5 3zM10 16a2.5 2.5 0 01-2.45-2.95A2.5 2.5 0 0110 10.5a2.5 2.5 0 012.45 2.55A2.5 2.5 0 0110 16z"
            clipRule="evenodd"
        />
    </svg>
);