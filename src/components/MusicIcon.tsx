import React from 'react';

export interface Music2Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function Music2({ className, size, ...props }: Music2Props) {
  const s = size || "24";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Cabeça da nota (bolinha) totalmente preenchida/pintada */}
      <ellipse 
        cx="8.5" 
        cy="17" 
        rx="3.5" 
        ry="2.5" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeWidth="1" 
      />
      {/* Haste (Stem) da nota ligada ao lado direito da elipse */}
      <path d="M12 17V4" fill="none" />
      {/* Bandeira (Flag) única e elegante da colcheia */}
      <path d="M12 4c3.5 0 6 2 6 5.5s-2.5 4.5 -6 4.5" fill="none" />
    </svg>
  );
}
