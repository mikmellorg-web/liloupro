import React from 'react';
import { BibleSearch } from './BibleSearch';

export function QuickBibleSearch() {
  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h3 className="text-xs font-black text-text-main uppercase tracking-wider mb-2">Busca Rápida da Bíblia</h3>
      <BibleSearch />
    </div>
  );
}

export default QuickBibleSearch;
