import React from 'react';

export function ProjectorDisplay() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-lg">
        <h1 className="text-3xl font-black uppercase tracking-wider text-brand">Projetor Virtual</h1>
        <p className="text-sm text-zinc-400">Modo de exibição de projeção em tempo real para cultos e letras.</p>
      </div>
    </div>
  );
}

export default ProjectorDisplay;
