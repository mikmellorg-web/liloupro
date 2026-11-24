import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface PredefinedServiceTheme {
  name: string;
  icon: string;
}

interface ServiceThemeDropdownProps {
  predefinedThemes: Record<string, PredefinedServiceTheme>;
  customThemes: string[];
  value: string;
  isCustomMode: boolean;
  customText: string;
  onSelectTheme: (themeValue: string) => void;
  onEnterCustomMode: () => void;
  onCustomTextChange: (text: string) => void;
  onDeleteCustomTheme?: (themeName: string) => void;
}

export const ServiceThemeDropdown: React.FC<ServiceThemeDropdownProps> = ({
  predefinedThemes,
  customThemes,
  value,
  isCustomMode,
  customText,
  onSelectTheme,
  onEnterCustomMode,
  onCustomTextChange,
  onDeleteCustomTheme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Fecha o menu ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Foco automático no input ao selecionar "Outro / Personalizado..."
  useEffect(() => {
    if (isCustomMode) {
      const timer = window.setTimeout(() => {
        customInputRef.current?.focus();
      }, 20);
      return () => window.clearTimeout(timer);
    }
  }, [isCustomMode]);

  const currentPredefined = predefinedThemes[value || 'normal'];
  const triggerIcon = isCustomMode
    ? '✏️'
    : currentPredefined
      ? currentPredefined.icon
      : '📌';
  const triggerLabel = isCustomMode
    ? (customText.trim() || 'Outro / Personalizado...')
    : currentPredefined
      ? currentPredefined.name
      : (value || 'Geral / Padrão');

  return (
    <div ref={containerRef} className="relative space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-xl h-10 sm:h-12 px-3 text-xs font-bold text-text-main hover:bg-black/10 dark:hover:bg-slate-800 transition-all outline-none cursor-pointer flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <span className="shrink-0 text-sm leading-none">{triggerIcon}</span>
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(2.5rem+0.35rem)] sm:top-[calc(3rem+0.35rem)] z-[140] bg-surface dark:bg-slate-900 border border-border rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto py-1.5 custom-scrollbar">
            {/* Opções pré-definidas */}
            {Object.entries(predefinedThemes).map(([key, t]) => {
              const isSelected = !isCustomMode && (value || 'normal') === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectTheme(key);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-xs font-bold flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-brand/15 text-brand dark:text-white'
                      : 'text-text-main hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    <span className="shrink-0 text-sm leading-none">{t.icon}</span>
                    <span className="truncate">{t.name}</span>
                  </span>
                  {isSelected && <Check size={14} className="shrink-0 text-brand" />}
                </button>
              );
            })}

            {/* Seção: Temas da Igreja (salvos no Firestore) */}
            {customThemes.length > 0 && (
              <>
                <div className="my-1.5 border-t border-border/70" />
                <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Temas da Igreja
                </div>
                {customThemes.map((customName) => {
                  const isSelected = !isCustomMode && value === customName;
                  return (
                    <div
                      key={customName}
                      className={`group flex items-center justify-between gap-1 px-3 py-2 text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-brand/15 text-brand dark:text-white'
                          : 'text-text-main hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectTheme(customName);
                          setIsOpen(false);
                        }}
                        className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer py-0.5"
                      >
                        <span className="shrink-0 text-sm leading-none">📌</span>
                        <span className="truncate">{customName}</span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && <Check size={14} className="text-brand" />}
                        {onDeleteCustomTheme && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomTheme(customName);
                            }}
                            title={`Remover "${customName}" dos temas salvos`}
                            aria-label={`Remover tema ${customName}`}
                            className="p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Opção de digitar tema personalizado */}
            <div className="my-1.5 border-t border-border/70" />
            <button
              type="button"
              role="option"
              aria-selected={isCustomMode}
              onClick={() => {
                onEnterCustomMode();
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-xs font-black flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                isCustomMode
                  ? 'bg-brand/15 text-brand dark:text-cyan-300'
                  : 'text-brand dark:text-cyan-300 hover:bg-brand/10'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0 truncate">
                <span className="shrink-0 text-sm leading-none">✏️</span>
                <span className="truncate">Outro / Personalizado...</span>
              </span>
              {isCustomMode && <Check size={14} className="shrink-0" />}
            </button>
          </div>
        </div>
      )}

      {isCustomMode && (
        <input
          ref={customInputRef}
          type="text"
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder="Digite o tema ou ocasião do culto..."
          maxLength={80}
          className="w-full bg-black/5 dark:bg-white/5 border border-brand/50 rounded-xl h-10 sm:h-12 px-3 text-xs font-bold text-text-main placeholder:text-text-muted/70 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
        />
      )}
    </div>
  );
};
