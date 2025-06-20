import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-2xl'
};

export function Avatar({ 
  src, 
  name, 
  email, 
  size = 'md', 
  className = '' 
}: AvatarProps) {
  const getInitials = () => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const baseClasses = `${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`;

  return (
    <div className={`${baseClasses} ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt="Profile avatar" 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-bold">
          {getInitials()}
        </span>
      )}
    </div>
  );
} 