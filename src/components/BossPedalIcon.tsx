import React from 'react';

export interface BossPedalIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
}

export function BossPedalIcon({ className, size = 24, style, ...props }: BossPedalIconProps) {
  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 20;

  // Proporções físicas realistas de um pedal compacto Boss (aprox. 1 : 1.45 de largura por altura)
  const width = Math.max(14, Math.round(numSize * 0.95));
  const height = Math.max(20, Math.round(numSize * 1.45));

  // SVG Data URI de um pedal Boss real com chassis metálico azul (estilo BD-2), knobs, LED vermelho, logo BOSS e borracha preta
  const bossPedalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 145" width="100%" height="100%">
  <defs>
    <linearGradient id="bossPaint" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a63ad" />
      <stop offset="50%" stop-color="#1e4d8b" />
      <stop offset="100%" stop-color="#11305a" />
    </linearGradient>
    <linearGradient id="treadleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2c2c2c" />
      <stop offset="100%" stop-color="#141414" />
    </linearGradient>
    <linearGradient id="knobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3a3a3a" />
      <stop offset="100%" stop-color="#111111" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Chassis Principal com borda metálica 3D -->
  <rect x="2" y="2" width="96" height="141" rx="8" ry="8" fill="url(#bossPaint)" stroke="#8899aa" stroke-width="2.5" />
  
  <!-- Sombra interna e chanfro superior (Bevel) -->
  <path d="M 10 4 L 90 4 C 94 4 96 6 96 10 L 96 20 L 4 20 L 4 10 C 4 6 6 4 10 4 Z" fill="#ffffff" opacity="0.15" />

  <!-- Parafuso superior e detalhes -->
  <circle cx="15" cy="11" r="2.5" fill="#a0aab5" />
  <circle cx="85" cy="11" r="2.5" fill="#a0aab5" />

  <!-- LED Indicador de Check (Vermelho aceso) -->
  <circle cx="50" cy="16" r="5.5" fill="#ff1818" stroke="#550000" stroke-width="1.5" />
  <circle cx="48.5" cy="14.5" r="2" fill="#ffffff" opacity="0.85" />

  <!-- 3 Knobs de Controle (Level, Tone, Gain/Mode) -->
  <g filter="url(#shadow)">
    <circle cx="23" cy="33" r="9" fill="url(#knobGrad)" stroke="#000000" stroke-width="1.5" />
    <line x1="23" y1="33" x2="23" y2="25" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

    <circle cx="50" cy="33" r="9" fill="url(#knobGrad)" stroke="#000000" stroke-width="1.5" />
    <line x1="50" y1="33" x2="55" y2="28" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

    <circle cx="77" cy="33" r="9" fill="url(#knobGrad)" stroke="#000000" stroke-width="1.5" />
    <line x1="77" y1="33" x2="72" y2="27" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- Placa com Logotipo BOSS -->
  <rect x="18" y="48" width="64" height="14" rx="2.5" fill="#111111" stroke="#222222" stroke-width="1" />
  <text x="50" y="58.5" font-family="Arial, sans-serif" font-weight="900" font-size="10.5" fill="#f5d700" text-anchor="middle" letter-spacing="2.5">BOSS</text>

  <!-- Eixo / Dobradiça metálica prateada -->
  <rect x="10" y="66" width="80" height="4" rx="2" fill="#cbd5e1" stroke="#64748b" stroke-width="1" />

  <!-- Placa do Pedal de Pisar (Treadle em borracha preta) -->
  <rect x="11" y="73" width="78" height="64" rx="5" fill="url(#treadleGrad)" stroke="#0a0a0a" stroke-width="2" />
  
  <!-- Ranhuras antiderrapantes em relevo da borracha -->
  <line x1="22" y1="86" x2="78" y2="86" stroke="#383838" stroke-width="3" stroke-linecap="round" />
  <line x1="22" y1="96" x2="78" y2="96" stroke="#383838" stroke-width="3" stroke-linecap="round" />
  <line x1="22" y1="106" x2="78" y2="106" stroke="#383838" stroke-width="3" stroke-linecap="round" />
  <line x1="22" y1="116" x2="78" y2="116" stroke="#383838" stroke-width="3" stroke-linecap="round" />

  <!-- Parafuso de fixação prateado na parte inferior do pedal -->
  <circle cx="50" cy="128" r="5.5" fill="#cbd5e1" stroke="#475569" stroke-width="1.5" />
  <line x1="46.5" y1="128" x2="53.5" y2="128" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
</svg>`;

  const backgroundSvgUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(bossPedalSvg)}")`;

  return (
    <span
      role="img"
      aria-label="Pedal Boss"
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: backgroundSvgUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        border: '1.5px solid rgba(220, 225, 235, 0.75)',
        borderRadius: '5px',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.75), 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.65), inset 0 -2px 4px rgba(0, 0, 0, 0.85)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {/* Camada de brilho/reflexo metálico para reforçar o realismo físico 3D */}
      <span
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[3px]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.3) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
        }}
      />
    </span>
  );
}

