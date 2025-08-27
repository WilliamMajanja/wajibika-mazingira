import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', colorClass?: string }> = ({ size = 'md', colorClass = 'border-white' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-t-2 border-b-2',
    md: 'h-6 w-6 border-t-2 border-b-2',
    lg: 'h-8 w-8 border-t-4 border-b-4',
  };

  // Uses a dynamic "two-arc" spinner effect, similar to the one on the initial app load screen.
  // The provided colorClass will color the top and bottom arcs.
  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full ${colorClass}`}
      ></div>
    </div>
  );
};
