'use client';

import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';

export function ReduxProvider({ children }: { children: ReactNode }) {
  const [{ store, serverState }] = useState(() => {
    const store = makeStore();
    return { store, serverState: store.getState() };
  });
  // Suspense children can hydrate after bootstrap already changed the live store.
  return (
    <Provider store={store} serverState={serverState}>
      {children}
    </Provider>
  );
}
