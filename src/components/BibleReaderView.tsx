import React from 'react';
import { BibleSearch } from './BibleSearch';

export default function BibleReaderView({ theme, services }: { theme?: string; services?: any[] }) {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-black text-text-main mb-4">Leitor e Busca Bíblica</h2>
        <BibleSearch />
      </div>
    </div>
  );
}
