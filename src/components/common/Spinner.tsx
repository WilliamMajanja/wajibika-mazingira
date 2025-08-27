import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', colorClass?: string }> = ({ size = 'md', colorClass = 'border-white' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 ${colorClass}`}
      ></div>
    </div>
  );
};