import React from 'react';

export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor" 
        className={className || "w-5 h-5"}
        aria-hidden="true"
    >
        <path d="M3.75 3A1.75 1.75 0 002 4.75v10.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25V4.75A1.75 1.75 0 0016.25 3H3.75zM9.5 4.5a.5.5 0 01.5.5v2.5a.5.5 0 01-1 0V5a.5.5 0 01.5-.5z" />
        <path d="M6 11.25a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" />
    </svg>
);
