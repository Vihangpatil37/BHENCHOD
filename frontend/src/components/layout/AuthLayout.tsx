import type { ReactNode } from 'react';
import { AmbientOrbs } from '../shared/AmbientOrbs';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <AmbientOrbs />
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};
