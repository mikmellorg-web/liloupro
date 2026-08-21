import React, { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ConfirmButton({ 
  onConfirm, 
  children, 
  className, 
  title,
  confirmText = "Tem certeza?"
}: { 
  onConfirm: () => void; 
  children: React.ReactNode; 
  className?: string; 
  title?: string;
  confirmText?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  
  useEffect(() => {
    if (confirming) {
      const t = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirming]);
  
  return (
    <button 
      type="button"
      onClick={(e) => { 
        e.stopPropagation(); 
        if (confirming) { 
          onConfirm(); 
          setConfirming(false); 
        } else {
          setConfirming(true);
        }
      }}
      title={title}
      className={cn(
        "transition-all duration-200 cursor-pointer",
        confirming 
          ? "bg-red-500 text-white scale-105 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg z-50 animate-pulse border-none ring-2 ring-white/20 whitespace-nowrap" 
          : className
      )}
    >
      {confirming ? confirmText : children}
    </button>
  );
}

export default ConfirmButton;
