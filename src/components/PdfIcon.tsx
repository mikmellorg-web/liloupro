import React from 'react';

interface PdfIconProps {
  size?: number | string;
  className?: string;
}

/**
 * Ícone padronizado estilo PDF / Adobe com folha branca de alto contraste e faixa vermelha "PDF"
 */
export function PdfIcon({ size, className = 'w-5 h-5' }: PdfIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      {...(size !== undefined ? { width: size, height: size } : {})}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M6 2h9l5 5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 21V3.5A1.5 1.5 0 0 1 6 2z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="0.9"
      />
      <path d="M15 2v4a1 1 0 0 0 1 1h4L15 2z" fill="#FCA5A5" />
      <path d="M7.5 7.6h5M7.5 9.8h9" stroke="#CBD5E1" strokeWidth="1.15" strokeLinecap="round" />
      <rect
        x="1.5"
        y="11.5"
        width="17.5"
        height="8"
        rx="2"
        fill="#DC2626"
        stroke="#FFFFFF"
        strokeWidth="0.5"
      />
      <text
        x="10.25"
        y="17.7"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="6.4"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.3"
      >
        PDF
      </text>
    </svg>
  );
}
