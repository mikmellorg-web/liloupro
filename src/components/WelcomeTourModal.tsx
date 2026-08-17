import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Music, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Clock, 
  Compass, 
  HeartHandshake, 
  Eye, 
  Volume2,
  ArrowRight,
  ThumbsUp,
  BookmarkCheck
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export interface WelcomeTourModalProps {
  user: any;
  memberData: any;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'home' | 'songs' | 'calendar' | 'members' | 'liturgy' | 'availability' | 'settings' | 'admin' | 'projection' | 'chat' | 'theory' | 'bible' | 'offline' | 'master') => void;
}

export interface TourStep {
  id: string;
  tabTarget?: 'home' | 'songs' | 'calendar' | 'members' | 'liturgy' | 'availability' | 'settings' | 'admin' | 'projection' | 'chat' | 'theory' | 'bible' | 'offline' | 'master';
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  highlights: {
    icon: React.ReactNode;
    title: string;
    text: string;
  }[];
  quickTip: string;
  actionButtonText: string;
}

export const WelcomeTourModal: React.FC<WelcomeTourModalProps> = ({
  user,
  memberData,
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const memberName = memberData?.name ? memberData.name.split(' ')[0] : (user?.displayName ? user.displayName.split(' ')[0] : 'Ministro');

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      tabTarget: 'home',
      badge: 'Boas-Vindas ao Liloupro',
      title: `Bem-vindo à Equipe, ${memberName}! 🎉`,
      subtitle: 'Seu ministério de louvor conectado em um só lugar.',
      description: 'Preparamos este tour rápido para apresentar os 3 pilares fundamentais do seu dia a dia: como conferir suas Escalas, estudar o Repertório com cifras inteligentes e marcar sua Disponibilidade mensal.',
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      accentColor: 'from-amber-500/20 via-brand/10 to-transparent',
      highlights: [
        {
          icon: <Calendar className="w-4 h-4 text-emerald-400" />,
          title: 'Escalas de Culto',
          text: 'Saiba com antecedência em quais cultos e funções você foi escalado e confirme presença.'
        },
        {
          icon: <Music className="w-4 h-4 text-brand" />,
          title: 'Repertório & Cifras',
          text: 'Acesse as músicas selecionadas pelo líder, altere o tom, use rolagem e diagramas de acordes.'
        },
        {
          icon: <Clock className="w-4 h-4 text-cyan-400" />,
          title: 'Minha Disponibilidade',
          text: 'Marque os domingos e dias em que pode tocar para ajudar na montagem de escalas justas.'
        }
      ],
      quickTip: 'Você pode rever este tour a qualquer momento na Central de Ajuda no menu lateral.',
      actionButtonText: 'Começar pelo Repertório 🎵'
    },
    {
      id: 'repertoire',
      tabTarget: 'songs',
      badge: 'Pilar 1 de 3: Repertório',
      title: 'Repertório & Cifras Inteligentes 🎸',
      subtitle: 'Tudo pronto para os seus ensaios e momentos de louvor.',
      description: 'Chega de carregar pastas pesadas ou PDFs desatualizados. Todas as músicas cadastradas pela igreja ficam sincronizadas com ferramentas exclusivas para músicos e cantores.',
      icon: <Music className="w-8 h-8 text-brand" />,
      accentColor: 'from-brand/20 via-brand/5 to-transparent',
      highlights: [
        {
          icon: <Eye className="w-4 h-4 text-brand" />,
          title: 'Transposição de Tom Imediata',
          text: 'Ajuste o tom da música (ex: Tom Original → Tom do Ministro) com 1 toque no botão (+ / -).'
        },
        {
          icon: <Volume2 className="w-4 h-4 text-indigo-400" />,
          title: 'Diagramas de Violão & Intervalos',
          text: 'Consulte as posições dos acordes e alterne entre visualização anatômica de Dedos ou Intervalos (T, 3, 5, 7M).'
        },
        {
          icon: <BookmarkCheck className="w-4 h-4 text-emerald-400" />,
          title: 'Rolagem Automática & Pedal Bluetooth',
          text: 'Ative a rolagem de tela ou conecte seu pedal footswitch (AirTurn/Boss) para passar a cifra sem tirar as mãos do instrumento.'
        }
      ],
      quickTip: 'As cifras abertas recentemente ficam salvas para consulta no modo Offline caso a internet falhe na igreja.',
      actionButtonText: 'Ver sobre as Escalas 📅'
    },
    {
      id: 'schedules',
      tabTarget: 'calendar',
      badge: 'Pilar 2 de 3: Escalas',
      title: 'Escalas de Culto & Confirmação 📅',
      subtitle: 'Sincronia total entre líderes, instrumentistas e vocalistas.',
      description: 'No menu de Escalas e na sua Página Inicial, você visualiza em tempo real a formação de cada equipe de louvor e o cronograma dos cultos e ensaios.',
      icon: <Calendar className="w-8 h-8 text-emerald-400" />,
      accentColor: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      highlights: [
        {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          title: 'Confirmação de Presença',
          text: 'Com apenas um clique em "Confirmar Presença", o líder sabe instantaneamente se você poderá servir.'
        },
        {
          icon: <Music className="w-4 h-4 text-brand" />,
          title: 'Músicas do Culto Anexadas',
          text: 'Toque na escala para abrir a playlist com as músicas oficiais do culto no tom definido.'
        },
        {
          icon: <HeartHandshake className="w-4 h-4 text-amber-400" />,
          title: 'Notificações & Avisos',
          text: 'Receba alertas instantâneos sempre que uma nova escala for publicada ou quando houver alterações.'
        }
      ],
      quickTip: 'Sempre responda sua presença com antecedência para facilitar o planejamento dos ensaios.',
      actionButtonText: 'Ver sobre Disponibilidade ⏱️'
    },
    {
      id: 'availability',
      tabTarget: 'availability',
      badge: 'Pilar 3 de 3: Disponibilidade',
      title: 'Marcação de Disponibilidade 🗓️',
      subtitle: 'Evite conflitos de agenda e sirva com tranquilidade.',
      description: 'No início ou fechamento de cada mês, informe à liderança quais dias e horários você tem disponibilidade para tocar antes que a escala oficial seja gerada.',
      icon: <Clock className="w-8 h-8 text-cyan-400" />,
      accentColor: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
      highlights: [
        {
          icon: <Calendar className="w-4 h-4 text-cyan-400" />,
          title: 'Calendário Mensal Interativo',
          text: 'Toque nos domingos ou dias de culto para marcar "Disponível" (Verde) ou "Indisponível" (Vermelho).'
        },
        {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          title: 'Envio & Notificação ao Coordenador',
          text: 'Ao concluir sua marcação, o status é salvo e você pode avisar o líder com uma mensagem formatada.'
        },
        {
          icon: <ThumbsUp className="w-4 h-4 text-indigo-400" />,
          title: 'Fim das Perguntas no WhatsApp',
          text: 'O coordenador visualiza o mapa geral da equipe e escala apenas quem está livre no dia.'
        }
      ],
      quickTip: 'Fique atento ao prazo limite de preenchimento configurado pela liderança.',
      actionButtonText: 'Concluir Tour e Começar! 🚀'
    }
  ];

  const handleFinishTour = async () => {
    try {
      localStorage.setItem('liloupro_member_tour_completed', 'true');
      if (user?.uid) {
        await updateDoc(doc(db, 'members', user.uid), {
          memberTourCompleted: true,
          memberTourCompletedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Erro ao salvar conclusão do tour:', e);
    } finally {
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      if (onNavigateTab && tourSteps[nextIndex].tabTarget) {
        onNavigateTab(tourSteps[nextIndex].tabTarget!);
      }
    } else {
      handleFinishTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      if (onNavigateTab && tourSteps[prevIndex].tabTarget) {
        onNavigateTab(tourSteps[prevIndex].tabTarget!);
      }
    }
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dark Blur Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleFinishTour}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto z-10"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(79, 70, 229, 0.2)'
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${step.accentColor} pointer-events-none transition-all duration-500`} />

        {/* Modal Header */}
        <div className="relative p-6 sm:p-7 pb-4 flex items-start justify-between border-b border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand block mb-1">
                {step.badge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {step.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishTour}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Pular Tour"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative p-6 sm:p-7 pt-5 flex-1 flex flex-col gap-5">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {step.description}
          </p>

          {/* Key Feature Highlights */}
          <div className="flex flex-col gap-2.5">
            {step.highlights.map((hl, idx) => (
              <div 
                key={idx}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-3.5 flex items-start gap-3 transition-colors"
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 shrink-0 mt-0.5">
                  {hl.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wide text-white mb-0.5">
                    {hl.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                    {hl.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Pro Tip */}
          <div className="bg-brand/10 border border-brand/20 rounded-2xl p-3.5 flex items-center gap-2.5 text-brand-light">
            <span className="text-sm">💡</span>
            <p className="text-[11px] sm:text-xs leading-relaxed text-slate-200">
              <strong className="text-brand font-black uppercase text-[10px] tracking-wide block">Dica Rápida:</strong>
              {step.quickTip}
            </p>
          </div>
        </div>

        {/* Modal Footer / Navigation */}
        <div className="relative p-5 sm:p-6 bg-slate-950/70 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Step Progress Dots */}
          <div className="flex items-center gap-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStep(idx);
                  if (onNavigateTab && tourSteps[idx].tabTarget) {
                    onNavigateTab(tourSteps[idx].tabTarget!);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? 'w-6 bg-brand' 
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Ir para passo ${idx + 1}`}
              />
            ))}
            <span className="text-[10px] font-mono text-slate-400 ml-2">
              {currentStep + 1} de {tourSteps.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Voltar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-brand/20 flex items-center justify-center gap-2"
            >
              <span>{step.actionButtonText}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
