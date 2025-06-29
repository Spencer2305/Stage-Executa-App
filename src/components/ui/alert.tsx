'use client';

import { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export function Alert({ children, className = '', variant = 'default' }: AlertProps) {
  const variantClasses = {
    default: 'border-gray-200 bg-gray-50 text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900'
  };

  return (
    <div 
      role="alert"
      className={`
        relative w-full rounded-lg border p-4
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
      {children}
    </div>
  );
} 