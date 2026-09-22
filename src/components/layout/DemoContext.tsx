import { createContext, useContext } from 'react';

export interface DemoState {
  active: boolean;
  step: number;
}

export const DemoContext = createContext<{
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  runDemo: () => void;
  demoStep: number;
  setDemoStep: (n: number) => void;
} | null>(null);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
