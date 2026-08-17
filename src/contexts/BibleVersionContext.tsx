import React, { createContext, useContext } from 'react';

export const BibleVersionContext = createContext<{
  forcedVersion: string;
}>({
  forcedVersion: 'NAA'
});

export function useBibleVersion() {
  return useContext(BibleVersionContext);
}

export function BibleVersionProvider({ children }: { children: React.ReactNode }) {
  return (
    <BibleVersionContext.Provider value={{ forcedVersion: 'NAA' }}>
      {children}
    </BibleVersionContext.Provider>
  );
}
