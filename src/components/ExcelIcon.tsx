import React from 'react';

interface ExcelIconProps {
  size?: number | string;
  className?: string;
}

/**
 * Ícone padronizado estilo Microsoft Excel com folha branca, linhas de planilha e distintivo verde "X"
 */
export function ExcelIcon({ size, className = 'w-5 h-5' }: ExcelIconProps) {
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
      <path d="M15 2v4a1 1 0 0 0 1 1h4L15 2z" fill="#86EFAC" />
      <path
        d="M13 10h4.8M13 13h4.8M13 16h4.8M15.4 8.5v9"
        stroke="#86EFAC"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <rect
        x="1.5"
        y="7"
        width="11.5"
        height="10"
        rx="2"
        fill="#1D6F42"
        stroke="#FFFFFF"
        strokeWidth="0.55"
      />
      <path
        d="M4.9 9.5L9.6 14.5M9.6 9.5L4.9 14.5"
        stroke="#FFFFFF"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
