import React from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineView(props: any) {
  return (
    <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
        <WifiOff size={32} />
      </div>
      <h2 className="text-xl font-black text-text-main">Modo Offline</h2>
      <p className="text-xs text-text-muted">Acesse suas músicas e cifras salvas em cache local sem conexão com a internet.</p>
    </div>
  );
}

export default OfflineView;
