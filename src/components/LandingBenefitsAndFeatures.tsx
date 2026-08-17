import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Music, 
  Sliders, 
  Tv, 
  MessageSquare, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Layers, 
  FileText,
  Volume2,
  Check,
  Zap,
  Heart,
  UserCheck
} from 'lucide-react';
import { Music2 } from './MusicIcon';

interface LandingBenefitsAndFeaturesProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function LandingBenefitsAndFeatures({ onEnterApp }: LandingBenefitsAndFeaturesProps) {
  // Estado para modal de detalhes dos módulos
  const [activeModuleModal, setActiveModuleModal] = useState<string | null>(null);

  // Estado para a Seção: Veja o LiLouPro Funcionando (Simulador interativo de 20s)
  const [activeDemo, setActiveDemo] = useState<number>(0);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const demos = [
    {
      id: 0,
      title: "Paz nas escalas",
      badge: "Escalas Inteligentes",
      duration: "20 seg",
      subtitle: "Monte a escala em minutos sabendo exatamente quem está disponível na sua equipe.",
      steps: [
        { label: "1. Selecionar culto", desc: "Culto de Domingo • 19h00" },
        { label: "2. Escalar músicos", desc: "Daniel (Violão) • Carla (Vocal)" },
        { label: "3. Confirmação instantânea", desc: "A equipe responde pelo celular" }
      ],
      mockupType: "escala"
    },
    {
      id: 1,
      title: "Cifra no tom exato",
      badge: "Transposição Instantânea",
      duration: "15 seg",
      subtitle: "Altere a tonalidade em 1 clique durante o ensaio para que todos toquem em sintonia.",
      steps: [
        { label: "1. Abrir cifra", desc: "Grande é o Senhor (Tom original G)" },
        { label: "2. Ajustar tom para o vocal", desc: "Transpor para A (+2 semitons)" },
        { label: "3. Sincronizar com a banda", desc: "Teclado e violão atualizados na hora" }
      ],
      mockupType: "cifra"
    },
    {
      id: 2,
      title: "Projeção sem pen drive",
      badge: "Telão Conectado",
      duration: "20 seg",
      subtitle: "O operador de mídia projeta as letras no telão direto pelo navegador com um clique.",
      steps: [
        { label: "1. Selecionar liturgia", desc: "Ordem das canções e leitura" },
        { label: "2. Conectar telão", desc: "Projeção em tela cheia via web" },
        { label: "3. Controle remoto", desc: "Avançar estrofes em sincronia" }
      ],
      mockupType: "projecao"
    }
  ];

  // Auto-play do simulador interativo
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setDemoProgress((prev) => {
        if (prev >= 100) {
          setActiveDemo((current) => (current + 1) % demos.length);
          return 0;
        }
        return prev + 4;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isAutoPlaying, demos.length]);

  const handleSelectDemo = (idx: number) => {
    setIsAutoPlaying(false);
    setActiveDemo(idx);
    setDemoProgress(0);
  };

  // MÓDULOS COM CONSEQUÊNCIAS (Melhoria 2: Como isso melhora a vida do líder?)
  const consequenceModules = [
    {
      id: "escala",
      title: "Passe menos tempo procurando confirmações",
      featureLabel: "Módulo • Escalas Inteligentes",
      icon: Calendar,
      description: "Monte escalas considerando a disponibilidade real de cada voluntário. Chega de perguntar de dez em dez no WhatsApp quem vai poder tocar no domingo.",
      benefits: [
        "Placar de confirmação verde e vermelho na tela",
        "Avisos automáticos de rodízio e descanso",
        "Histórico transparente de participação"
      ]
    },
    {
      id: "repertorio",
      title: "Todos ensaiam exatamente a mesma versão",
      featureLabel: "Módulo • Repertório Centralizado",
      icon: Music,
      description: "Acabe com a confusão sobre qual arranjo ou introdução será tocada. Compartilhe o link do áudio, tom de referência e observações em um único lugar.",
      benefits: [
        "Catálogo completo de hinos e canções",
        "Links de áudio de referência para estudo em casa",
        "Filtro por andamento, tom e tema litúrgico"
      ]
    },
    {
      id: "cifras",
      title: "Ninguém mais precisa procurar outra tonalidade",
      featureLabel: "Módulo • Cifras & Tom Ideal",
      icon: Sliders,
      description: "Mude o tom da música em tempo real durante o ensaio e todos os músicos veem os acordes ajustados na hora em seus celulares.",
      benefits: [
        "Transposição instantânea de acordes com 1 clique",
        "Visualização clara para violão, teclado e baixo",
        "Cálculo automático de capotraste"
      ]
    },
    {
      id: "comunicacao",
      title: "Todos recebem a informação certa na hora certa",
      featureLabel: "Módulo • Comunicação & Avisos",
      icon: MessageSquare,
      description: "Envie comunicados sobre horários de ensaio, trajes e avisos litúrgicos diretamente pelo aplicativo sem mensagens perdidas em grupos.",
      benefits: [
        "Notificações diretas para os escalados da semana",
        "Confirmação individual com 1 toque",
        "Zero mensagens paralelas ou figurinhas no grupo"
      ]
    },
    {
      id: "liturgia",
      title: "O pastor e a banda na mesma página antes do ensaio",
      featureLabel: "Módulo • Ordem Litúrgica",
      icon: Layers,
      description: "Organize a ordem do culto, pregação e momentos de louvor para que o pastor, ministro e mídia saibam o tempo exato de cada etapa.",
      benefits: [
        "Cronograma interativo do início ao fim do culto",
        "Alinhamento prévio com a mensagem pastoral",
        "Tranquilidade para quem dirige o culto"
      ]
    },
    {
      id: "projecao",
      title: "O operador de mídia transmite as letras sem retrabalho",
      featureLabel: "Módulo • Projeção & Telão",
      icon: Tv,
      description: "Projete letras e fundos diretamente no telão da igreja usando qualquer navegador. Sem pen drive corrompido ou slides reescritos às pressas.",
      benefits: [
        "Projeção limpa em tela cheia via navegador",
        "Sincronizada em tempo real com a ordem do culto",
        "Leve e funcional em qualquer computador da mídia"
      ]
    },
    {
      id: "membros",
      title: "A liderança visualiza os voluntários ativos em paz",
      featureLabel: "Módulo • Membros & Funções",
      icon: Users,
      description: "Cadastre músicos, vocais e técnicos com seus respectivos instrumentos e histórico de serviço para distribuir melhor as escalas do mês.",
      benefits: [
        "Perfis com instrumentos principais e secundários",
        "Registro claro para quem lidera o ministério",
        "Controle simples de férias e indisponibilidade"
      ]
    },
    {
      id: "pwa",
      title: "O músico abre a cifra no celular sem gastar dados",
      featureLabel: "Módulo • PWA & Acesso Móvel",
      icon: Smartphone,
      description: "Funciona em qualquer smartphone Android ou iPhone. Abra no ensaio ou no púlpito com velocidade instantânea e leitura confortável no modo escuro.",
      benefits: [
        "Instalável na tela inicial sem ocupar memória",
        "Filosofia Mobile-First com botões amplos",
        "Modo escuro otimizado para o palco da igreja"
      ]
    },
    {
      id: "seguranca",
      title: "O ministério preservado mesmo com troca de liderança",
      featureLabel: "Módulo • Memória & Proteção",
      icon: ShieldCheck,
      description: "Todo o histórico de escalas, repertórios e cadernos da igreja fica guardado em segurança na nuvem, sem depender do celular particular de ninguém.",
      benefits: [
        "Backup automático na nuvem em tempo real",
        "Histórico do ministério sempre preservado",
        "Acesso contínuo para futuras gerações de líderes"
      ]
    }
  ];

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* SEÇÃO 4 & 5: AS FUNCIONALIDADES COMO CONSEQUÊNCIAS (O que melhora na rotina) */}
      <section id="funcionalidades" className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Alívio para a Liderança
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Como o LiLouPro melhora a rotina de cada voluntário
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Cada recurso foi pensado para eliminar atritos na comunicação da equipe e dar mais tempo para o que realmente importa.
          </p>
        </div>

        {/* Grid de Consequências e Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {consequenceModules.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveModuleModal(item.id)}
                className="bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-brand/40 rounded-3xl p-6 sm:p-8 space-y-5 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      {item.featureLabel.split('•')[1]?.trim()}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-brand transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  {item.benefits.slice(0, 2).map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-brand group-hover:underline">
                    <span>Ver como funciona na prática</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RESPIRO VISUAL 3: MEMÓRIA DE MARCA */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="py-10 px-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1829] to-slate-900 border border-white/10 text-center space-y-2 shadow-xl">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight italic">
            "Toda equipe afinada. Toda igreja conectada."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            Sintonia na música e na liderança do ministério
          </p>
        </div>
      </section>

      {/* SEÇÃO 6: VEJA FUNCIONANDO EM 20 SEGUNDOS (Simulador com pessoas reais) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900/80 border border-white/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Play className="w-3.5 h-3.5" />
              Simulador Interativo
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Veja o sistema em funcionamento
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Navegue pelos cenários abaixo e veja a fluidez do LiLouPro em ação.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Lado Esquerdo: Abas de Cenários */}
            <div className="lg:col-span-5 space-y-3">
              {demos.map((demo, idx) => {
                const isActive = activeDemo === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectDemo(idx)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-950 border-brand/50 shadow-lg' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${isActive ? 'text-brand' : 'text-slate-400'}`}>
                        {demo.badge}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {demo.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {demo.subtitle}
                    </p>

                    {isActive && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        {demo.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold">{step.label}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{step.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lado Direito: Visualização Real da Interface (Pessoas e Funções) */}
            <div className="lg:col-span-7">
              <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative min-h-[300px] flex flex-col justify-between">
                
                {/* Cabeçalho do Card de Simulação */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {demos[activeDemo].badge} • IBN Sede
                    </span>
                  </div>
                  <span className="text-xs font-mono text-brand">
                    {demos[activeDemo].title}
                  </span>
                </div>

                {/* Corpo do Simulador demonstrando pessoas e dados reais */}
                <div className="py-6 space-y-4">
                  {demos[activeDemo].mockupType === 'escala' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center text-xs">DL</div>
                          <div>
                            <p className="text-sm font-bold text-white">Daniel Lemos • Violão & Guitarra</p>
                            <p className="text-xs text-slate-400">Escalado para Domingo 19h</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          Confirmado
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-xs">CS</div>
                          <div>
                            <p className="text-sm font-bold text-white">Carla Santos • Ministra de Louvor</p>
                            <p className="text-xs text-slate-400">Escalada para Domingo 19h</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          Confirmada
                        </span>
                      </div>
                    </div>
                  )}

                  {demos[activeDemo].mockupType === 'cifra' && (
                    <div className="bg-slate-900 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 font-sans">
                        <span className="font-bold text-white">Grande é o Senhor (Tom de Ensaio: A)</span>
                        <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">Transposto +2 semi</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-brand font-bold">A                    E                    F#m                  D</div>
                        <div className="text-slate-200 font-sans">Senhor tu és bom, a tua misericórdia dura para sempre...</div>
                      </div>
                    </div>
                  )}

                  {demos[activeDemo].mockupType === 'projecao' && (
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/10 text-center space-y-3">
                      <span className="text-[10px] font-mono text-sky-300 uppercase tracking-widest bg-sky-500/10 px-2.5 py-1 rounded-full">
                        Projeção Web • Telão Principal
                      </span>
                      <p className="text-lg sm:text-xl font-bold text-white">
                        "SENHOR TU ÉS BOM, A TUA MISERICÓRDIA DURA PARA SEMPRE"
                      </p>
                      <p className="text-xs text-slate-400">
                        Operador: Gabriel Andrade • Sincronizado na hora
                      </p>
                    </div>
                  )}
                </div>

                {/* Barra de Progresso do Simulador */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Demonstração interativa LiLouPro
                  </span>
                  <button
                    onClick={() => onEnterApp('signup')}
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    Testar essa função na minha igreja →
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESPIRO VISUAL 4: MEMÓRIA DE MARCA */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="py-10 px-8 rounded-3xl bg-slate-900/80 border border-white/10 text-center space-y-2">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight italic">
            "Menos improviso. Mais adoração."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Quando a técnica e a organização funcionam em paz, o ministério floresce
          </p>
        </div>
      </section>

      {/* MODAL DE DETALHES DE MÓDULO (Mantido e aprimorado) */}
      {activeModuleModal && (
        <div 
          onClick={() => setActiveModuleModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl"
          >
            {(() => {
              const selected = consequenceModules.find(m => m.id === activeModuleModal);
              if (!selected) return null;
              const IconComp = selected.icon;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {selected.featureLabel}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveModuleModal(null)}
                      className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">
                      {selected.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {selected.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      O que está incluso nesta função:
                    </span>
                    {selected.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveModuleModal(null);
                        onEnterApp('signup');
                      }}
                      className="flex-1 py-3.5 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Experimentar grátis por 30 dias
                    </button>
                    <button
                      onClick={() => setActiveModuleModal(null)}
                      className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
