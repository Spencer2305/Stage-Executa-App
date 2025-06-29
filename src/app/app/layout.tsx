import { ReactNode } from 'react';

interface ExecutaAppLayoutProps {
  children: ReactNode;
}

export default function ExecutaAppLayout({ children }: ExecutaAppLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 