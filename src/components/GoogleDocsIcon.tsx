import React from 'react';

interface GoogleDocsIconProps {
  size?: number | string;
  className?: string;
}

/**
 * Ícone oficial do Google Docs (Documentos Google)
 */
export function GoogleDocsIcon({ size = 16, className = '' }: GoogleDocsIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={`shrink-0 ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Google Docs"
    >
      {/* Corpo da página do documento azul */}
      <path 
        d="M14.5 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7.5L14.5 2Z" 
        fill="#4285F4" 
      />
      {/* Canto dobrado azul claro */}
      <path 
        d="M14 2V6.5C14 7.32843 14.6716 8 15.5 8H20L14 2Z" 
        fill="#A1C2FA" 
      />
      {/* Linhas de texto representativas */}
      <rect x="7" y="11" width="10" height="1.6" rx="0.8" fill="white" />
      <rect x="7" y="14" width="10" height="1.6" rx="0.8" fill="white" />
      <rect x="7" y="17" width="6.5" height="1.6" rx="0.8" fill="white" />
    </svg>
  );
}
