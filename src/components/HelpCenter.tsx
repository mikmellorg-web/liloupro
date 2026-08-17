import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  BookOpen, 
  Compass, 
  Users, 
  Music, 
  Tv, 
  Calendar, 
  GraduationCap, 
  CloudOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Book, 
  Smartphone, 
  ThumbsUp, 
  Laptop, 
  Info,
  Sliders,
  Clock
} from 'lucide-react';

interface HelpCenterProps {
  theme?: 'light' | 'dark';
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  tab: string;
  title: string;
  description: string;
  targetExplanation: string;
  tip: string;
}

export default function HelpCenter({ theme = 'dark', activeTab, setActiveTab, isAdmin, isOpen, onClose }: HelpCenterProps) {
  const [activeTabHelp, setActiveTabHelp] = useState<'trails' | 'tour' | 'quiz' | 'docs'>('trails');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | null>(null);
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Tour State
  const [tourActive, setTourActive] = useState(false);
  const [tourType, setTourType] = useState<'admin' | 'member' | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const isLight = theme === 'light';

  // Tour Data definitions
  const adminTourSteps: TourStep[] = [
    {
      tab: 'home',
      title: 'Painel Geral do Líder',
      description: 'Bem-vindo ao centro administrativo do LiLouPro! Aqui você acompanha os próximos cultos, status de escalas e mensagens em tempo real.',
      targetExplanation: 'No painel você vê de forma compacta o próximo evento, facilitando a tomada de decisões imediatas.',
      tip: 'Clique nos cultos no calendário para adicionar a playlist de músicas diretamente.'
    },
    {
      tab: 'songs',
      title: 'Acervo e Cadastro de Músicas',
      description: 'Gerencie todo o repertório do ministério de louvor. Você pode buscar letras cifradas de forma automática através da busca avançada pelo CifraClub e YouTube.',
      targetExplanation: 'O transposer avançado recalcula as cifras em tempo real para os músicos adaptarem ao tom correto dos vocalistas.',
      tip: 'Músicos adoram o modo "Rolagem Automática" que rola as letras sozinhas no ensaio!'
    },
    {
      tab: 'calendar',
      title: 'Escalas e Planejamento',
      description: 'Planeje cultos e ensaios com facilidade. Aloque membros para os vocais, guitarras, teclados e baterias, definindo o repertório que tocarão.',
      targetExplanation: 'As escalas enviam notificações automáticas e os músicos podem aceitar ou recusar no próprio painel.',
      tip: 'Use o campo "Observações" para dar orientações sobre o arranjo, figurino ou referências.'
    },
    {
      tab: 'liturgy',
      title: 'Cronograma Litúrgico & Projeção',
      description: 'Crie a sequência lógica do culto (Invocação, Cânticos, Avisos, Pregação). Envie as letras das músicas diretamente para a TV ou Projetor da igreja com um clique.',
      targetExplanation: 'Integrado com o Projetor Virtual que roda na tela de recepção do projetor/TV.',
      tip: 'O slide muda em tempo real quando o ministro ou o operador clica no verso correspondente!'
    },
    {
      tab: 'members',
      title: 'Gestão de Voluntários',
      description: 'Cadastre seus músicos, cantores, técnicos de áudio e mídia. Defina seus instrumentos principais e gerencie se ele é Administrador ou Membro.',
      targetExplanation: 'A organização de membros simplifica a montagem das escalas automáticas ou manuais.',
      tip: 'Mantenha os e-mails corretos para garantir o recebimento de alertas e notificações!'
    }
  ];

  const memberTourSteps: TourStep[] = [
    {
      tab: 'home',
      title: 'Minhas Escalas & Confirmação',
      description: 'Como músico ou voluntário, este é seu painel pessoal de serviço. Aqui você vê exatamente em quais cultos está escalado, o horário dos ensaios e confirma sua presença com 1 toque.',
      targetExplanation: 'Sinalize sua presença clicando em "Confirmar Presença" para dar tranquilidade ao líder do ministério.',
      tip: 'Sempre responda sua escala o quanto antes para facilitar o planejamento dos ensaios!'
    },
    {
      tab: 'songs',
      title: 'Repertório & Cifras Inteligentes',
      description: 'Abra as músicas e prepare seus acordes. O LiLouPro oferece transposição rápida de tom, diagramas de acordes de violão (Dedos ou Intervalos), rolagem automática e suporte a Pedal Bluetooth.',
      targetExplanation: 'Clique no botão PEDAL no topo da cifra para emparelhar pedais (Boss, AirTurn, PageTurner) e avançar estrofes no culto sem tirar as mãos do instrumento!',
      tip: 'Alterne entre visualização de Dedos e Intervalos teóricos (T, 3, 5, 7M) diretamente no braço do violão.'
    },
    {
      tab: 'availability',
      title: 'Marcação de Disponibilidade Mensal',
      description: 'Informe com antecedência quais domingos e cultos você tem disponibilidade para servir. Isso ajuda a liderança a montar escalas harmônicas sem conflitos de agenda.',
      targetExplanation: 'Toque nos dias no calendário para alternar entre Disponível (Verde) ou Indisponível (Vermelho) e envie ao líder.',
      tip: 'Conclua sua disponibilidade assim que a liderança liberar o mês para garantir sua participação.'
    },
    {
      tab: 'bible',
      title: 'Bíblia e Assistente IA',
      description: 'Acesse as escrituras para devocionais ou cultos. Nosso assistente de IA ajuda você a buscar versículos temáticos ou tirar dúvidas teológicas.',
      targetExplanation: 'Utilize o chat de IA para entender o contexto histórico de qualquer livro ou passagem.',
      tip: 'Use a busca de temas como "Perdão" ou "Esperança" para carregar 5 passagens fantásticas selecionadas.'
    },
    {
      tab: 'theory',
      title: 'Estudo Teórico e Prático',
      description: 'Evolua no seu instrumento! Oferecemos estudos completos de Campo Harmônico, Círculo de Quintas, Inversões de Acordes e questionários de fixação.',
      targetExplanation: 'Aprenda funções harmônicas (Tônica, Subdominante, Dominante) para tocar de ouvido.',
      tip: 'Estudar as inversões de acordes do worship (ex: G/B) eleva o som do ministério.'
    },
    {
      tab: 'offline',
      title: 'Cifras Offline 💾',
      description: 'Se a internet da igreja falhar, não se desespere! O LiLouPro salva suas escalas e cifras localmente de forma 100% segura e automática.',
      targetExplanation: 'As cifras abrem instantaneamente na central offline sem necessitar de dados móveis.',
      tip: 'Sempre abra o app antes de sair de casa para sincronizar as últimas escalas.'
    }
  ];

  const activeSteps = tourType === 'admin' ? adminTourSteps : memberTourSteps;

  const startTour = (type: 'admin' | 'member') => {
    setTourType(type);
    setTourStepIndex(0);
    setTourActive(true);
    onClose(); // Fechar a central e focar no tour
    setActiveTab(type === 'admin' ? adminTourSteps[0].tab : memberTourSteps[0].tab);
  };

  const nextTourStep = () => {
    if (tourStepIndex < activeSteps.length - 1) {
      const nextIndex = tourStepIndex + 1;
      setTourStepIndex(nextIndex);
      setActiveTab(activeSteps[nextIndex].tab);
    } else {
      endTour();
    }
  };

  const prevTourStep = () => {
    if (tourStepIndex > 0) {
      const prevIndex = tourStepIndex - 1;
      setTourStepIndex(prevIndex);
      setActiveTab(activeSteps[prevIndex].tab);
    }
  };

  const endTour = () => {
    setTourActive(false);
    setTourType(null);
    setTourStepIndex(0);
    // Do not auto re-open panel to respect UI focus, but they can re-open via menu anytime!
    setActiveTab('home');
  };

  // Quiz Questions definition
  const quizQuestions = [
    {
      question: "Como o músico pode avisar o líder que poderá tocar no próximo culto?",
      options: [
        "Enviando uma carta para a secretaria da igreja.",
        "Clicando em 'Confirmar Presença' no card de escalas da tela inicial.",
        "O sistema assume confirmação automática e não necessita de aviso.",
        "Apenas enviando mensagem no grupo privado."
      ],
      correct: 1,
      explanation: "Na tela inicial (Home) do LiLouPro, as próximas escalas do membro aparecem no topo com botões intuitivos para Confirmar ou Declinar a presença."
    },
    {
      question: "Onde os acordes de violão no visualizador de cifras podem ser alternados entre posições normais e teóricas?",
      options: [
        "Não existe essa opção.",
        "No painel de Configurações Gerais.",
        "Clicando diretamente no braço do violão entre as opções 'Dedos' e 'Intervalos'.",
        "Apenas nas aulas de Teoria Musical."
      ],
      correct: 2,
      explanation: "Em conformidade com a visão mobile-first do LiLouPro, o violão permite alternar instantaneamente entre a visualização anatômica de 'Dedos' e teórica de 'Intervalos' (T, 3ª, 5ª, 7ª) com um clique direto."
    },
    {
      question: "Como funciona o sistema de Projeção em tempo real para as letras?",
      options: [
        "É necessário exportar tudo para PowerPoint toda semana.",
        "O operador ativa o 'Projetor Virtual' e os slides mudam na TV/Telão em tempo real conforme o ministro ou operador clica nos versos no celular.",
        "Funciona apenas enviando arquivos PDF para a TV.",
        "A projeção exige conexão por cabo VGA longo até o celular."
      ],
      correct: 1,
      explanation: "O LiLouPro possui sincronia WebSocket em tempo real. Ao ativar o Projetor em uma aba e trocar os versos no painel principal, a TV atualiza imediatamente de forma fluida."
    },
    {
      question: "Se a internet cair na igreja no momento do culto, o que acontece?",
      options: [
        "O aplicativo é bloqueado e não funciona.",
        "O músico pode abrir a aba 'Acesso Offline 💾' onde as cifras e escalas recentes ficam guardadas localmente.",
        "Apenas administradores conseguem usar em 3G.",
        "O app exige reinicialização do celular."
      ],
      correct: 1,
      explanation: "O LiLouPro implementa armazenamento local resiliente e uma aba dedicada de Acesso Offline para assegurar que nenhum músico fique sem cifra por problemas de conexão."
    }
  ];

  const handleSelectQuizAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const submitQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  return (
    <>
      {/* TOUR IN-APP OVERLAY CONTROL CARD */}
      <AnimatePresence>
        {tourActive && tourType && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-none z-[100] flex flex-col justify-end p-4 md:p-8 md:items-end">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`w-full md:max-w-md pointer-events-auto border rounded-3xl shadow-2xl p-5 flex flex-col gap-4 ${
                isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              {/* Tour Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand">
                    Tour Liloupro ({tourType === 'admin' ? 'Administrador' : 'Membro'})
                  </span>
                </div>
                <div className="text-xs font-mono text-text-muted">
                  Passo {tourStepIndex + 1} de {activeSteps.length}
                </div>
              </div>

              {/* Current Step Description */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-1.5 text-brand">
                  {activeSteps[tourStepIndex].title}
                </h3>
                <p className="text-xs leading-relaxed opacity-90">
                  {activeSteps[tourStepIndex].description}
                </p>
              </div>

              {/* High Fidelity Technical Indicator */}
              <div className={`p-3 rounded-2xl text-[11px] leading-relaxed flex gap-2 ${
                isLight ? 'bg-indigo-50 text-indigo-950' : 'bg-brand/5 border border-brand/10 text-brand-light'
              }`}>
                <Info size={14} className="shrink-0 mt-0.5 text-brand" />
                <div>
                  <span className="font-extrabold uppercase text-[9px] block tracking-wide">Foco de Uso:</span>
                  <p className="opacity-90">{activeSteps[tourStepIndex].targetExplanation}</p>
                </div>
              </div>

              {/* Pro Tip */}
              <p className="text-[10px] italic text-text-muted">
                💡 <strong>Dica Pro:</strong> {activeSteps[tourStepIndex].tip}
              </p>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={endTour}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Sair do Tour
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevTourStep}
                    disabled={tourStepIndex === 0}
                    className="p-1.5 rounded-xl border border-white/5 disabled:opacity-30 transition-all text-text-main"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={nextTourStep}
                    className="px-4 py-2 bg-brand text-slate-900 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 hover:bg-brand-light shadow-md"
                  >
                    <span>{tourStepIndex === activeSteps.length - 1 ? 'Concluir' : 'Próximo'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED SLIDE-OVER HELP DIALOG */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`relative w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden border-l ${
                isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              {/* Header */}
              <div className={`p-5 border-b flex items-center justify-between ${
                isLight ? 'bg-white border-zinc-200' : 'bg-slate-950 border-slate-850'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    <Compass size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-brand">LiLouPro</h2>
                    <p className="text-[10px] text-text-muted font-mono uppercase">Central de Onboarding & Treinamento</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-main transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className={`flex border-b p-1.5 gap-1.5 ${
                isLight ? 'bg-zinc-100/50 border-zinc-200' : 'bg-slate-950/40 border-slate-850'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveTabHelp('trails')}
                  className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTabHelp === 'trails'
                      ? 'bg-brand text-slate-900 shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  Trilhas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabHelp('tour')}
                  className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTabHelp === 'tour'
                      ? 'bg-brand text-slate-900 shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  Tour Guiado
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabHelp('quiz')}
                  className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTabHelp === 'quiz'
                      ? 'bg-brand text-slate-900 shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  Quiz de Fixação
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabHelp('docs')}
                  className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTabHelp === 'docs'
                      ? 'bg-brand text-slate-900 shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  Documentação
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-5">
                
                {/* TAB 1: ROLE-BASED TRAILS */}
                {activeTabHelp === 'trails' && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center max-w-sm mx-auto mb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand">Escolha sua Função</h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Preparamos guias rápidos e interativos adaptados para o seu papel no ministério de louvor da igreja.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Trail: Leader */}
                      <div 
                        onClick={() => setSelectedRole('admin')}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-3 select-none ${
                          selectedRole === 'admin' 
                            ? 'border-brand bg-brand/5' 
                            : 'border-border/60 hover:border-text-muted/40 bg-surface/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-xl bg-brand/10 text-brand`}>
                            <Users size={20} />
                          </div>
                          {selectedRole === 'admin' && <CheckCircle2 size={16} className="text-brand" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-tight text-brand">Líder / Administrador</h4>
                          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                            Para pastores, ministros de louvor e coordenadores de escala e liturgia.
                          </p>
                        </div>
                      </div>

                      {/* Trail: Member */}
                      <div 
                        onClick={() => setSelectedRole('member')}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-3 select-none ${
                          selectedRole === 'member' 
                            ? 'border-brand bg-brand/5' 
                            : 'border-border/60 hover:border-text-muted/40 bg-surface/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-xl bg-indigo-550/10 text-indigo-400">
                            <Music size={20} />
                          </div>
                          {selectedRole === 'member' && <CheckCircle2 size={16} className="text-brand" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-tight text-indigo-400">Membro / Músico</h4>
                          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                            Para cantores, instrumentistas, sonoplastas e operadores de projeção.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Content based on selected role */}
                    {selectedRole && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex flex-col gap-3.5"
                      >
                        <div className="border-t border-white/5 pt-4">
                          <h3 className="text-xs font-black uppercase tracking-wider text-brand mb-3 flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-brand" />
                            <span>Recursos Essenciais para você dominar:</span>
                          </h3>

                          {selectedRole === 'admin' ? (
                            <div className="flex flex-col gap-2.5">
                              {/* Step Item */}
                              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">1</div>
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-text-main uppercase block text-[10px] tracking-tight">Criar Escala de Membros:</strong>
                                  Acesse a aba <strong>Escalas</strong> no calendário. Aloque instrumentistas e vocalistas para cultos e ensaios, facilitando a organização das equipes.
                                </div>
                              </div>
                              {/* Step Item */}
                              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">2</div>
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-text-main uppercase block text-[10px] tracking-tight">Inserir Playlist & Cifras:</strong>
                                  Em cada culto escalado, anexe a lista de músicas. Use a importação inteligente para puxar letras do CifraClub instantaneamente.
                                </div>
                              </div>
                              {/* Step Item */}
                              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">3</div>
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-text-main uppercase block text-[10px] tracking-tight">Ativar Telão / Projeção:</strong>
                                  Utilize a aba <strong>Projeção</strong> ou <strong>Liturgia</strong> para transmitir em tempo real as letras para a TV ou projetor sem erros de digitação.
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              {/* Step Item */}
                              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">1</div>
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-text-main uppercase block text-[10px] tracking-tight">Ver minhas Escalas de Culto:</strong>
                                  No seu feed da página inicial, confira as datas, confirme sua presença e veja as músicas selecionadas pelo seu líder.
                                </div>
                              </div>
                              {/* Step Item */}
                              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">2</div>
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-text-main uppercase block text-[10px] tracking-tight">Estudar Cifras Personalizadas:</strong>
                                  Mude o tom da música para sua voz, use a rolagem automática e veja se prefere ver diagramas por <strong>Dedos</strong> ou por <strong>Intervalos</strong>.
                                </div>
                              </div>
                              {/* Step Item */}
                              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">3</div>
                                <div className="text-[11px] leading-relaxed">
                                  <strong className="text-text-main uppercase block text-[10px] tracking-tight">Modo Offline na Igreja:</strong>
                                  Mantenha suas cifras sempre no bolso! O aplicativo salva automaticamente as escalas para que você as leia mesmo sem sinal de internet.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Start tour button inside trail */}
                        <button
                          type="button"
                          onClick={() => startTour(selectedRole)}
                          className="mt-2 w-full py-3 bg-brand text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-light shadow-lg transition-all"
                        >
                          <Play size={14} fill="currentColor" />
                          <span>Iniciar Tour Rápido no App</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* TAB 2: INTERACTIVE LIVE TOURS */}
                {activeTabHelp === 'tour' && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center max-w-sm mx-auto">
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand">Tour Guiado Interativo</h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        A melhor maneira de aprender! Nós mudamos as telas do aplicativo em tempo real enquanto mostramos dicas úteis de como usar o LiLouPro no dia a dia.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase text-brand">Tour do Líder (Admin)</h4>
                          <span className="text-[9px] font-mono bg-brand/10 text-brand px-2 py-0.5 rounded-lg font-bold">5 Passos</span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          Aprenda a cadastrar músicas pelo CifraClub, programar escalas de membros, criar liturgias e ativar projeção inteligente de slides.
                        </p>
                        <button
                          type="button"
                          onClick={() => startTour('admin')}
                          className="mt-2 w-full py-2.5 bg-brand hover:bg-brand-light text-slate-900 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Iniciar Tour de Líder</span>
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase text-indigo-400">Tour do Ministro (Membro)</h4>
                          <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg font-bold">6 Passos</span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          Aprenda a confirmar presença nas escalas de culto, dominar o repertório e cifras com diagramas de violão (Dedos/Intervalos) e preencher sua disponibilidade mensal.
                        </p>
                        <button
                          type="button"
                          onClick={() => startTour('member')}
                          className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Iniciar Tour de Ministro</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FIXATION QUIZZES */}
                {activeTabHelp === 'quiz' && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center max-w-sm mx-auto mb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand">Quiz de Alinhamento de Equipe</h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Teste seus conhecimentos sobre o LiLouPro! Perfeito para garantir que toda a equipe da sua igreja domine as principais facilidades comerciais.
                      </p>
                    </div>

                    {!quizSubmitted ? (
                      <div className="flex flex-col gap-5">
                        {quizQuestions.map((q, qIdx) => (
                          <div key={qIdx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                            <h4 className="text-xs font-extrabold leading-relaxed text-text-main">
                              {qIdx + 1}. {q.question}
                            </h4>
                            <div className="flex flex-col gap-2">
                              {q.options.map((opt, oIdx) => {
                                const isSelected = quizAnswers[qIdx] === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSelectQuizAnswer(qIdx, oIdx)}
                                    className={`w-full text-left p-3 rounded-xl text-[11px] leading-relaxed transition-all border ${
                                      isSelected
                                        ? 'border-brand bg-brand/5 text-brand font-bold'
                                        : 'border-white/5 hover:border-white/10 hover:bg-white/5 text-text-muted'
                                    }`}
                                  >
                                    <span className="font-mono mr-2">{String.fromCharCode(65 + oIdx)})</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={submitQuiz}
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                          className="w-full py-3 bg-brand text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-brand-light transition-all disabled:opacity-50 shadow-lg mt-2"
                        >
                          Enviar Respostas
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center gap-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-2">
                          <GraduationCap size={32} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase text-brand">Seu Resultado no Quiz!</h3>
                          <p className="text-xl font-mono font-black mt-2 text-white">
                            {quizScore} de {quizQuestions.length} corretas
                          </p>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-sm">
                            {quizScore === quizQuestions.length 
                              ? "Sensacional! Você é um expert no LiLouPro e está pronto para gerenciar o ministério com excelência!" 
                              : "Bom trabalho! Continue estudando os recursos para organizar seus cultos como um profissional."}
                          </p>
                        </div>

                        {/* Review detailed explanations */}
                        <div className="w-full text-left flex flex-col gap-3 mt-4 border-t border-white/5 pt-4">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-brand">Análise Teórica & Prática:</h4>
                          {quizQuestions.map((q, idx) => {
                            const isCorrect = quizAnswers[idx] === q.correct;
                            return (
                              <div key={idx} className="p-3 rounded-xl bg-white/5 text-[10px] leading-relaxed border border-white/5">
                                <div className="flex items-center gap-1.5 font-bold mb-1">
                                  {isCorrect ? (
                                    <span className="text-emerald-500">✔ Correta</span>
                                  ) : (
                                    <span className="text-rose-500">✘ Incorreta</span>
                                  )}
                                  <span className="text-text-muted">— Pergunta {idx + 1}</span>
                                </div>
                                <p className="text-text-muted italic">"{q.explanation}"</p>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={resetQuiz}
                          className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all mt-2"
                        >
                          Tentar Novamente
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* TAB 4: WRITTEN MANUAL DOCUMENTATION */}
                {activeTabHelp === 'docs' && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center max-w-sm mx-auto mb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand">Manual Completo LiLouPro</h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Guia teórico completo de recursos avançados para consulta rápida a qualquer momento.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 text-xs leading-relaxed text-text-muted">
                      
                      {/* Section: Chord Transposer */}
                      <div className="flex flex-col gap-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <h4 className="font-extrabold text-brand uppercase text-[11px] flex items-center gap-1.5 mb-1">
                          <Music size={14} />
                          <span>Módulo de Cifras e Acordes</span>
                        </h4>
                        <p>O LiLouPro possui um renderizador inteligente de braço de violão em SVG com duas visualizações:</p>
                        <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                          <li><strong>DEDOS (Anatômico):</strong> Exibe os pontos exatos onde cada dedo deve apertar a corda do violão (Posições 1, 2, 3, 4).</li>
                          <li><strong>INTERVALOS (Teórico):</strong> Exibe a função harmônica de cada nota no acorde: Tônica (T), Terça (3), Quinta (5), Sétima (7m/7M).</li>
                        </ul>
                      </div>

                      {/* Section: Liturgy & Slides */}
                      <div className="flex flex-col gap-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <h4 className="font-extrabold text-brand uppercase text-[11px] flex items-center gap-1.5 mb-1">
                          <Tv size={14} />
                          <span>Liturgia & Transmissão Simultânea</span>
                        </h4>
                        <p>Para o operador de mídia da igreja:</p>
                        <ol className="list-decimal pl-4 mt-1 flex flex-col gap-1">
                          <li>Monte a ordem litúrgica na aba <strong>Liturgia</strong>.</li>
                          <li>Em outro computador ou TV Smart, abra o navegador no link fornecido em <strong>Visualizar Projetor</strong>.</li>
                          <li>Clique nos versos no celular do ministro ou no computador de controle: a TV atualizará a projeção instantaneamente via WebSocket.</li>
                        </ol>
                      </div>

                      {/* Section: System Scaling */}
                      <div className="flex flex-col gap-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <h4 className="font-extrabold text-brand uppercase text-[11px] flex items-center gap-1.5 mb-1">
                          <Calendar size={14} />
                          <span>Sistema de Escala de Músicos</span>
                        </h4>
                        <p>Para evitar sobreposição e conflito de escalas de músicos:</p>
                        <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                          <li>O líder cria o evento e aloca os membros.</li>
                          <li>Os membros são avisados por e-mail e na tela do app.</li>
                          <li>Eles podem detalhar indisponibilidades de datas no painel pessoal, prevenindo que o líder os escalem por engano.</li>
                        </ul>
                      </div>

                      {/* Section: Offline */}
                      <div className="flex flex-col gap-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <h4 className="font-extrabold text-brand uppercase text-[11px] flex items-center gap-1.5 mb-1">
                          <CloudOff size={14} />
                          <span>Segurança de Dados Offline (LocalStorage)</span>
                        </h4>
                        <p>Como a internet em igrejas costuma falhar devido a interferências:</p>
                        <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                          <li>As cifras visualizadas recentemente e as próximas 3 escalas são baixadas silenciosamente para o celular.</li>
                          <li>Em caso de desconexão, o app redireciona para a central offline onde o culto pode prosseguir sem interrupção de música.</li>
                        </ul>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Footer inside slide-over */}
              <div className={`p-4 border-t text-center ${
                isLight ? 'bg-zinc-100/50 border-zinc-200' : 'bg-slate-950 border-slate-850'
              }`}>
                <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
                  LiLouPro — Liturgia, Louvor e Projeção
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
