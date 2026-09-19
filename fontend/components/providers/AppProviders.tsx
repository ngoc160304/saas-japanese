'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from './QueryProvider';
import { ReduxProvider } from './ReduxProvider';
import { AuthBootstrap } from './AuthBootstrap';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthBootstrap />
        {children}
        <Toaster />
      </QueryProvider>
    </ReduxProvider>
  );
}
