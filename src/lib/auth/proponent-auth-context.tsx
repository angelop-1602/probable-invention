"use client";
import { createContext, useContext, ReactNode } from 'react';
import { useProponentAuth, UseProponentAuthResult } from '@/hooks/use-proponent-auth';

const ProponentAuthContext = createContext<UseProponentAuthResult | undefined>(undefined);

export function ProponentAuthProvider({ children }: { children: ReactNode }) {
  const auth = useProponentAuth();

  return (
    <ProponentAuthContext.Provider value={auth}>
      {children}
    </ProponentAuthContext.Provider>
  );
}

export function useProponentAuthContext() {
  const context = useContext(ProponentAuthContext);
  if (context === undefined) {
    throw new Error('useProponentAuthContext must be used within a ProponentAuthProvider');
  }
  return context;
} 