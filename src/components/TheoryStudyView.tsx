import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  Sliders, 
  Sparkles, 
  Music, 
  ToggleLeft, 
  Tv,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Info,
  GraduationCap,
  Guitar,
  Piano,
  Music2,
  Music3,
  Music4,
  Layers
} from 'lucide-react';
import { GuitarChordDiagram, PianoChordDiagram } from './ChordDictionary';

interface ChordDegree {
  degree: string;
  chord: string;
  functionType: 'Tônica' | 'Subdominante' | 'Dominante';
  description: string;
}

const CHORD_CIRCLE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]; // semitones from root
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]; // natural minor

const DEGREES_MAJOR_CHORDS = [
  { deg: 'I7M', quality: '7M', func: 'Tônica', desc: 'Acorde de repouso absoluto. Sensação de lar e estabilidade.' },
  { deg: 'IIm7', quality: 'm7', func: 'Subdominante', desc: 'Acorde de transição suave. Direciona ao movimento intermediário.' },
  { deg: 'IIIm7', quality: 'm7', func: 'Tônica', desc: 'Função de repouso relativo ou substituto menor do primeiro grau.' },
  { deg: 'IV7M', quality: '7M', func: 'Subdominante', desc: 'Símbolo do movimento. Meio caminho entre estabilidade e extrema tensão.' },
  { deg: 'V7', quality: '7', func: 'Dominante', desc: 'Tensão máxima! O trítono clama pela resolução em direção ao primeiro grau (I7M).' },
  { deg: 'VIm7', quality: 'm7', func: 'Tônica', desc: 'Repouso relativo. Conhecido como a relativa menor da tonalidade.' },
  { deg: 'VIIm7(b5)', quality: 'm7(b5)', func: 'Dominante', desc: 'Semi-diminuto. Altíssima instabilidade devido à quinta diminuta.' }
];

const inversionData = {
  C: {
    name: 'Dó Maior (Tríade)',
    notes: ['C', 'E', 'G'],
    fundamental: {
      bass: { note: 'C', interval: 'Tônica (1ª)' },
      stack: [{ note: 'E', interval: 'Terça (3ª)' }, { note: 'G', interval: 'Quinta (5ª)' }],
      symbol: 'C',
      application: 'Posição estável padrão. O ponto de chegada mais seguro e robusto da harmonia.'
    },
    primeira: {
      bass: { note: 'E', interval: 'Terça (3ª)' },
      stack: [{ note: 'G', interval: 'Quinta (5ª)' }, { note: 'C', interval: 'Tônica (1ª)' }],
      symbol: 'C/E',
      application: 'Perfeito para suavizar a condução quando o próximo acorde for F (Fá Maior). O baixo caminha por proximidade: C/E → F.'
    },
    segunda: {
      bass: { note: 'G', interval: 'Quinta (5ª)' },
      stack: [{ note: 'C', interval: 'Tônica (1ª)' }, { note: 'E', interval: 'Terça (3ª)' }],
      symbol: 'C/G',
      application: 'Excelente para uso como acorde de quarta-e-sexta cadencial (C/G → G7 → C), conduzindo com extremo requinte para a resolução.'
    },
    terceira: null
  },
  G: {
    name: 'Sol Maior (Tríade)',
    notes: ['G', 'B', 'D'],
    fundamental: {
      bass: { note: 'G', interval: 'Tônica (1ª)' },
      stack: [{ note: 'B', interval: 'Terça (3ª)' }, { note: 'D', interval: 'Quinta (5ª)' }],
      symbol: 'G',
      application: 'Estrutura fundamental estável. É a dominante padrão de C ou a tônica da tonalidade de Sol.'
    },
    primeira: {
      bass: { note: 'B', interval: 'Terça (3ª)' },
      stack: [{ note: 'D', interval: 'Quinta (5ª)' }, { note: 'G', interval: 'Tônica (1ª)' }],
      symbol: 'G/B',
      application: 'Inversão clássica do worship! Usado em sequências como C → G/B → Am7. O baixo desce linearmente C → B → A, soando incrivelmente fluido.'
    },
    segunda: {
      bass: { note: 'D', interval: 'Quinta (5ª)' },
      stack: [{ note: 'G', interval: 'Tônica (1ª)' }, { note: 'B', interval: 'Terça (3ª)' }],
      symbol: 'G/D',
      application: 'Usado como acorde de passagem ou pedal. Excelente para apoiar melodias que descansam na nota Ré sem mover o baixo de forma agressiva.'
    },
    terceira: null
  },
  C7M: {
    name: 'Dó com Sétima Maior (Tétrade)',
    notes: ['C', 'E', 'G', 'B'],
    fundamental: {
      bass: { note: 'C', interval: 'Tônica (1ª)' },
      stack: [
        { note: 'E', interval: 'Terça (3ª)' },
        { note: 'G', interval: 'Quinta (5ª)' },
        { note: 'B', interval: 'Sétima Maior (7M)' }
      ],
      symbol: 'C7M',
      application: 'O acorde mais nobre da harmonia. Traz a paz acústica da sétima sobre a tônica no baixo.'
    },
    primeira: {
      bass: { note: 'E', interval: 'Terça (3ª)' },
      stack: [
        { note: 'G', interval: 'Quinta (5ª)' },
        { note: 'B', interval: 'Sétima Maior (7M)' },
        { note: 'C', interval: 'Tônica (1ª)' }
      ],
      symbol: 'C7M/E',
      application: 'Muito sofisticado. Mantém todo o preenchimento harmônico flutuando de forma etérea com o baixo na terça.'
    },
    segunda: {
      bass: { note: 'G', interval: 'Quinta (5ª)' },
      stack: [
        { note: 'B', interval: 'Sétima Maior (7M)' },
        { note: 'C', interval: 'Tônica (1ª)' },
        { note: 'E', interval: 'Terça (3ª)' }
      ],
      symbol: 'C7M/G',
      application: 'Ideal para suspensões melódicas em baladas lentas de adoração congregacional.'
    },
    terceira: {
      bass: { note: 'B', interval: 'Sétima Maior (7M)' },
      stack: [
        { note: 'C', interval: 'Tônica (1ª)' },
        { note: 'E', interval: 'Terça (3ª)' },
        { note: 'G', interval: 'Quinta (5ª)' }
      ],
      symbol: 'C7M/B',
      application: 'Inigualável em descidas harmônicas! Serve de transição perfeita ao sair de C7M para descer até Am7 (C7M → C7M/B → Am7).'
    }
  }
};

const INTERVALS_LIST = [
  { name: 'Segunda Menor (2b)', semitones: 1, type: 'Simples', formula: '0.5 Tom (1 Semitom)', vibe: 'Dissonante e extremamente tensa. Traz uma sensação dramática e misteriosa (ex: tema do Tubarão).' },
  { name: 'Segunda Maior (2ª)', semitones: 2, type: 'Simples', formula: '1 Tom', vibe: 'Dissonante leve. Cria uma bela preparação na melodia e resolve suavemente na terça.' },
  { name: 'Terça Menor (3m)', semitones: 3, type: 'Simples', formula: '1.5 Tons', vibe: 'Consonante. Traz uma cor melancólica, nostálgica ou triste. Define o acorde menor.' },
  { name: 'Terça Maior (3ª)', semitones: 4, type: 'Simples', formula: '2 Tons', vibe: 'Consonante perfeita. Brilhante, alegre e otimista. Define o acorde maior.' },
  { name: 'Quarta Justa (4ª)', semitones: 5, type: 'Simples', formula: '2.5 Tons', vibe: 'Consonante de repouso instável. Na igreja, cria a sonoridade de "suspenso" (sus4).' },
  { name: 'Quarta Aumentada / Quinta Diminuta (Trítono)', semitones: 6, type: 'Simples', formula: '3 Tons', vibe: 'Dissonância extrema! Conhecido historicamente como "o som do diabo". Base de toda tensão do acorde Dominante.' },
  { name: 'Quinta Justa (5ª)', semitones: 7, type: 'Simples', formula: '3.5 Tons', vibe: 'Consonante perfeita. O intervalo mais estável e potente do universo físico. Usado em "power chords".' },
  { name: 'Quinta Aumentada (5#) / Sexta Menor (6b)', semitones: 8, type: 'Simples', formula: '4 Tons', vibe: 'Traz uma tensão flutuante e espacial. Muito comum em arranjos cinematográficos e acordes aumentados.' },
  { name: 'Sexta Maior (6ª)', semitones: 9, type: 'Simples', formula: '4.5 Tons', vibe: 'Consonância imperfeita porém doce. Transmite uma sensação de nostalgia feliz.' },
  { name: 'Sétima Menor (7ª)', semitones: 10, type: 'Simples', formula: '5 Tons', vibe: 'Dissonante moderno. Traz o tempero do Blues e do Gospel Negro, gerando desejo de resolução.' },
  { name: 'Sétima Maior (7M)', semitones: 11, type: 'Simples', formula: '5.5 Tons', vibe: 'Dissonante requintado. Sonoridade de "jazz/worship campestre". Extremamente suave e romântica.' },
  { name: 'Oitava Justa (8ª)', semitones: 12, type: 'Simples', formula: '6 Tons', vibe: 'Consonante perfeita absoluta. A mesma nota em um registro mais agudo.' },
  { name: 'Nona Menor (9b)', semitones: 13, type: 'Composto', formula: '6.5 Tons (8ª + 2b)', vibe: 'Dissonância altamente dramática, excelente para tensionamentos extremos no piano.' },
  { name: 'Nona Maior (9ª)', semitones: 14, type: 'Composto', formula: '7 Tons (8ª + 2ª)', vibe: 'Brilho moderno! O intervalo queridinho do worship (acordes add9). Traz espaço e beleza profunda.' },
  { name: 'Décima Primeira Justa (11ª)', semitones: 17, type: 'Composto', formula: '8.5 Tons (8ª + 4ª)', vibe: 'Sonoridade de flutuação e frescor. Muito comum em acordes com sétima e décima primeira (ex: C7(11)).' },
  { name: 'Décima Primeira Aumentada (11#)', semitones: 18, type: 'Composto', formula: '9 Tons (8ª + Trítono)', vibe: 'Sabor místico e celestial (fórmula Lydian). Sonoridade espacial de trilhas sonoras de ficção.' },
  { name: 'Décima Terceira Maior (13ª)', semitones: 21, type: 'Composto', formula: '10.5 Tons (8ª + 6ª)', vibe: 'Cor rica e encorpada de Bossa Nova e Jazz Contemporâneo, estendendo o limite de cores harmônicas.' }
];

function GuitarChordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* 3 cords */}
      <path d="M7 4v16M12 4v16M17 4v16" strokeWidth="1.5" />
      {/* 4 trastes */}
      <path d="M6 4h12" strokeWidth="3" />
      <path d="M6 9h12" strokeWidth="1.5" />
      <path d="M6 14h12" strokeWidth="1.5" />
      <path d="M6 19h12" strokeWidth="1.5" />
      {/* Fingering positions/dots */}
      <circle cx="7" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.5" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="6.5" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function TheoryStudyView() {
  const [activeTab, setActiveTab] = useState<'intervalos' | 'campo' | 'inversoes' | 'funcoes' | 'cadencias' | 'modal' | 'subst' | 'quiz'>('intervalos');
  
  // Interactive interval simulator states
  const [intervalRoot, setIntervalRoot] = useState<string>('C');
  const [selectedIntervalIndex, setSelectedIntervalIndex] = useState<number>(3); // Decides Terça Maior default (4 semitones)
  
  const rootIdx = CHORD_CIRCLE.indexOf(intervalRoot);
  const targetNote = rootIdx !== -1 
    ? CHORD_CIRCLE[(rootIdx + INTERVALS_LIST[selectedIntervalIndex].semitones) % 12] 
    : '';
  
  
  // Interactive simulator states
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [showMinorField, setShowMinorField] = useState<boolean>(false);

  // Quiz states
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Audio/visual progression simulation states
  const [activeProgressionId, setActiveProgressionId] = useState<number | null>(null);
  const [currentProgStep, setCurrentProgStep] = useState<number>(0);
  const [isProgPlaying, setIsProgPlaying] = useState<boolean>(false);

  // Inversion playground states
  const [inversionChordType, setInversionChordType] = useState<'C' | 'G' | 'C7M'>('C');
  const [currentInversionLevel, setCurrentInversionLevel] = useState<'fundamental' | 'primeira' | 'segunda' | 'terceira'>('fundamental');

  const currentInvertedChord = inversionChordType === 'C' ? (
    currentInversionLevel === 'fundamental' ? 'C' :
    currentInversionLevel === 'primeira' ? 'C/E' : 'C/G'
  ) : inversionChordType === 'G' ? (
    currentInversionLevel === 'fundamental' ? 'G' :
    currentInversionLevel === 'primeira' ? 'G/B' : 'G/D'
  ) : (
    currentInversionLevel === 'fundamental' ? 'C7M' :
    currentInversionLevel === 'primeira' ? 'C7M/E' :
    currentInversionLevel === 'segunda' ? 'C7M/G' : 'C7M/B'
  );

  const quizQuestions = [
    {
      question: "Qual das seguintes funções harmônicas expressa a máxima sensação de estabilidade, repouso e finalização na música tonal?",
      options: ["Função Dominante", "Função Subdominante", "Função Tônica", "Função de Empréstimo Modal"],
      correct: 2,
      explanation: "A função Tônica representa o repouso absoluto, ponto de partida e de conclusão da jornada harmônica."
    },
    {
      question: "No campo harmônico de Dó Maior (C), qual é o acorde do quinto grau (V7) e qual é a sua respectiva função harmônica?",
      options: ["F7M - Subdominante", "G7 - Dominante", "Am7 - Tônica", "Dm7 - Dominante"],
      correct: 1,
      explanation: "O quinto grau de Dó maior é Sol (G). Por ser um acorde maior com sétima menor (G7), ele atua como a Dominante principal, criando o trítono de resolução."
    },
    {
      question: "O acorde de 'Fm7' (Fm com sétima) sendo tocado em uma música originalmente escrita no tom de Dó Maior (C) é um exemplo clássico de quê?",
      options: ["Acorde Dominante Secundário", "Segundo Grau Relativo", "Empréstimo Modal do homônimo menor (Dó menor)", "Substituto de Trítono (SubV7)"],
      correct: 2,
      explanation: "O Fm7 é o quarto menor (IVm7), importado da escala menor paralela (Dó menor natural). Isso caracteriza um clássico Empréstimo Modal (A.E.M.)."
    },
    {
      question: "A clássica cadência muito utilizada no Louvor congregacional (I - V - VIm - IV) em Dó Maior corresponde a quais acordes?",
      options: ["C - G - Am - F", "C - Dm - Em - F", "G - D - Em - C", "D - A - Bm - G"],
      correct: 0,
      explanation: "Em Dó Maior (C), Grau I é C, Grau V é G, Grau VIm é Am, e Grau IV é F. Esta é a progressão pop/gospel mais tocada no mundo."
    },
    {
      question: "O que é um acorde SubV7 (Substituto de Trítono) e qual é o seu objetivo principal?",
      options: [
        "Um acorde menor que substitui o primeiro grau",
        "Um acorde maior com sétima menor posicionado meio-tom acima do acorde de destino, partilhando o mesmo trítono",
        "Uma cadência plagal usada para encerrar orações e hinos",
        "Um acorde diminuto usado para modular para tons vizinhos"
      ],
      correct: 1,
      explanation: "O SubV7 fica meio tom acima do destino (por exemplo, Db7 resolvendo em C). Ele divide exatamente os mesmos sons de trítono que a dominante principal (G7), oferecendo um som cromático ultra sofisticado."
    },
    {
      question: "Qual é o intervalo medido por uma distância de exatamente 6 semitons (3 tons inteiros), famoso historicamente como o 'som extremamente tenso'?",
      options: ["Quinta Justa (5ª)", "Terça Maior (3ª)", "Quarta Aumentada / Quinta Diminuta (Trítono)", "Sétima Menor (7ª)"],
      correct: 2,
      explanation: "O Trítono é composto por 3 tons inteiros (6 semitons). É um intervalo de extrema tensão harmônica que serve de base para os acordes dominantes."
    },
    {
      question: "Qual é a classificação e a correspondência simples de um intervalo composto de 'Nona Maior' (9ª)?",
      options: [
        "É um intervalo composto, correspondente a uma Segunda Maior (2ª) uma oitava acima",
        "É um intervalo simples, equivalente a uma Quarta Justa (4ª)",
        "É um intervalo composto, correspondente a uma Terça Maior (3ª)",
        "É um intervalo simples, equivalente a uma Quinta Justa (5ª)"
      ],
      correct: 0,
      explanation: "Para achar a correspondência simples de um intervalo composto, subtraímos 7 (9 - 7 = 2). Portanto, a Nona Maior corresponde a uma Segunda Maior uma oitava acima (afastada por 14 semitons ou 7 tons)."
    },
    {
      question: "Quando tocamos o acorde de C (Dó Maior) com a nota Mi (E) na ponta mais grave do baixo (C/E), dizemos que o acorde está em qual inversão?",
      options: ["Posição Fundamental", "Primeira Inversão", "Segunda Inversão", "Terceira Inversão"],
      correct: 1,
      explanation: "Como a nota Mi (E) é a terça de Dó Maior (C - E - G), colocá-la no baixo coloca o acorde na Primeira Inversão. A nota baixo passa a ser a 3ª do acorde."
    },
    {
      question: "A Terceira Inversão de um acorde de Tétrade (acorde com sétima, ex: C7M/B) ocorre quando qual grau está posicionado no baixo?",
      options: ["A Sétima (7ª) do acorde", "A Quinta (5ª) do acorde", "A Terça (3ª) do acorde", "A Tônica do acorde"],
      correct: 0,
      explanation: "Nas tétrades compostas por Fundamental (Tônica), Terça (3ª), Quinta (5ª) e Sétima (7ª): a 1ª inversão tem a 3ª no baixo, a 2ª inversão tem a 5ª no baixo, e a 3ª inversão tem a 7ª no baixo."
    },
    {
      question: "Na transição harmônica de Dó Maior para Lá Menor, ao usarmos um baixo descendente como 'C → C/B → Am', qual é o papel do acorde intermediário C/B ou C7M/B?",
      options: [
        "Um acorde menor substituto da tônica",
        "O acorde de Dó Maior em sua terceira inversão, onde a sétima maior (Si) está no baixo, criando uma linha de baixo melódica e fluida",
        "Um acorde dominante secundário que prepara para Sol Maior",
        "Um empréstimo modal para modular para outra escala"
      ],
      correct: 1,
      explanation: "O acorde C/B (ou C7M/B) possui a sétima maior (B) no baixo. Trata-se da Terceira Inversão do acorde de tétrade C7M, fornecendo um caminho melódico suave para o baixo descer por graus conjuntos de C para B e depois para A (Am)."
    }
  ];

  const classicProgressions = [
    {
      id: 1,
      name: "Cadência II - V - I (Jazz & MPB Sofisticado)",
      chords: ['Dm7', 'G7', 'C7M'],
      intervals: [1500, 1500, 2000],
      functions: ['Subdominante (Preparação)', 'Dominante (Tensão Máxima)', 'Tônica (Resolução / Descanso)'],
      description: "A cadência mais famosa da música ocidental. Começa com uma tensão amigável, migra para a máxima tensão e resolve em paz absoluta na tônica."
    },
    {
      id: 2,
      name: "Progressão de Ouro do Louvor (I - V - VIm - IV)",
      chords: ['C', 'G', 'Am', 'F'],
      intervals: [1200, 1200, 1200, 1200],
      functions: ['Tônica (Casa)', 'Dominante (Decolar)', 'Tônica Menor (Contemplativo)', 'Subdominante (Entrega)'],
      description: "Responsável por centenas de hinos lendários como 'Ousado Amor', 'Alvo Mais que a Neve' e 'Aclame ao Senhor'."
    }
  ];

  // Helper calculation for harmonic fields
  const calculateHarmonicField = (key: string, isMinor: boolean): ChordDegree[] => {
    const startIdx = CHORD_CIRCLE.indexOf(key);
    if (startIdx === -1) return [];

    const field: ChordDegree[] = [];
    const intervals = isMinor ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;

    const minorSuffixes = ['m7', 'm7(b5)', '7M', 'm7', 'm7', '7M', '7'];
    const minorDegrees = ['Im7', 'IIm7(b5)', 'III7M', 'IVm7', 'Vm7', 'VI7M', 'VII7'];
    const minorFuncs: ('Tônica' | 'Subdominante' | 'Dominante')[] = [
      'Tônica', 'Subdominante', 'Tônica', 'Subdominante', 'Dominante', 'Subdominante', 'Dominante'
    ];
    const minorDescs = [
      'Lar e estabilidade da tonalidade menor.',
      'Tensão intermediária, carrega o trítono secundário.',
      'A relativa maior do tom menor, traz brilho e esperança.',
      'Movimento introspectivo e profundo do tom menor.',
      'Tensão melódica menor.',
      'Sabor de ascensão mística ou drama.',
      'Subtom, ponte perfeita para o retorno à tônica.'
    ];

    for (let i = 0; i < 7; i++) {
      const idx = (startIdx + intervals[i]) % 12;
      const rootNote = CHORD_CIRCLE[idx];
      
      if (isMinor) {
        field.push({
          degree: minorDegrees[i],
          chord: `${rootNote}${minorSuffixes[i]}`,
          functionType: minorFuncs[i],
          description: minorDescs[i]
        });
      } else {
        const conf = DEGREES_MAJOR_CHORDS[i];
        field.push({
          degree: conf.deg,
          chord: `${rootNote}${conf.quality}`,
          functionType: conf.func as any,
          description: conf.desc
        });
      }
    }

    return field;
  };

  const getThemeBadge = (func: 'Tônica' | 'Subdominante' | 'Dominante') => {
    switch (func) {
      case 'Tônica':
        return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20';
      case 'Subdominante':
        return 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20';
      case 'Dominante':
        return 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20';
    }
  };

  const handleAnswerSubmit = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    if (optionIndex === quizQuestions[currentQuizIndex].correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  // Run visual chord progression simulation
  const playProgression = (id: number) => {
    if (isProgPlaying) return;
    const prog = classicProgressions.find(p => p.id === id);
    if (!prog) return;

    setActiveProgressionId(id);
    setIsProgPlaying(true);
    setCurrentProgStep(0);

    const stepIntervals = prog.intervals;
    let step = 0;

    const playNext = () => {
      if (step < prog.chords.length - 1) {
        step++;
        setCurrentProgStep(step);
        setTimeout(playNext, stepIntervals[step]);
      } else {
        setTimeout(() => {
          setIsProgPlaying(false);
          setActiveProgressionId(null);
          setCurrentProgStep(0);
        }, 1500);
      }
    };

    setTimeout(playNext, stepIntervals[0]);
  };

  const currentHarmonicField = calculateHarmonicField(selectedKey, showMinorField);

  return (
    <div className="w-full space-y-6">
      {/* Upper Brand Info Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/45 to-slate-800/25 dark:from-zinc-900/50 dark:to-zinc-850/10 border border-border p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-[200px] h-[100px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[50px] pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-550 dark:text-indigo-400 shrink-0 shadow-lg">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-main dark:text-white uppercase tracking-tight flex items-center gap-2">
              Academia de Teoria Musical <Sparkles size={22} className="text-indigo-400 animate-pulse" />
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-text-main dark:text-white mt-2.5 font-semibold max-w-[850px] leading-relaxed">
              O espaço definitivo para você dominar harmonia, entender arranjos e tocar com excelência, propósito e alto conhecimento teórico.
            </p>
          </div>
        </div>
      </div>

      {/* Chapters Selector Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button 
          onClick={() => setActiveTab('intervalos')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'intervalos' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Sliders size={20} />
          <span>Intervalos</span>
        </button>
        <button 
          onClick={() => setActiveTab('campo')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'campo' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Guitar size={20} />
          <span>Campo Harmônico</span>
        </button>
        <button 
          onClick={() => setActiveTab('inversoes')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'inversoes' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <GuitarChordIcon className="w-5 h-5 text-current" />
          <span>Inversões de Acordes</span>
        </button>
        <button 
          onClick={() => setActiveTab('funcoes')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'funcoes' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Music size={20} />
          <span>Funções Modernas</span>
        </button>
        <button 
          onClick={() => setActiveTab('cadencias')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'cadencias' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Music2 size={20} />
          <span>Cadências Harmônicas</span>
        </button>
        <button 
          onClick={() => setActiveTab('modal')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'modal' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Piano size={20} />
          <span>E.M. (Emp. Modal)</span>
        </button>
        <button 
          onClick={() => setActiveTab('subst')}
          className={`p-4 rounded-2xl border font-black text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'subst' 
              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Music3 size={20} />
          <span>Dominantes & SubV</span>
        </button>
        <button 
          onClick={() => setActiveTab('quiz')}
          className={`p-4 rounded-2xl border font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer ${
            activeTab === 'quiz' 
              ? 'bg-emerald-600 border-transparent text-white shadow-lg shadow-emerald-500/20 font-black scale-[1.02]' 
              : 'bg-card hover:bg-black/5 dark:hover:bg-white/5 border-border text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
          }`}
        >
          <Award size={20} />
          <span>Auto-Desafio</span>
        </button>
      </div>

      {/* Main Chapter Viewer Area */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 min-h-[420px] shadow-xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* Chapter 0 (Pre-req): Intervalos Musicais */}
          {activeTab === 'intervalos' && (
            <motion.div
              key="intervalos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-505 dark:text-indigo-400 tracking-widest block mb-1.5">Fundamento Prévio (Módulo 0)</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Sliders className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  Intervalos Musicais: O alicerce de tudo
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  O intervalo musical é a **distância de altura entre dois sons**. Absolutamente tudo na teoria — escalas, formação de acordes, campos harmônicos, e arranjos — decorre unicamente dos intervalos. Compreender os intervalos é dar olhos aos seus ouvidos e controle absoluto aos seus dedos.
                </p>
              </div>

              {/* Explanatory blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-zinc-500/5 dark:bg-zinc-850/35 border border-border rounded-2xl space-y-3.5 shadow-sm">
                  <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    Medindo Distâncias: Tons e Semitons
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Na música ocidental, a menor distância padrão entre duas notas é o **Semitom** (ou Meio Tom).
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-text-muted dark:text-white font-normal">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-550 dark:text-indigo-455 font-bold">•</span>
                      <span><strong>Semitom (ST)</strong>: Equivale a andar 1 traste no violão ou apertar a tecla imediatamente vizinha no teclado (ex: de <code>C</code> para <code>C#</code> ou de <code>E</code> para <code>F</code>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-550 dark:text-indigo-455 font-bold">•</span>
                      <span><strong>Tom (T)</strong>: Equivale à união de dois semitons (2 ST). Representa pular 2 trastes na guitarra ou duas notas no teclado (ex: de <code>C</code> para <code>D</code>).</span>
                    </li>
                  </ul>
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/20 leading-relaxed">
                    <strong>Atenção às exceções:</strong> Não existem teclas pretas entre as notas <strong>Mi (E) e Fá (F)</strong> and entre <strong>Si (B) e Dó (C)</strong>. A distância natural entre elas é de apenas 1 Semitom (ST)!
                  </p>
                </div>

                <div className="p-6 bg-zinc-500/5 dark:bg-zinc-850/35 border border-border rounded-2xl space-y-3.5 shadow-sm">
                  <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Intervalos Simples vs. Compostos
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Dependendo de estarem contidos em uma oitava ou irem além, classificamos em simples ou compostos:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-text-muted dark:text-white font-normal">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-555 dark:text-emerald-450 font-bold">•</span>
                      <span><strong>Intervalos Simples</strong>: Estão dentro do limite de uma oitava (12 semitons). Vão da tônica até a Oitava Justa (Ex: 2ª, 3ª, 4ª, 5ª, 6ª, 7ª, 8ª).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-555 dark:text-emerald-450 font-bold">•</span>
                      <span><strong>Intervalos Compostos</strong>: Ultrapassam o limite de uma oitava (mais de 12 semitons). Are a chamadas **extensões** modernas fundamentais no altar e teclado de worship (Ex: Nona - 9ª, Sétima com Décima Primeira - 11ª, Décima Terceira - 13ª).</span>
                    </li>
                  </ul>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white font-normal bg-zinc-500/5 dark:bg-zinc-800/20 p-3 rounded-lg border border-border">
                    <em>*Para obter a correspondência simples de um intervalo composto, basta subtrair 7 (Ex: 9ª - 7 = 2ª; 11ª - 7 = 4ª).*</em>
                  </p>
                </div>
              </div>

              {/* Guide card */}
              <div className="bg-slate-500/5 dark:bg-zinc-800/15 border border-border p-6 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-sm sm:text-base text-text-main dark:text-white uppercase tracking-wider">
                  Guia Rápido de Tabela de Semitons (Graus Simples)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">1 ST</span>
                    <span className="text-text-muted dark:text-white">Segunda Menor (2b)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">2 ST</span>
                    <span className="text-text-muted dark:text-white">Segunda Maior (2ª)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">3 ST</span>
                    <span className="text-text-muted dark:text-white">Terça Menor (3m)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">4 ST</span>
                    <span className="text-text-muted dark:text-white">Terça Maior (3ª)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">5 ST</span>
                    <span className="text-text-muted dark:text-white">Quarta Justa (4ª)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">6 ST</span>
                    <span className="text-text-muted dark:text-white">Trítono (4# / 5b)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">7 ST</span>
                    <span className="text-text-muted dark:text-white">Quinta Justa (5ª)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">8 ST</span>
                    <span className="text-text-muted dark:text-white">Sexta Menor (6b)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">9 ST</span>
                    <span className="text-text-muted dark:text-white">Sexta Maior (6ª)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">10 ST</span>
                    <span className="text-text-muted dark:text-white">Sétima Menor (7ª)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">11 ST</span>
                    <span className="text-text-muted dark:text-white">Sétima Maior (7M)</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-xl flex justify-between shadow-sm">
                    <span className="font-bold text-indigo-550 dark:text-indigo-400">12 ST</span>
                    <span className="text-text-muted dark:text-white">Oitava Justa (8ª)</span>
                  </div>
                </div>
              </div>

              {/* Interactive Widget */}
              <div className="bg-indigo-500/5 dark:bg-zinc-805/30 border border-indigo-500/25 p-5 sm:p-7 rounded-3xl space-y-6">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider block mb-1">Laboratório Prático</span>
                  <h3 className="font-extrabold text-lg sm:text-xl text-text-main dark:text-white flex items-center gap-2">
                    <Sliders size={20} className="text-indigo-400 shrink-0" />
                    Simulador Interativo de Intervalos
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white">
                    Selecione uma nota de partida (Tônica) e a distância desejada para ver o intervalo calculado na hora, medido em tons e com sua respectiva energia tonal!
                  </p>
                </div>

                {/* Selectors rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-550 dark:text-zinc-400 tracking-wider block select-none">1. NOTA DE PARTIDA (Tônica)</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl">
                      {CHORD_CIRCLE.map((note) => (
                        <button
                          key={`interval-root-${note}`}
                          type="button"
                          onClick={() => setIntervalRoot(note)}
                          className={`w-9 h-9 font-black text-xs sm:text-sm rounded-lg transition-all cursor-pointer ${
                            intervalRoot === note 
                              ? 'bg-indigo-600 text-white scale-[1.05] shadow-md shadow-indigo-600/25' 
                              : 'hover:bg-black/10 dark:hover:bg-white/5 text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
                          }`}
                        >
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-zinc-550 dark:text-zinc-400 tracking-wider block select-none">2. ESCOLHA O INTERVALO DESEJADO</label>
                    <select
                      value={selectedIntervalIndex}
                      onChange={(e) => setSelectedIntervalIndex(Number(e.target.value))}
                      className="w-full bg-card border border-border rounded-xl p-3 text-sm font-bold text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                      {INTERVALS_LIST.map((intVal, index) => (
                        <option key={index} value={index}>
                          {intVal.name} ({intVal.type}) — {intVal.formula}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interval Calculation Outputs */}
                <div className="p-5 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-center gap-6 justify-between shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-emerald-500" />
                  
                  <div className="flex items-center gap-5">
                    {/* Visual output circle of Root Note */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-550 dark:text-zinc-400 mb-1.5 select-none text-center">Início</span>
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-mono font-black text-lg text-indigo-600 dark:text-indigo-400 shadow-sm animate-none">
                        {intervalRoot}
                      </div>
                    </div>

                    <div className="flex flex-col items-center select-none font-black text-zinc-450 dark:text-zinc-500">
                      <span className="text-[9px] uppercase tracking-wider mb-2">{INTERVALS_LIST[selectedIntervalIndex].formula}</span>
                      <ArrowRight size={20} className="animate-pulse text-indigo-550 dark:text-indigo-400" />
                    </div>

                    {/* Visual output circle of Target Note */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400 mb-1.5 select-none text-center">Fim</span>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 shadow-sm animate-none">
                        {targetNote}
                      </div>
                    </div>
                  </div>

                  {/* Vibe and description box */}
                  <div className="flex-1 space-y-1.5 md:pl-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 w-full">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{INTERVALS_LIST[selectedIntervalIndex].name}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-border rounded-md text-zinc-700 dark:text-zinc-300">
                        {INTERVALS_LIST[selectedIntervalIndex].type}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                      {INTERVALS_LIST[selectedIntervalIndex].vibe}
                    </p>
                  </div>
                </div>

                {/* Animated Piano Representation of Root and Interval Note */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-white block mb-1">Visualização Didática no Piano</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 animate-pulse">Deslize para o lado ↔</span>
                  </div>
                  <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex items-center justify-start md:justify-center overflow-x-auto select-none scrollbar-thin">
                    <div className="flex relative shrink-0" style={{ height: '115px' }}>
                      {(() => {
                        const rootOffset = CHORD_CIRCLE.indexOf(intervalRoot);
                        const targetOffset = rootOffset + INTERVALS_LIST[selectedIntervalIndex].semitones;

                        // Function to determine note type (black/white) and standard C-based semitones
                        const getNoteDetails = (semitoneFromC: number) => {
                          const noteIndex = semitoneFromC % 12;
                          const noteName = CHORD_CIRCLE[noteIndex];
                          const isBlack = noteName.includes('#');
                          return { noteName, isBlack };
                        };

                        // Render a gorgeous piano keys structure with balanced size for mobile devices
                        const whiteKeysSec: any[] = [];
                        const blackKeysSec: any[] = [];
                        let whiteIndex = 0;

                        const whiteKeyWidth = 23;
                        const whiteKeyHeight = 100;
                        const blackKeyWidth = 14;
                        const blackKeyHeight = 62;
                        const blackKeyOffset = whiteKeyWidth - (blackKeyWidth / 2); // 23 - 7 = 16px

                        // Go up to 36 notes (3 full octaves: 0 to 35 semitones) so any root starting note and its corresponding 13th extension fits!
                        for (let s = 0; s < 36; s++) {
                          const { noteName, isBlack } = getNoteDetails(s);
                          const isRoot = s === rootOffset;
                          const isTarget = s === targetOffset;

                          if (isBlack) {
                            let wLeftIdx = 0;
                            const cycle = Math.floor(s / 12);
                            const rem = s % 12;
                            if (rem === 1) wLeftIdx = 0;
                            else if (rem === 3) wLeftIdx = 1;
                            else if (rem === 6) wLeftIdx = 3;
                            else if (rem === 8) wLeftIdx = 4;
                            else if (rem === 10) wLeftIdx = 5;
                            
                            const absoluteWhiteIndex = wLeftIdx + (cycle * 7);
                            const leftPos = (absoluteWhiteIndex * whiteKeyWidth) + blackKeyOffset;

                            blackKeysSec.push(
                              <div
                                key={`piano-s-${s}`}
                                style={{ left: `${leftPos}px`, width: `${blackKeyWidth}px`, height: `${blackKeyHeight}px` }}
                                className={`absolute z-20 rounded-b transition-all border border-black/80 flex flex-col items-center justify-end pb-1.5 shadow-md ${
                                  isRoot 
                                    ? 'bg-indigo-600 border-indigo-700 text-white font-bold' 
                                    : isTarget
                                    ? 'bg-emerald-500 border-emerald-600 text-white font-bold'
                                    : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border-zinc-950'
                                }`}
                              >
                                <span className={`text-[9px] font-sans font-black select-none tracking-tighter block mb-0.5 leading-none ${
                                  (isRoot || isTarget) ? 'text-white' : 'text-zinc-500'
                                }`}>{noteName}</span>
                                {isRoot && <span className="text-[7.5px] font-black text-white leading-none">T</span>}
                                {isTarget && <span className="text-[7.5px] font-black text-white leading-none">I</span>}
                              </div>
                            );
                          } else {
                            const leftPos = whiteIndex * whiteKeyWidth;
                            whiteKeysSec.push(
                              <div
                                key={`piano-s-${s}`}
                                style={{ left: `${leftPos}px`, width: `${whiteKeyWidth}px`, height: `${whiteKeyHeight}px` }}
                                className={`absolute z-10 border border-zinc-300 rounded-b shadow-sm transition-all flex flex-col items-center justify-end pb-2 ${
                                  isRoot 
                                    ? 'bg-indigo-600 border-indigo-700 text-white font-black' 
                                    : isTarget
                                    ? 'bg-emerald-500 border-emerald-600 text-white font-black'
                                    : 'bg-white hover:bg-stone-50 border-stone-200 text-zinc-800'
                                }`}
                              >
                                <span className={`text-[10px] font-sans font-black select-none block tracking-tighter leading-none ${
                                  (isRoot || isTarget) ? 'text-white' : 'text-zinc-800'
                                }`}>{noteName}</span>
                                {isRoot && <span className="text-[8.5px] font-black uppercase text-white leading-none mt-1">Ton</span>}
                                {isTarget && <span className="text-[8.5px] font-black uppercase text-white leading-none mt-1">Int</span>}
                              </div>
                            );
                            whiteIndex++;
                          }
                        }

                        return (
                          <div className="relative shrink-0" style={{ width: `${whiteIndex * whiteKeyWidth}px`, height: `${whiteKeyHeight + 5}px` }}>
                            {whiteKeysSec}
                            {blackKeysSec}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-mono text-text-muted dark:text-white uppercase tracking-wider select-none">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></span> Nota de Partida (Tônica / Fundamental)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Nota Resultante (Intervalo Escolhido)</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Chapter 1: Campo Harmônico */}
          {activeTab === 'campo' && (
            <motion.div
              key="campo"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-505 dark:text-indigo-400 tracking-widest block mb-1.5">Capítulo 1</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Guitar className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  O que é Campo Harmônico?
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  O campo harmônico é o conjunto de acordes formados a partir das notas de uma determinada escala. Em termos simples, é como uma "família" de acordes que naturalmente soam bem juntos, pois todos compartilham as mesmas notas musicais e servem de base para compor ou tocar músicas em um mesmo tom.
                </p>
              </div>

              {/* Formula de Escala Maior Section */}
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white flex items-center gap-2">
                  A Fórmula da Escala Maior
                </h3>
                <p className="text-sm text-text-muted dark:text-white leading-relaxed">
                  A escala maior natural segue rigorosamente a fórmula de intervalos baseada em tons (T) e semitons (ST):
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 py-3 px-4 bg-white/40 dark:bg-zinc-950/45 border border-emerald-505/15 rounded-xl font-mono text-xs sm:text-sm shadow-sm select-none">
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/75 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-250 dark:border-emerald-900/50">Tom</span>
                  <span className="text-zinc-450 dark:text-zinc-500 font-bold">—</span>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/75 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-250 dark:border-emerald-900/50">Tom</span>
                  <span className="text-zinc-450 dark:text-zinc-500 font-bold">—</span>
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/75 text-amber-800 dark:text-amber-305 font-bold rounded-lg border border-amber-250 dark:border-amber-900/50">Semitom</span>
                  <span className="text-zinc-450 dark:text-zinc-500 font-bold">—</span>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/75 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-250 dark:border-emerald-900/50">Tom</span>
                  <span className="text-zinc-450 dark:text-zinc-500 font-bold">—</span>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/75 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-250 dark:border-emerald-900/50">Tom</span>
                  <span className="text-zinc-450 dark:text-zinc-500 font-bold">—</span>
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/75 text-emerald-800 dark:text-emerald-350 font-bold rounded-lg border border-emerald-250 dark:border-emerald-900/50">Tom</span>
                  <span className="text-zinc-450 dark:text-zinc-500 font-bold">—</span>
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/75 text-amber-800 dark:text-amber-305 font-bold rounded-lg border border-amber-250 dark:border-amber-900/50">Semitom</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted dark:text-white mt-2 leading-relaxed">
                  Empilhando terças sobre cada uma dessas notas, criamos acordes maiores, menores e um acorde diminuto/meio-diminuto na sétima posição.
                </p>
              </div>

                {/* Practical stacking visualization */}
                <div className="mt-4 p-4 sm:p-5 bg-emerald-500/5 dark:bg-emerald-950/30 border border-emerald-500/15 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-650 dark:text-emerald-400">
                    Exemplo na Prática: Construindo Acordes na Escala de Dó Maior (C)
                  </h4>
                  
                  {/* Scale with chosen notes shown visually */}
                  <div className="space-y-3 overflow-x-auto pb-1">
                    <p className="text-xs text-text-muted dark:text-white leading-normal">
                      Note abaixo a alternância na seleção (pula-se sempre uma nota intermedia para obter a terça seguinte):
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm min-w-[340px]">
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-905/50 shadow-sm">C</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-black">1ª (Tônica)</span>
                      </div>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">→</span>
                      <div className="flex flex-col items-center opacity-40">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-border">D</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-bold">2ªM</span>
                      </div>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">→</span>
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-905/50 shadow-sm">E</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-black">3ªM</span>
                      </div>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">→</span>
                      <div className="flex flex-col items-center opacity-40">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-border">F</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-bold">4ªJ</span>
                      </div>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">→</span>
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-905/50 shadow-sm">G</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-black">5ªJ</span>
                      </div>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">→</span>
                      <div className="flex flex-col items-center opacity-40">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-border">A</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-bold">6ªM</span>
                      </div>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">→</span>
                      <div className="flex flex-col items-center">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-905/50 shadow-sm">B</span>
                        <span className="text-[9px] sm:text-[10px] text-zinc-650 dark:text-zinc-300 mt-1 font-sans font-black">7ªM</span>
                      </div>
                    </div>
                  </div>

                  {/* Triad vs Tetrad details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-border rounded-xl space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Tríade (Básico)</span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-350 text-[10px] font-black rounded-md">Acorde C</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-wider">C — E — G</p>
                      <p className="text-xs text-text-muted dark:text-white leading-relaxed font-normal">
                        Formado ao empilhar <strong>Tônica (1ª)</strong>, <strong>Terça (3ª)</strong> e <strong>Quinta (5ª)</strong>. Sonoridade pura e direta.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-border rounded-xl space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Tétrade (Avançado)</span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-350 text-[10px] font-black rounded-md">Acorde C7M</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-wider">C — E — G — B</p>
                      <p className="text-xs text-text-muted dark:text-white leading-relaxed font-normal">
                        Adiciona a <strong>Sétima Maior (B)</strong> ao empilhamento anterior, criando o requinte harmônico ideal para música congregacional.
                      </p>
                    </div>
                  </div>
                </div>

              {/* Simulation Widget */}
              <div className="bg-slate-500/5 dark:bg-zinc-800/15 border border-border p-6 rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white flex items-center gap-2">
                      <Guitar size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                      Visualizador Dinâmico de Campo Harmônico
                    </h3>
                    <p className="text-xs sm:text-sm text-text-muted dark:text-white">Selecione uma tonalidade para analisar a estrutura exata de acordes e graus.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg bg-black/10 dark:bg-white/10 border border-border p-1">
                      <button 
                        type="button"
                        onClick={() => setShowMinorField(false)}
                        className={`px-3.5 py-1.5 text-xs font-extrabold rounded-md cursor-pointer transition-all ${!showMinorField ? 'bg-indigo-600 text-white shadow-sm scale-105' : 'text-text-muted dark:text-slate-200 hover:text-text-main'}`}
                      >
                        Campo Maior
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowMinorField(true)}
                        className={`px-3.5 py-1.5 text-xs font-extrabold rounded-md cursor-pointer transition-all ${showMinorField ? 'bg-indigo-600 text-white shadow-sm scale-105' : 'text-text-muted dark:text-slate-200 hover:text-text-main'}`}
                      >
                        Menor Natural
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Picker Circles */}
                <div className="flex flex-wrap gap-2 p-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl">
                  {CHORD_CIRCLE.map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className={`w-11 h-11 font-black text-sm sm:text-base rounded-lg transition-all cursor-pointer ${
                        selectedKey === key 
                          ? 'bg-indigo-600 text-white scale-[1.08] shadow-md shadow-indigo-600/35' 
                          : 'hover:bg-black/10 dark:hover:bg-white/5 text-text-muted dark:text-slate-200 hover:text-text-main dark:hover:text-white'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Simulated Chords Representation */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                  {currentHarmonicField.map((chordDegree, idx) => (
                    <div 
                      key={idx} 
                      className="bg-card border border-border p-5 rounded-2xl flex flex-col items-center justify-between text-center min-h-[140px] hover:border-indigo-500/30 dark:hover:border-indigo-500/40 hover:shadow-lg transition-all group"
                    >
                      <span className="text-xs font-mono text-text-muted dark:text-white font-black tracking-widest uppercase">{chordDegree.degree}</span>
                      <span className="text-lg sm:text-xl font-black text-text-main dark:text-white group-hover:scale-105 tracking-tight transition-transform">{chordDegree.chord}</span>
                      <span className={`text-[10px] sm:text-xs px-2.5 py-1 font-extrabold rounded-full mt-2 block shadow-sm ${getThemeBadge(chordDegree.functionType)}`}>
                        {chordDegree.functionType}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs sm:text-sm leading-relaxed text-text-muted dark:text-white flex gap-3.5 items-start">
                  <Info size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-text-main dark:text-white block mb-0.5">Como usar o Campo no Altar:</span> Ao ministrar ou repassar músicas, evite tentar "adivinhar" o próximo acorde ou sofrer com tonalidades distantes. 90% das músicas tradicionais e de adoração usarão estritamente os graus exibidos acima. Se o ministro pedir para subir ou mudar o tom, os graus relativos continuam os mesmos!
                  </div>
                </div>
              </div>

              {/* Explanatory Content */}
              <div className="pt-4">
                <div className="bg-slate-500/5 dark:bg-zinc-850/30 border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white flex items-center gap-2">
                    A Estrutura Padrão dos Graus
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Ao empilhar terças sobre cada grau da escala maior natural, determinamos a qualidade harmônica de cada posição de forma universal:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm sm:text-base font-semibold text-text-muted dark:text-white mt-2">
                    <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 shadow-sm">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-base sm:text-lg block tracking-wider">I, IV, V</span>
                      <span className="text-xs sm:text-sm text-text-muted dark:text-white font-normal block leading-relaxed">Se tornam sempre acordes <strong>Maiores</strong> (fornecem Estabilidade e Tensão).</span>
                    </div>
                    <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5 shadow-sm">
                      <span className="text-blue-600 dark:text-blue-400 font-black text-base sm:text-lg block tracking-wider">II, III, VI</span>
                      <span className="text-xs sm:text-sm text-text-muted dark:text-white font-normal block leading-relaxed">Se tornam sempre acordes <strong>Menores</strong> (fornecem Contemplação e Contraste).</span>
                    </div>
                    <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 shadow-sm">
                      <span className="text-amber-600 dark:text-amber-400 font-black text-base sm:text-lg block tracking-wider">VII</span>
                      <span className="text-xs sm:text-sm text-text-muted dark:text-white font-normal block leading-relaxed">Se torna um acorde <strong>Meio-Diminuto</strong> (extremamente instável e de transição).</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter: Inversões de Acordes */}
          {activeTab === 'inversoes' && (
            <motion.div
              key="inversoes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest block mb-1.5">Estudo Especial</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Layers className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  Inversões de Acordes
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  A inversão de acordes ocorre quando a nota mais grave (o "baixo") de um acorde não é a sua tônica (a nota que dá nome ao acorde), mas sim a sua terça, quinta ou sétima. Isso altera a sonoridade do acorde mantendo as mesmas notas.
                </p>
              </div>

              {/* Informational Cards explaining inversions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm sm:text-base font-semibold text-text-muted dark:text-white">
                <div className="p-5 bg-zinc-500/5 dark:bg-zinc-800/15 border border-border rounded-2xl space-y-2 shadow-sm">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Base Padrão</span>
                  <span className="text-base font-extrabold text-text-main dark:text-white block">Estado Fundamental</span>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white font-normal leading-relaxed">
                    A <strong>Tônica (I)</strong> fica no baixo. É a sustentação pura e tradicional do acorde, que carrega máxima estabilidade e peso mecânico.
                  </p>
                </div>
                <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 shadow-sm">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">1ª Inversão</span>
                  <span className="text-base font-extrabold text-text-main dark:text-white block">Baixo na Terça (3ª)</span>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white font-normal leading-relaxed">
                    A <strong>Terça (3ª)</strong> assume o papel mais grave. Traz um som mais leve e direcional, excelente para preparar subidas cromáticas (ex: <code>C/E → F</code>).
                  </p>
                </div>
                <div className="p-5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2 shadow-sm">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">2ª Inversão</span>
                  <span className="text-base font-extrabold text-text-main dark:text-white block">Baixo na Quinta (5ª)</span>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white font-normal leading-relaxed">
                    A <strong>Quinta (5ª)</strong> assume o baixo. Soa um pouco instável ou "no ar", pedindo resolução. Muito usada como "quarta-e-sexta" cadencial (ex: <code>C/G → G → C</code>).
                  </p>
                </div>
                <div className="p-5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 shadow-sm">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">3ª Inversão</span>
                  <span className="text-base font-extrabold text-text-main dark:text-white block">Baixo na Sétima (7ª)</span>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white font-normal leading-relaxed">
                    A <strong>Sétima (7ª)</strong> vira a nota sustentadora. **Restrita a tétrades**. Entrega uma cor sofisticada e belo efeito descendente (ex: <code>C7M/B → Am7</code>).
                  </p>
                </div>
              </div>

              {/* Interactive Inversion Simulator Widget */}
              <div className="bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-500/20 p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white flex items-center gap-2">
                    <Sliders size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    Laboratório Interativo de Inversão de Acordes
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white">Selecione uma estrutura harmônica e experimente inverter as posições para ver as notas se reordenarem em tempo real no baixo.</p>
                </div>

                <div className="flex flex-col gap-6 w-full">
                  
                  {/* Selectors Column (Spacious on top!) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-sm">
                    {/* Choose Chord - 5 cols on md */}
                    <div className="md:col-span-5 space-y-2.5">
                      <span className="text-xs font-black uppercase text-zinc-550 dark:text-zinc-400 tracking-wider block">1. Escolha o Acorde Base</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setInversionChordType('C');
                            if (currentInversionLevel === 'terceira') {
                              setCurrentInversionLevel('fundamental');
                            }
                          }}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                            inversionChordType === 'C'
                              ? 'bg-emerald-600 text-white border-transparent shadow'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          C Maior (Tríade)
                        </button>
                        <button
                          onClick={() => {
                            setInversionChordType('G');
                            if (currentInversionLevel === 'terceira') {
                              setCurrentInversionLevel('fundamental');
                            }
                          }}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                            inversionChordType === 'G'
                              ? 'bg-emerald-600 text-white border-transparent shadow'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          G Maior (Tríade)
                        </button>
                        <button
                          onClick={() => setInversionChordType('C7M')}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                            inversionChordType === 'C7M'
                              ? 'bg-emerald-600 text-white border-transparent shadow'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          C7M (Tétrade)
                        </button>
                      </div>
                    </div>

                    {/* Choose Inversion Level - 7 cols on md */}
                    <div className="md:col-span-7 space-y-2.5">
                      <span className="text-xs font-black uppercase text-zinc-550 dark:text-zinc-400 tracking-wider block">2. Selecione a Inversão</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => setCurrentInversionLevel('fundamental')}
                          className={`py-2 px-3 text-left rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer flex justify-between items-center ${
                            currentInversionLevel === 'fundamental'
                              ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5'
                          }`}
                        >
                          <span>Fundamental</span>
                          <span className="font-mono text-[10px] opacity-80">Rótulo: Padrão</span>
                        </button>

                        <button
                          onClick={() => setCurrentInversionLevel('primeira')}
                          className={`py-2 px-3 text-left rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer flex justify-between items-center ${
                            currentInversionLevel === 'primeira'
                              ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5'
                          }`}
                        >
                          <span>1ª Inversão</span>
                          <span className="font-mono text-[10px] opacity-80">Baixo na 3ª</span>
                        </button>

                        <button
                          onClick={() => setCurrentInversionLevel('segunda')}
                          className={`py-2 px-3 text-left rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer flex justify-between items-center ${
                            currentInversionLevel === 'segunda'
                              ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5'
                          }`}
                        >
                          <span>2ª Inversão</span>
                          <span className="font-mono text-[10px] opacity-80">Baixo na 5ª</span>
                        </button>

                        <button
                          disabled={inversionChordType !== 'C7M'}
                          onClick={() => setCurrentInversionLevel('terceira')}
                          className={`py-2 px-3 text-left rounded-xl font-extrabold text-xs sm:text-sm border transition-all cursor-pointer flex justify-between items-center ${
                            inversionChordType !== 'C7M'
                              ? 'opacity-40 cursor-not-allowed bg-zinc-150 dark:bg-zinc-900 border-dashed text-zinc-405'
                              : currentInversionLevel === 'terceira'
                              ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                              : 'bg-card border-border text-text-muted dark:text-slate-200 hover:bg-black/5'
                          }`}
                        >
                          <span>3ª Inversão</span>
                          <span className="font-mono text-[10px] opacity-80">
                            {inversionChordType === 'C7M' ? 'Baixo na 7ª' : 'Requer Tétrade'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visualizer Display Panel (Now in Full Width!) */}
                  <div className="w-full bg-card border border-border p-5 sm:p-7 rounded-3xl space-y-6 shadow-inner">
                    <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border pb-4">
                      <div>
                        <span className="text-xs font-mono text-text-muted dark:text-white uppercase font-bold">Resultado Teórico:</span>
                        <div className="text-sm sm:text-base font-semibold text-text-main dark:text-white">
                          Cifra Harmônica do Altar:
                        </div>
                      </div>
                      <div className="text-3xl sm:text-5xl font-mono font-black text-indigo-550 dark:text-indigo-400 tracking-tight mt-1 sm:mt-0">
                        {currentInvertedChord}
                      </div>
                    </div>

                    {/* Instrument visualization diagrams */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs sm:text-sm font-black uppercase text-text-muted dark:text-white tracking-wider block">Visualização Prática nos Instrumentos</span>
                        <p className="text-[11px] sm:text-xs text-text-muted dark:text-white mt-0.5">Veja como tocar a inversão <strong className="font-black text-indigo-600 dark:text-indigo-455">{currentInvertedChord}</strong> com foco nos intervalos das notas no altar:</p>
                      </div>
 
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-black/10 dark:bg-black/35 p-4 sm:p-6 rounded-3xl border border-border flex-wrap">
                        {/* Guitar container */}
                        <div className="flex flex-col items-center p-4 sm:p-5 bg-card dark:bg-zinc-950/40 rounded-xl border border-border/60 shadow-sm relative overflow-hidden">
                          <span className="text-[11px] sm:text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-4 select-none self-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 🎸 Violão (Intervalos das Notas)
                          </span>
                          <div className="scale-[1.05] sm:scale-[1.12] my-4 flex items-center justify-center transition-all duration-300">
                            <GuitarChordDiagram chordName={currentInvertedChord} preferShowIntervals={true} className="bg-transparent border-0 shadow-none p-0 max-w-none" />
                          </div>
                        </div>
 
                        {/* Piano container */}
                        <div className="flex flex-col items-center p-4 sm:p-5 bg-card dark:bg-zinc-950/40 rounded-xl border border-border/60 shadow-sm relative overflow-hidden">
                          <span className="text-[11px] sm:text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-4 select-none self-start">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> 🎹 Teclado (Intervalos das Notas)
                          </span>
                          <div className="w-full my-4 flex items-center justify-center transition-all duration-300">
                            <PianoChordDiagram chordName={currentInvertedChord} preferShowIntervals={true} compact={true} className="bg-transparent border-0 shadow-none p-0 max-w-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Application Details */}
                    <div className="p-4 sm:p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs sm:text-sm leading-relaxed text-text-muted dark:text-white flex gap-3.5 items-start animate-fade-in">
                      <Info size={18} className="text-indigo-505 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-text-main dark:text-white block mb-0.5">Aplicação Prática no Altar:</span>
                        <p className="font-normal text-text-muted dark:text-white">
                          {
                            inversionChordType === 'C' ? (
                              currentInversionLevel === 'fundamental' ? inversionData.C.fundamental.application :
                              currentInversionLevel === 'primeira' ? inversionData.C.primeira.application :
                              inversionData.C.segunda.application
                            ) : inversionChordType === 'G' ? (
                              currentInversionLevel === 'fundamental' ? inversionData.G.fundamental.application :
                              currentInversionLevel === 'primeira' ? inversionData.G.primeira.application :
                              inversionData.G.segunda.application
                            ) : (
                              currentInversionLevel === 'fundamental' ? inversionData.C7M.fundamental.application :
                              currentInversionLevel === 'primeira' ? inversionData.C7M.primeira.application :
                              currentInversionLevel === 'segunda' ? inversionData.C7M.segunda.application :
                              inversionData.C7M.terceira.application
                            )
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter 2: Funções Harmônicas */}
          {activeTab === 'funcoes' && (
            <motion.div
              key="funcoes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest block mb-1.5">Capítulo 2</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Music className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  As Três Forças Harmônicas
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  Nem todos os acordes têm o mesmo peso em uma história musical. Eles geram sensações físicas e emocionais através de três de funções harmônicas primordiais: Tônica (repouso), Subdominante (movimento ameno) e Dominante (tensão extrema).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl relative space-y-4">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">Função 1</span>
                  <h3 className="font-extrabold text-lg text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                    Tônica (Repouso)
                  </h3>
                  <p className="text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Representa o chão, a fundação estável onde nos sentimos confortáveis. É a casa, o ponto de partida e o fim absoluto da jornada.
                  </p>
                  <div className="text-xs sm:text-sm text-text-muted dark:text-white border-t border-emerald-500/20 pt-3 space-y-1.5 font-medium">
                    <div><strong>Sensação:</strong> Conclusão, paz, repouso absoluto.</div>
                    <div><strong>Graus:</strong> I, VIm, IIIm.</div>
                  </div>
                </div>

                <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl relative space-y-4">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-blue-500/15 text-blue-500 dark:text-blue-400">Função 2</span>
                  <h3 className="font-extrabold text-lg text-blue-550 dark:text-blue-450 flex items-center gap-1.5">
                    Subdominante (Passagem)
                  </h3>
                  <p className="text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Representa o caminhar, o afastamento da tônica de forma segura mas em andamento. Preparação que conduz em direção à dominante.
                  </p>
                  <div className="text-xs sm:text-sm text-text-muted dark:text-white border-t border-blue-500/20 pt-3 space-y-1.5 font-medium">
                    <div><strong>Sensação:</strong> Preparação, movimento em andamento.</div>
                    <div><strong>Graus:</strong> IV, IIm.</div>
                  </div>
                </div>

                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl relative space-y-4">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-amber-500/15 text-amber-500 dark:text-amber-400">Função 3</span>
                  <h3 className="font-extrabold text-lg text-amber-550 dark:text-amber-400 flex items-center gap-1.5">
                    Dominante (Tensão Máxima)
                  </h3>
                  <p className="text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    A instabilidade física. Ela abriga o trítono, intervalo tenso que reclama por resolução para um semitom acima/abaixo em direção à tônica.
                  </p>
                  <div className="text-xs sm:text-sm text-text-muted dark:text-white border-t border-amber-500/20 pt-3 space-y-1.5 font-medium">
                    <div><strong>Sensação:</strong> Ansiedade, urgência de resolução.</div>
                    <div><strong>Graus:</strong> V (ou V7), VIIm(b5).</div>
                  </div>
                </div>
              </div>

              {/* Tonal Tension Graph Mockup */}
              <div className="bg-slate-500/5 dark:bg-zinc-800/15 border border-border p-6 rounded-2xl space-y-5">
                <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white">Entendendo a dinâmica de Atração e Resolução</h3>
                <p className="text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                  Na maioria dos arranjos contemporâneos de Ministério de Louvor, a harmonia funciona como uma corda elástica: você a estica puxando para longe (Subdominante), tensiona no máximo (Dominante) e a solta para voltar ao repouso inicial (Tônica).
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-5 bg-black/10 dark:bg-white/10 rounded-2xl border border-border">
                  <div className="space-y-1.5 text-center">
                    <span className="block text-xs font-bold uppercase text-text-muted dark:text-white">Passo 1</span>
                    <span className="text-sm sm:text-base font-black text-emerald-500 dark:text-emerald-400">Tônica [C]</span>
                    <span className="block text-xs text-text-muted dark:text-white">Zero Tensão</span>
                  </div>
                  <ChevronRight className="rotate-90 sm:rotate-0 text-text-muted dark:text-white w-5 h-5" />
                  <div className="space-y-1.5 text-center">
                    <span className="block text-xs font-bold uppercase text-text-muted dark:text-white">Passo 2</span>
                    <span className="text-sm sm:text-base font-black text-blue-500 dark:text-blue-400">Subdominante [F]</span>
                    <span className="block text-xs text-text-muted dark:text-white">Tensão Moderada</span>
                  </div>
                  <ChevronRight className="rotate-90 sm:rotate-0 text-text-muted dark:text-white w-5 h-5" />
                  <div className="space-y-1.5 text-center">
                    <span className="block text-xs font-bold uppercase text-text-muted dark:text-white">Passo 3</span>
                    <span className="text-sm sm:text-base font-black text-amber-500 dark:text-amber-400">Dominante [G7]</span>
                    <span className="block text-xs text-text-muted dark:text-white">Tensão Máxima</span>
                  </div>
                  <ChevronRight className="rotate-90 sm:rotate-0 text-text-muted dark:text-white w-5 h-5" />
                  <div className="space-y-1.5 text-center">
                    <span className="block text-xs font-bold uppercase text-text-muted dark:text-white">Resolução</span>
                    <span className="text-sm sm:text-base font-black text-emerald-500 dark:text-emerald-400">Tônica [C]</span>
                    <span className="block text-xs text-text-muted dark:text-white">Retorno Seguro</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter 3: Cadências Clássicas */}
          {activeTab === 'cadencias' && (
            <motion.div
              key="cadencias"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest block mb-1.5">Capítulo 3</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Music2 className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  Cadências Harmônicas Práticas
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  Uma cadência é uma sequência previsível de funções harmônicas que cria pontes de sentido em um refrão, estrofe ou transição instrumental. Dominá-las ajuda a compreender a fluidez de qualquer louvor de ouvido!
                </p>
              </div>

              {/* Progressions Simulator Area */}
              <div className="space-y-5">
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-text-main dark:text-white">Simulador Visual de Fluxo Cadencial</h3>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white mt-1">Selecione uma das cadências abaixo para ver seu movimento de funções e sinta visualmente como a harmonia respira.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classicProgressions.map((prog) => (
                    <div 
                      key={prog.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        activeProgressionId === prog.id 
                          ? 'border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5' 
                          : 'border-border bg-black/5 dark:bg-white/5 hover:bg-black/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4 mb-4">
                        <span className="text-sm sm:text-base font-black text-text-main dark:text-white">{prog.name}</span>
                        <button
                          type="button"
                          onClick={() => playProgression(prog.id)}
                          disabled={isProgPlaying}
                          className="px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-40 cursor-pointer shadow-md"
                        >
                          {activeProgressionId === prog.id ? "Executando..." : "Simular Fluxo"}
                        </button>
                      </div>

                      {/* Progression Visual Blocks */}
                      <div className="grid grid-cols-4 gap-2.5">
                        {prog.chords.map((chord, cIdx) => {
                          const isActive = activeProgressionId === prog.id && currentProgStep === cIdx;
                          return (
                            <div 
                              key={cIdx}
                              className={`p-4 rounded-xl border text-center transition-all duration-300 ${
                                isActive 
                                  ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow-md' 
                                  : 'bg-card border-border text-text-muted dark:text-slate-200'
                              }`}
                            >
                              <span className="block text-sm sm:text-base font-black uppercase font-mono">{chord}</span>
                              <span className="block text-[9px] sm:text-xs tracking-tight mt-1 truncate uppercase font-bold text-indigo-500 dark:text-indigo-400">{prog.functions[cIdx]?.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs sm:text-sm text-text-muted dark:text-white mt-4 leading-relaxed">
                        {prog.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Types of Cadences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-widest text-indigo-500 dark:text-indigo-400">A Cadência Autêntica (V - I)</h4>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    É a mãe de todas as resoluções. O quinto grau com sétima arrasta a harmonia de volta para a tônica com força monumental. Os ouvidos humanos estão condicionados há 400 anos para esperar esse repouso imediato.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-widest text-indigo-500 dark:text-indigo-400">A Cadência Plagal (IV - I)</h4>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Sua assinatura harmônica é calma e pastoral. Conhecida universalmente como a cadência do "Amém" no final de hinos clássicos no hinário tradicional, ela faz a transição do IV grau (Subdominante) diretamente para a tônica sem a instabilidade tensa da Dominante.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter 4: Empréstimos Modais */}
          {activeTab === 'modal' && (
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest block mb-1.5">Capítulo 4</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Piano className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  A.E.M — Acordes de Empréstimo Modal
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  Quer saber de onde vem aquele acorde "inesperado" mas incrivelmente bonito que traz uma sensação dramática e profunda de filme a refrões do louvor? Ele geralmente é importado do modo paralelo vizinho.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-lg sm:text-xl text-text-main dark:text-white">Como funciona o Intercâmbio</h3>
                  <p className="text-sm sm:text-base text-text-muted dark:text-white leading-relaxed font-normal">
                    Se você está tocando em Dó Maior (C), e decide usar o acorde de <span className="text-indigo-500 dark:text-indigo-400 font-extrabold">Fm7 (Fá menor)</span> ou <span className="text-indigo-500 dark:text-indigo-400 font-extrabold">Ab7M (Lá bemol maior)</span>, sua música continuará em Dó maior, mas você temporariamente emprestou um acorde da escala paralela de Dó Menor natural (Escolha de modalidade).
                  </p>
                  <p className="text-sm sm:text-base text-text-muted dark:text-white leading-relaxed font-normal">
                    Esse processo injeta cores harmônicas melancólicas, grandiosas ou de contemplação mística. É o maior segredo de grandes compositores congregacionais para elevar o "clímax" espiritual de refrões de adoração.
                  </p>
                </div>

                <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl space-y-5">
                  <h4 className="font-black text-sm uppercase text-indigo-500 dark:text-indigo-400 tracking-wider">AEM mais comuns em Hinos:</h4>

                  <div className="space-y-4">
                    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                      <span className="text-sm font-mono font-black text-indigo-650 dark:text-indigo-400 block pb-1">IVm (Quarto Grau Menor)</span>
                      <p className="text-xs sm:text-sm text-text-muted dark:text-white">Em vez de F7M, toca-se Fm no tom de C. Dá um ar reflexivo incrível. Exemplo: "Fiel a mim".</p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                      <span className="text-sm font-mono font-black text-indigo-650 dark:text-indigo-400 block pb-1">bVI (Lá Bemol Maior / Ab7M em C)</span>
                      <p className="text-xs sm:text-sm text-text-muted dark:text-white">Um acorde épico e heróico de superação. Cria suspense e expande a percepção do tamanho do arranjo.</p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                      <span className="text-sm font-mono font-black text-indigo-650 dark:text-indigo-400 block pb-1">bVII (Si Bemol Maior / Bb7M em C)</span>
                      <p className="text-xs sm:text-sm text-text-muted dark:text-white">Conhecido como o "acorde do vento". Soa aventureiro, épico e suave, facilitando pontes de vocal.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter 5: Dominantes Secundárias e Substitutos */}
          {activeTab === 'subst' && (
            <motion.div
              key="subst"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest block mb-1.5">Capítulo 5</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white flex items-center gap-2.5">
                  <Music3 className="w-8 h-8 text-indigo-550 dark:text-indigo-400 shrink-0" />
                  Dominantes Secundárias e SubV7
                </h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  Para os tecladistas, violonistas e baixistas avançados. Aprenda como guiar com perfeição a transição entre acordes comuns inserindo pequenos acordes de passagem elegantes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-black/5 dark:bg-white/5 border border-border p-6 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/20 shrink-0">V/X</div>
                    <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white">Dominantes Secundárias (V7 de alguém)</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    Você sabe que a Dominante principal resolve na Tônica. Uma Dominante Secundária é um acorde maior com 7ª que serve para "preparar" temporariamente qualquer outro Grau Menor do campo harmônico.
                  </p>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    <strong>Exemplo Prático:</strong> Em vez de migrar direto de C para Am, você pode tocar <span className="text-indigo-500 dark:text-indigo-400 font-extrabold">E7</span> antes. O E7 é a dominante do Lá menor. Isso soa clássico, reconfortante e profissional!
                  </p>
                </div>

                <div className="space-y-4 bg-black/5 dark:bg-white/5 border border-border p-6 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/20 shrink-0">SubV</div>
                    <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white font-sans">SubV7 (Substituto do Trítono)</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    O acorde mais sofisticado. Trata-se de tocar um acorde maior com sétima posicionado exatamente meio-tom acima do acorde que você quer alcançar (resolução descendente cromática).
                  </p>
                  <p className="text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed font-normal">
                    <strong>Exemplo Prático:</strong> Para resolver em C, em vez de tocar o tradicional G7, você toca <span className="text-indigo-500 dark:text-indigo-400 font-extrabold">Db7</span> para resolver em C. O Db7 divide as mesmas notas de trítono que o G7, mas de forma cromática e aveludada.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter 6: Quiz / Testar Conhecimento */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-border pb-5">
                <span className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest block mb-1.5">Desafio Prático</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main dark:text-white">Teste Seus Conhecimentos Teóricos</h2>
                <p className="text-sm sm:text-base text-text-muted dark:text-white mt-2 leading-relaxed">
                  Avalie o quanto sua equipe domina harmonia funcional! Dez perguntas elaboradas para simular desafios do mundo real de arranjos, intervalos musicais, inversões de acordes e ensaios dominicais.
                </p>
              </div>

              {!showResults ? (
                <div className="bg-black/5 dark:bg-zinc-850/20 border border-border p-6 md:p-8 rounded-3xl space-y-6">
                  <div className="flex justify-between items-center bg-black/10 dark:bg-white/5 px-5 py-3 rounded-2xl border border-border/80">
                    <span className="text-xs sm:text-sm font-bold text-text-muted dark:text-white uppercase tracking-widest">
                      Pergunta {currentQuizIndex + 1} de {quizQuestions.length}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                      Acertos: {score}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-text-main dark:text-white leading-tight">
                    {quizQuestions[currentQuizIndex].question}
                  </h3>

                  <div className="space-y-3">
                    {quizQuestions[currentQuizIndex].options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrectAnswer = idx === quizQuestions[currentQuizIndex].correct;
                      
                      let bgClass = 'bg-card border-border hover:border-indigo-500/40 text-text-main dark:text-white';
                      let iconEl = null;

                      if (isAnswered) {
                         if (isCorrectAnswer) {
                          bgClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold';
                          iconEl = <CheckCircle size={18} className="text-emerald-500 shrink-0" />;
                        } else if (isSelected) {
                          bgClass = 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400';
                          iconEl = <XCircle size={18} className="text-red-500 shrink-0" />;
                        } else {
                          bgClass = 'bg-card border-border/40 text-text-muted dark:text-white opacity-65';
                        }
                      } else if (isSelected) {
                        bgClass = 'border-indigo-500 bg-indigo-500/5 text-text-main dark:text-white';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAnswerSubmit(idx)}
                          disabled={isAnswered}
                          className={`w-full text-left p-5 rounded-2xl border flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${bgClass}`}
                        >
                          <span>{option}</span>
                          {iconEl}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-border text-xs sm:text-sm leading-relaxed text-text-muted dark:text-white space-y-2"
                    >
                      <strong className="text-text-main dark:text-white font-extrabold flex items-center gap-1.5"><HelpCircle size={16} className="text-indigo-400 shrink-0" /> Explicação para o Altar:</strong>
                      <p className="font-normal">{quizQuestions[currentQuizIndex].explanation}</p>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <span>Próxima</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-black/5 dark:bg-white/5 border border-border p-8 md:p-12 rounded-3xl text-center space-y-6"
                >
                  <Award size={56} className="text-indigo-500 mx-auto animate-bounce" />
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-xl sm:text-2xl text-text-main dark:text-white">Simulado Concluído!</h3>
                    <p className="text-xs sm:text-sm text-text-muted dark:text-white">Veja o veredito da competência do seu ministério.</p>
                  </div>

                  <div className="text-5xl sm:text-6xl font-black text-text-main dark:text-white">
                    {score} / {quizQuestions.length}
                    <span className="block text-xs sm:text-sm text-text-muted dark:text-white mt-2 font-bold">respostas corretas</span>
                  </div>

                  <div className="max-w-md mx-auto p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/15 text-xs sm:text-sm text-text-muted dark:text-white leading-relaxed">
                    {score >= 8 ? (
                      <span className="text-emerald-500 dark:text-emerald-400 font-bold block">Conhecimento Excelente! Sua equipe está pronta para arranjos altamente sofisticados, inversões fluidas, rearmonizações de hinos e improvisações perfeitamente guiadas de ouvido.</span>
                    ) : score >= 5 ? (
                      <span className="text-indigo-550 dark:text-indigo-305 font-bold block">Ótimo Nível! Os conceitos fundamentais, intervalos e inversões estão bem fixados. Revise o material de acordes de empréstimo modal e subV7 para dominar o topo.</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-bold block">Bom começo, mas requer atenção! Aconselhamos os ministros a repassarem em grupo as funções harmônicas, classificação de intervalos e inversões para tocarem com total união no altar.</span>
                    )}
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={resetQuiz}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      Refazer Quiz
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
