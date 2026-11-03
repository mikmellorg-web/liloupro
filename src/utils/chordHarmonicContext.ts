/**
 * LiLouPro - Engine de Contexto e Análise Harmônica de Acordes
 * Calcula instantaneamente (0ms, 100% offline) o contexto tonal, função harmônica,
 * régua do campo harmônico, decomposição de intervalos, cadências e substituições
 * para o "Raio-X Harmônico do Acorde".
 */

export interface ChordNoteDecomposition {
  note: string;
  intervalName: string; // T, 3M, 3m, 5J, 7m, 7M, 9ª, 4J, etc.
  semitonesFromRoot: number;
  role: string; // Fundamental, Terça que define o modo, Quinta justa de sustentação, etc.
  isBass?: boolean;
}

export interface HarmonicFieldDegree {
  roman: string;
  chord: string;
  functionType: 'Tônica' | 'Subdominante' | 'Dominante' | 'Especial';
  functionShort: string;
  description: string;
  isCurrent: boolean;
  notes: string[];
}

export interface ChordHarmonicContextData {
  chord: string;
  baseChord: string;
  bassNote: string | null;
  songKey: string;
  isMinorKey: boolean;
  keyRoot: string;
  
  // Grau e Função
  degreeRoman: string;
  degreeNumber: string;
  functionType: 'Tônica' | 'Subdominante' | 'Dominante' | 'Especial';
  functionBadge: string;
  functionExplanation: string;
  spiritualMood: string;
  
  // Campo Harmônico da Música
  harmonicField: HarmonicFieldDegree[];
  fieldPositionText: string;
  isDiatonic: boolean;
  diatonicType: 'Diatônico Natural' | 'Inversão de Baixo' | 'Dominante / Suspenso' | 'Empréstimo Modal / Tensão';

  // Cadência / Movimento Harmônico (Sincronizado com Capítulo 3 do Curso de Harmonia)
  cadenceContext: {
    progressionName: string;
    sequence: string[];
    description: string;
    flowText: string;
    functions?: string[];
    songFlow?: string;
  };

  // Notas e Intervalos
  notes: ChordNoteDecomposition[];
  chordFormula: string;
  extensionsAvailable: string[];

  // Dicas Práticas & Rearmonizações
  guitarTip: string;
  pianoTip: string;
  substitutions: {
    chord: string;
    title: string;
    reason: string;
  }[];
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ALIASES: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'E#': 'F', 'B#': 'C', 'Cb': 'B', 'Fb': 'E'
};

const SHARPS_TO_ENHARMONIC: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
};

function normalizeNote(n: string): string {
  if (!n) return 'C';
  const clean = n.trim().charAt(0).toUpperCase() + n.trim().slice(1);
  return ALIASES[clean] || clean;
}

function noteIndex(n: string): number {
  const norm = normalizeNote(n);
  const idx = NOTES.indexOf(norm);
  return idx !== -1 ? idx : 0;
}

function getNoteByOffset(root: string, semitones: number, preferFlats: boolean = false): string {
  const rIdx = noteIndex(root);
  const targetIdx = (rIdx + semitones + 120) % 12;
  const standard = NOTES[targetIdx];
  if (preferFlats && SHARPS_TO_ENHARMONIC[standard]) {
    return SHARPS_TO_ENHARMONIC[standard];
  }
  return standard;
}

export function analyzeChordHarmonicContext(
  chordName: string,
  rawSongKey?: string,
  availableChords: string[] = []
): ChordHarmonicContextData {
  const cleanChord = (chordName || 'C').trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
  const parts = cleanChord.split('/');
  const baseChord = parts[0].trim();
  const bassNote = parts.length > 1 ? parts[1].trim() : null;

  // Extrair tônica e sufixo do acorde
  const rootMatch = baseChord.match(/^([A-G][#b]?)(.*)$/);
  const chordRoot = rootMatch ? rootMatch[1] : 'C';
  const chordSuffix = rootMatch ? rootMatch[2] : '';

  // Determinar tom da música
  let keyStr = (rawSongKey || chordRoot).trim().replace(/^Tom:\s*/i, '');
  let isMinorKey = false;
  let keyRoot = 'C';

  const keyMatch = keyStr.match(/^([A-G][#b]?)(m(?:enor|in)?)?/i);
  if (keyMatch) {
    keyRoot = keyMatch[1].charAt(0).toUpperCase() + (keyMatch[1].charAt(1) ? keyMatch[1].charAt(1).toLowerCase() : '');
    isMinorKey = !!keyMatch[2];
  } else {
    keyRoot = chordRoot;
  }

  const preferFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gm', 'Dm', 'Cm', 'Fm'].includes(rawSongKey || '');

  // 1. Escalas e Campo Harmônico
  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
  const MAJOR_CHORD_TEMPLATES = [
    { 
      suffix: '', 
      roman: 'I', 
      func: 'Tônica' as const, 
      short: 'Tôn', 
      desc: 'Tônica. Estabilidade, repouso e conclusão harmônica. Representa o centro tonal e o ponto de equilíbrio absoluto da música, para onde as tensões convergem e encontram repouso.' 
    },
    { 
      suffix: 'm', 
      roman: 'ii', 
      func: 'Subdominante' as const, 
      short: 'SubR', 
      desc: 'Subdominante. Sensação de afastamento ou transição em relação ao repouso da tônica, servindo como um ponto intermediário que prepara o caminho para a dominante ou retorna à tônica.' 
    },
    { 
      suffix: 'm', 
      roman: 'iii', 
      func: 'Tônica' as const, 
      short: 'Med', 
      desc: 'Tônica (Mediante). Estabilidade e repouso secundário em relação ao centro tonal, oferecendo uma sonoridade mais suave e reflexiva que pode substituir a tônica principal.' 
    },
    { 
      suffix: '', 
      roman: 'IV', 
      func: 'Subdominante' as const, 
      short: 'Subd', 
      desc: 'Subdominante. Sensação de afastamento ou transição em relação ao repouso da tônica, servindo como um ponto intermediário que prepara o caminho para a dominante ou retorna à tônica.' 
    },
    { 
      suffix: '', 
      roman: 'V', 
      func: 'Dominante' as const, 
      short: 'Dom', 
      desc: 'Dominante. Tensão harmônica máxima e instabilidade direcional. Possui uma atração magnética irresistível que clama por resolução imediata no repouso da tônica.' 
    },
    { 
      suffix: 'm', 
      roman: 'vi', 
      func: 'Tônica' as const, 
      short: 'Rel', 
      desc: 'Tônica (Relativa Menor). Estabilidade e repouso com caráter menor introspectivo, compartilhando a função de tônica e servindo como refúgio harmônico contemplativo.' 
    },
    { 
      suffix: 'dim', 
      roman: 'vii°', 
      func: 'Dominante' as const, 
      short: 'Sens', 
      desc: 'Dominante (Sensível). Tensão harmônica máxima gerada pelo trítono com a sensível da escala, exercendo atração magnética e direcional imediata para a tônica.' 
    }
  ];

  const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
  const MINOR_CHORD_TEMPLATES = [
    { 
      suffix: 'm', 
      roman: 'Im', 
      func: 'Tônica' as const, 
      short: 'Tôn', 
      desc: 'Tônica Menor. Estabilidade, repouso e centro tonal absoluto da tonalidade menor, onde a harmonia encontra equilíbrio e conclusão.' 
    },
    { 
      suffix: 'dim', 
      roman: 'ii°', 
      func: 'Subdominante' as const, 
      short: 'Subd', 
      desc: 'Subdominante. Sensação de afastamento ou transição em relação ao repouso da tônica, servindo como um ponto intermediário tenso que prepara o caminho para a dominante ou para a relativa maior.' 
    },
    { 
      suffix: '', 
      roman: 'bIII', 
      func: 'Tônica' as const, 
      short: 'RelM', 
      desc: 'Tônica (Relativa Maior). Estabilidade e repouso harmônico com brilho maior, servindo de ponto de equilíbrio e esperança no centro da tonalidade menor.' 
    },
    { 
      suffix: 'm', 
      roman: 'iv', 
      func: 'Subdominante' as const, 
      short: 'Subd', 
      desc: 'Subdominante. Sensação de afastamento ou transição em relação ao repouso da tônica, servindo como um ponto intermediário que prepara o caminho para a dominante ou retorna à tônica.' 
    },
    { 
      suffix: 'm', 
      roman: 'v', 
      func: 'Dominante' as const, 
      short: 'Dom', 
      desc: 'Dominante. Tensão harmônica e instabilidade melódica que conduz o movimento musical de volta ao repouso da tônica menor.' 
    },
    { 
      suffix: '', 
      roman: 'bVI', 
      func: 'Subdominante' as const, 
      short: 'Subd', 
      desc: 'Subdominante. Sensação de afastamento ou transição expansiva e grandiosa, preparando com força o caminho para a dominante ou retornando à tônica.' 
    },
    { 
      suffix: '', 
      roman: 'bVII', 
      func: 'Dominante' as const, 
      short: 'SubT', 
      desc: 'Dominante (Subtônica). Tensão harmônica resolutiva e inspiradora que prepara o retorno ao repouso da tônica menor.' 
    }
  ];

  const steps = isMinorKey ? MINOR_STEPS : MAJOR_STEPS;
  const templates = isMinorKey ? MINOR_CHORD_TEMPLATES : MAJOR_CHORD_TEMPLATES;

  // Calcular os acordes do campo harmônico
  const harmonicField: HarmonicFieldDegree[] = steps.map((semitones, idx) => {
    const root = getNoteByOffset(keyRoot, semitones, preferFlats);
    const tmpl = templates[idx];
    const fullChord = `${root}${tmpl.suffix}`;
    
    // Calcula notas da tríade
    const thirdOffset = isMinorKey ? (idx === 1 || idx === 2 || idx === 5 || idx === 6 ? 4 : 3) : (idx === 0 || idx === 3 || idx === 4 ? 4 : 3);
    const fifthOffset = (idx === 6 && !isMinorKey) || (idx === 1 && isMinorKey) ? 6 : 7;
    const thirdNote = getNoteByOffset(root, thirdOffset, preferFlats);
    const fifthNote = getNoteByOffset(root, fifthOffset, preferFlats);

    // Checar se é o acorde atual (ou base dele)
    const isCurrent = normalizeNote(chordRoot) === normalizeNote(root) && 
      (chordSuffix.startsWith('m') === tmpl.suffix.startsWith('m'));

    return {
      roman: tmpl.roman,
      chord: fullChord,
      functionType: tmpl.func,
      functionShort: tmpl.short,
      description: tmpl.desc,
      isCurrent,
      notes: [root, thirdNote, fifthNote]
    };
  });

  // 2. Grau e Função do Acorde Clicado
  const keyRootIdx = noteIndex(keyRoot);
  const chordRootIdx = noteIndex(chordRoot);
  const diffSemitones = (chordRootIdx - keyRootIdx + 12) % 12;

  let degreeRoman = 'I';
  let degreeNumber = '1';
  let functionType: 'Tônica' | 'Subdominante' | 'Dominante' | 'Especial' = 'Tônica';
  let functionBadge = 'Tônica (Repouso)';
  let functionExplanation = '';
  let spiritualMood = '';
  let isDiatonic = false;
  let diatonicType: 'Diatônico Natural' | 'Inversão de Baixo' | 'Dominante / Suspenso' | 'Empréstimo Modal / Tensão' = 'Diatônico Natural';

  // Buscar correspondência no campo harmônico
  const matchedDegreeIndex = steps.indexOf(diffSemitones);
  if (matchedDegreeIndex !== -1) {
    const tmpl = templates[matchedDegreeIndex];
    degreeRoman = tmpl.roman;
    degreeNumber = String(matchedDegreeIndex + 1);
    functionType = tmpl.func;
    isDiatonic = true;
    diatonicType = 'Diatônico Natural';
    functionBadge = `${tmpl.func} (${tmpl.short})`;
    functionExplanation = tmpl.desc;
  } else {
    // Acorde fora do campo harmônico direto (Empréstimo modal, dominante secundário, subtom)
    isDiatonic = false;
    diatonicType = 'Empréstimo Modal / Tensão';
    functionType = 'Especial';
    
    // Mapeamento de graus cromáticos
    const chromaticMap: Record<number, { roman: string; num: string; name: string; func: 'Tônica' | 'Subdominante' | 'Dominante' | 'Especial'; desc: string }> = {
      1: { 
        roman: 'bII', 
        num: 'b2', 
        name: 'Acorde Napolitano / Substituto', 
        func: 'Subdominante',
        desc: 'Subdominante cromática. Sensação de afastamento ou transição dramática em relação ao repouso da tônica, preparando com intensidade o caminho para a dominante.' 
      },
      3: { 
        roman: isMinorKey ? 'III' : 'bIII', 
        num: 'b3', 
        name: 'Empréstimo Modal do Homônimo', 
        func: 'Especial',
        desc: 'Empréstimo Modal. Afastamento cromático especial que introduz cores emocionais profundas de reflexão antes de reconduzir ao repouso da tônica.' 
      },
      6: { 
        roman: 'bV', 
        num: 'b5', 
        name: 'Trítono / SubV', 
        func: 'Dominante',
        desc: 'Dominante substituta (SubV). Tensão harmônica máxima gerada pelo trítono, exercendo atração magnética de volta à tônica.' 
      },
      8: { 
        roman: isMinorKey ? 'VI' : 'bVI', 
        num: 'b6', 
        name: 'Empréstimo Modal Heroico', 
        func: 'Subdominante',
        desc: 'Subdominante por empréstimo modal. Sensação de afastamento ou transição grandiosa em relação ao repouso da tônica, conduzindo com força à dominante.' 
      },
      10: { 
        roman: 'bVII', 
        num: 'b7', 
        name: 'Subtônica de Passagem', 
        func: 'Dominante',
        desc: 'Dominante (Subtônica). Tensão harmônica resolutiva e inspiradora que prepara o retorno ao repouso da tônica.' 
      }
    };

    const chrom = chromaticMap[diffSemitones] || { 
      roman: 'Alt', 
      num: '?', 
      name: 'Coloração Cromática', 
      func: 'Especial',
      desc: 'Acorde de empréstimo ou substituição cromática que cria afastamento expressivo antes de retornar ao centro tonal.'
    };
    degreeRoman = chrom.roman;
    degreeNumber = chrom.num;
    functionType = chrom.func;
    functionBadge = chrom.name;
    functionExplanation = chrom.desc;
  }

  // Tratamento específico para acorde com baixo invertido (slash chord ex: C/D, D/F#, G/B)
  if (bassNote) {
    const bassIdx = noteIndex(bassNote);
    const bassDiffFromKey = (bassIdx - keyRootIdx + 12) % 12;
    const bassDiffFromChord = (bassIdx - chordRootIdx + 12) % 12;

    const bassIntervalLabel = bassDiffFromChord === 4 ? '3ª no Baixo (1ª Inversão)'
      : bassDiffFromChord === 3 ? '3ªm no Baixo'
      : bassDiffFromChord === 7 ? '5ª no Baixo (2ª Inversão)'
      : bassDiffFromChord === 10 ? '7ª no Baixo (3ª Inversão)'
      : bassDiffFromChord === 11 ? '7M no Baixo'
      : bassDiffFromChord === 2 ? 'Baixo na 2ª / Nona (Condução)'
      : `Baixo em ${bassNote}`;

    degreeRoman = `${degreeRoman}/${bassDiffFromKey === 7 ? '5' : bassDiffFromKey === 4 ? '3' : bassDiffFromKey === 2 ? '2' : bassNote}`;
    diatonicType = 'Inversão de Baixo';

    if (bassDiffFromKey === 7 && (diffSemitones === 5 || diffSemitones === 2)) {
      // Exemplo clássico: C/D no tom de Sol (IV/V) ou Am/D (ii/V)
      functionType = 'Dominante';
      functionBadge = 'Suspenso de Tensão (IV/V)';
      functionExplanation = `Dominante (Suspenso IV/V). Tensão harmônica com expectativa suspensa. Reúne a sensação de afastamento da subdominante (${baseChord}) sobre o pedal do baixo dominante (${bassNote}), servindo como um ponto intermediário de alta atração para resolver na tônica (${keyRoot}).`;
      spiritualMood = 'Sensação de glória suspensa, preparando o clímax do refrão.';
    } else if (bassDiffFromChord === 4 || bassDiffFromChord === 3) {
      // 1ª inversão: D/F#, G/B, C/E
      const funcName = functionType;
      const funcBaseDef = funcName === 'Dominante'
        ? 'Tensão harmônica máxima e instabilidade direcional que clama por resolução na tônica'
        : funcName === 'Subdominante'
        ? 'Sensação de afastamento ou transição em relação ao repouso da tônica'
        : 'Estabilidade, repouso e conclusão harmônica';
      functionExplanation = `${funcName} (1ª Inversão). ${funcBaseDef}, com o baixo na terça (${bassNote}) criando uma linha melódica fluida e direcional nos graves para a condução dos acordes.`;
      spiritualMood = 'Movimento suave e elegante de ligação harmônica.';
    }
  }

  // Frases de sensação por função harmônica (Alinhadas ao Capítulo 2 do Curso de Harmonia)
  if (!spiritualMood) {
    if (functionType === 'Tônica') {
      spiritualMood = 'Conclusão, paz e repouso absoluto no altar.';
    } else if (functionType === 'Subdominante') {
      spiritualMood = 'Preparação, movimento em andamento e entrega congregacional.';
    } else if (functionType === 'Dominante') {
      spiritualMood = 'Tensão elétrica e atração magnética clamando por resolução imediata na Tônica.';
    } else {
      spiritualMood = 'Coloração emocional profunda e surpresa harmônica no culto.';
    }
  }

  // 3. Cadência & Movimento Harmônico (Sincronizado estritamente com o Capítulo 3 do Curso de Harmonia)
  const I_chord = harmonicField[0]?.chord || (isMinorKey ? `${keyRoot}m` : keyRoot);
  const ii_chord = harmonicField[1]?.chord || `${getNoteByOffset(keyRoot, 2, preferFlats)}m`;
  const IV_chord = harmonicField[3]?.chord || getNoteByOffset(keyRoot, 5, preferFlats);
  const V_chord = harmonicField[4]?.chord || getNoteByOffset(keyRoot, 7, preferFlats);
  const vi_chord = harmonicField[5]?.chord || `${getNoteByOffset(keyRoot, 9, preferFlats)}m`;

  let progressionName = 'Progressão de Ouro do Louvor (I - V - VIm - IV)';
  let sequence: string[] = [I_chord, V_chord, vi_chord, IV_chord];
  let cadenceDesc = "Responsável por centenas de hinos lendários como 'Ousado Amor', 'Alvo Mais que a Neve' e 'Aclame ao Senhor'.";
  let functionsList: string[] = ['Tônica (Casa)', 'Dominante (Decolar)', 'Tônica Menor (Contemplativo)', 'Subdominante (Entrega)'];

  // Fluxo de acordes na canção caso haja vizinhos disponíveis
  let songFlow: string | undefined = undefined;
  const idxInSong = availableChords.indexOf(cleanChord);
  if (idxInSong !== -1 && availableChords.length >= 2) {
    const prevChord = availableChords[(idxInSong - 1 + availableChords.length) % availableChords.length];
    const nextChord = availableChords[(idxInSong + 1) % availableChords.length];
    songFlow = `${prevChord} ➔ ${cleanChord} ➔ ${nextChord}`;
  }

  if (bassNote) {
    // Acordes com Inversão de Baixo (Capítulo 1 do Curso de Harmonia)
    const bassIdx = noteIndex(bassNote);
    const bassDiffFromKey = (bassIdx - keyRootIdx + 12) % 12;
    const bassDiffFromChord = (bassIdx - chordRootIdx + 12) % 12;

    if (bassDiffFromKey === 7 && (diffSemitones === 5 || diffSemitones === 2)) {
      progressionName = 'Suspenso de Tensão (IV/V)';
      sequence = [cleanChord, V_chord, I_chord];
      functionsList = ['Subdominante / Pedal', 'Dominante (Tensão)', 'Tônica (Resolução)'];
      cadenceDesc = 'Assinatura do Worship moderno! Reúne a suavidade da Subdominante sobre o pedal Dominante, criando expectativa celestial para resolver na Tônica.';
    } else if (bassDiffFromChord === 4 || bassDiffFromChord === 3) {
      progressionName = 'Baixo na Terça (3ª) — 1ª Inversão';
      const targetRes = diffSemitones === 7 ? vi_chord : IV_chord;
      sequence = [I_chord, cleanChord, targetRes];
      functionsList = ['Tônica (Casa)', 'Baixo na 3ª (Condução)', 'Passagem Harmônica'];
      cadenceDesc = 'A Terça (3ª) assume o papel mais grave. Traz um som mais leve e direcional, excelente para preparar subidas cromáticas (ex: C/E → F ou D/F# → G).';
    } else if (bassDiffFromChord === 7) {
      progressionName = 'Baixo na Quinta (5ª) — 2ª Inversão';
      sequence = [cleanChord, V_chord, I_chord];
      functionsList = ['Quarta-e-Sexta Cadencial', 'Dominante', 'Tônica'];
      cadenceDesc = 'A Quinta (5ª) assume o baixo. Soa um pouco instável ou "no ar", pedindo resolução. Muito usada como "quarta-e-sexta" cadencial (ex: C/G → G → C).';
    } else if (bassDiffFromChord === 10 || bassDiffFromChord === 11) {
      progressionName = 'Baixo na Sétima (7ª) — 3ª Inversão';
      sequence = [baseChord, cleanChord, vi_chord];
      functionsList = ['Tônica', 'Baixo na 7ª (Descendente)', 'Relativa Menor'];
      cadenceDesc = 'A Sétima (7ª) vira a nota sustentadora. Restrita a tétrades. Entrega uma cor sofisticada e belo efeito descendente (ex: C7M/B → Am7).';
    } else {
      progressionName = 'Condução com Baixo Invertido';
      sequence = [I_chord, cleanChord, V_chord];
      functionsList = ['Tônica', `Baixo em ${bassNote}`, 'Dominante'];
      cadenceDesc = `O baixo em ${bassNote} guia a linha melódica dos graves sem perder a função tonal do acorde ${baseChord}.`;
    }
  } else if (!isMinorKey) {
    // Tonalidade Maior — Cadências Práticas do Capítulo 3
    if (functionType === 'Dominante' || diffSemitones === 7) {
      // V -> I
      progressionName = 'A Cadência Autêntica (V - I)';
      const domChord = cleanChord.includes('7') ? cleanChord : `${cleanChord}7`;
      sequence = [domChord, `${I_chord}7M`];
      functionsList = ['Dominante (Tensão Máxima)', 'Tônica (Resolução / Descanso)'];
      cadenceDesc = 'É a mãe de todas as resoluções. O quinto grau com sétima arrasta a harmonia de volta para a tônica com força monumental. Os ouvidos humanos estão condicionados há 400 anos para esperar esse repouso imediato.';
    } else if (diffSemitones === 2) {
      // ii -> V -> I
      progressionName = 'Cadência II - V - I (Jazz & MPB Sofisticado)';
      const iiChord = cleanChord.includes('7') ? cleanChord : `${cleanChord}7`;
      const vChord = `${V_chord}7`;
      const iChord = `${I_chord}7M`;
      sequence = [iiChord, vChord, iChord];
      functionsList = ['Subdominante (Preparação)', 'Dominante (Tensão Máxima)', 'Tônica (Resolução / Descanso)'];
      cadenceDesc = 'A cadência mais famosa da música ocidental. Começa com uma tensão amigável, migra para a máxima tensão e resolve em paz absoluta na tônica.';
    } else if (diffSemitones === 5) {
      // IV -> I
      progressionName = 'A Cadência Plagal (IV - I)';
      sequence = [cleanChord, I_chord];
      functionsList = ['Subdominante (Passagem / Entrega)', 'Tônica (Repouso)'];
      cadenceDesc = 'Sua assinatura harmônica é calma e pastoral. Conhecida universalmente como a cadência do "Amém" no final de hinos clássicos no hinário tradicional, ela faz a transição do IV grau (Subdominante) diretamente para a tônica sem a instabilidade tensa da Dominante.';
    } else {
      // I, vi ou iii -> Progressão de Ouro do Louvor
      progressionName = 'Progressão de Ouro do Louvor (I - V - VIm - IV)';
      sequence = [I_chord, V_chord, vi_chord, IV_chord];
      functionsList = ['Tônica (Casa)', 'Dominante (Decolar)', 'Tônica Menor (Contemplativo)', 'Subdominante (Entrega)'];
      cadenceDesc = "Responsável por centenas de hinos lendários como 'Ousado Amor', 'Alvo Mais que a Neve' e 'Aclame ao Senhor'.";
    }
  } else {
    // Tonalidade Menor (Capítulo 3 / Adoração Menor)
    if (diffSemitones === 5) {
      progressionName = 'Movimento de Contrição (iv - Im)';
      sequence = [cleanChord, I_chord];
      functionsList = ['Subdominante Menor', 'Tônica Menor'];
      cadenceDesc = 'Subdominante menor que reforça o sentimento orante e de súplica antes da confirmação da fé.';
    } else {
      progressionName = 'Cadência de Adoração Menor Épica (Im - bVI - bIII - bVII)';
      sequence = [
        I_chord,
        harmonicField[5]?.chord || 'bVI',
        harmonicField[2]?.chord || 'bIII',
        harmonicField[6]?.chord || 'bVII'
      ];
      functionsList = ['Tônica Menor', 'Subdominante Maior', 'Relativa Maior', 'Subtônica Dominante'];
      cadenceDesc = 'Gera grande dinâmica e profundidade espiritual, levando a congregação do quebrantamento inicial a um clímax triunfante.';
    }
  }

  const flowText = sequence.join(' ➔ ');

  // 4. Anatomia e Decomposição dos Intervalos
  const notes: ChordNoteDecomposition[] = [];
  const rootIndexVal = noteIndex(chordRoot);

  // Determinar fórmula dos intervalos com base no sufixo
  const sfx = chordSuffix.toLowerCase();
  const isMinorChord = sfx.startsWith('m') && !sfx.startsWith('maj');
  const isDim = sfx.includes('dim') || sfx.includes('°') || sfx.includes('º');
  const isAug = sfx.includes('aug') || sfx.includes('+');
  const isSus2 = sfx.includes('sus2') || sfx === '2';
  const isSus4 = sfx.includes('sus4') || sfx === '4';
  const has7m = sfx.includes('7') && !sfx.includes('7m') && !sfx.includes('maj7') && !sfx.includes('7+');
  const has7M = sfx.includes('7m') || sfx.includes('maj7') || sfx.includes('7+');
  const has9 = sfx.includes('9') || sfx.includes('add9');

  // Adicionar Fundamental
  notes.push({
    note: chordRoot,
    intervalName: 'T',
    semitonesFromRoot: 0,
    role: 'Fundamental (Tônica do Acorde) - Define o centro de afinação principal'
  });

  // Baixo se for diferente da fundamental
  if (bassNote && normalizeNote(bassNote) !== normalizeNote(chordRoot)) {
    const bDiff = (noteIndex(bassNote) - rootIndexVal + 12) % 12;
    const bIntervalName = bDiff === 4 ? '3ªM' : bDiff === 3 ? '3ªm' : bDiff === 7 ? '5ªJ' : bDiff === 10 ? '7m' : bDiff === 11 ? '7M' : bDiff === 2 ? '9ª/2ª' : 'Baixo';
    notes.unshift({
      note: bassNote,
      intervalName: bIntervalName,
      semitonesFromRoot: bDiff,
      role: `Baixo invertido (${bIntervalName}) - Guia a linha melódica dos graves`,
      isBass: true
    });
  }

  // Terça ou Sus
  if (isSus2) {
    notes.push({
      note: getNoteByOffset(chordRoot, 2, preferFlats),
      intervalName: '2ªM (sus2)',
      semitonesFromRoot: 2,
      role: 'Segunda suspensa - Substitui a terça trazendo sensação moderna e aberta'
    });
  } else if (isSus4) {
    notes.push({
      note: getNoteByOffset(chordRoot, 5, preferFlats),
      intervalName: '4ªJ (sus4)',
      semitonesFromRoot: 5,
      role: 'Quarta suspensa - Suspende a harmonia criando suave tensão que pede a 3ª'
    });
  } else if (isMinorChord) {
    notes.push({
      note: getNoteByOffset(chordRoot, 3, preferFlats),
      intervalName: '3ªm',
      semitonesFromRoot: 3,
      role: 'Terça Menor - Define o caráter menor, intimista e reverente'
    });
  } else {
    notes.push({
      note: getNoteByOffset(chordRoot, 4, preferFlats),
      intervalName: '3ªM',
      semitonesFromRoot: 4,
      role: 'Terça Maior - Define o caráter maior, aberto, triunfante e celebrativo'
    });
  }

  // Quinta
  if (isDim) {
    notes.push({
      note: getNoteByOffset(chordRoot, 6, preferFlats),
      intervalName: '5ª dim (b5)',
      semitonesFromRoot: 6,
      role: 'Quinta Diminuta - Gera o trítono com a fundamental, provocando tensão'
    });
  } else if (isAug) {
    notes.push({
      note: getNoteByOffset(chordRoot, 8, preferFlats),
      intervalName: '5ª aum (#5)',
      semitonesFromRoot: 8,
      role: 'Quinta Aumentada - Abre a harmonia para cima com tensão direcional'
    });
  } else {
    notes.push({
      note: getNoteByOffset(chordRoot, 7, preferFlats),
      intervalName: '5ªJ',
      semitonesFromRoot: 7,
      role: 'Quinta Justa - Dá corpo, estabilidade e peso harmônico ao acorde'
    });
  }

  // Sétima
  if (has7M) {
    notes.push({
      note: getNoteByOffset(chordRoot, 11, preferFlats),
      intervalName: '7M',
      semitonesFromRoot: 11,
      role: 'Sétima Maior - Confere sofisticação, nobreza e sonoridade de louvor contemporâneo'
    });
  } else if (has7m) {
    notes.push({
      note: getNoteByOffset(chordRoot, 10, preferFlats),
      intervalName: '7m',
      semitonesFromRoot: 10,
      role: 'Sétima Menor - Intensifica a preparação dominante ou estilo blues/gospel'
    });
  }

  // Nona
  if (has9) {
    notes.push({
      note: getNoteByOffset(chordRoot, 2, preferFlats),
      intervalName: '9ªM',
      semitonesFromRoot: 2,
      role: 'Nona Adicionada (add9) - Brilho estético que expande o acorde sem gerar atrito'
    });
  }

  const chordFormula = notes.filter(n => !n.isBass).map(n => n.intervalName).join(' - ');

  // Extensões disponíveis sugeridas
  const extensionsAvailable = isMinorChord
    ? ['7m (Menor com Sétima)', '9ª (Nona Intimista)', '11ª (Worship Open)', 'sus4']
    : ['add9 (Nona de Brilho)', '7M (Sétima Maior Nobre)', 'sus4 (Tensão Suspensiva)', '6ª (Doçura Acústica)'];

  // 5. Dicas Práticas & Rearmonizações
  let guitarTip = '';
  let pianoTip = '';
  const substitutions: { chord: string; title: string; reason: string }[] = [];

  if (bassNote) {
    guitarTip = `No violão, valorize a corda do baixo (${bassNote}) no toque do polegar. Se for um acorde invertido com baixo em cordas intermediárias, silencie com cuidado a 6ª corda para não embolar o som com o contrabaixo.`;
    pianoTip = `No teclado, faça a oitava do baixo (${bassNote}) bem firme na mão esquerda. Na mão direita, toque o acorde ${baseChord} em bloco ou arpejado na região média para deixar espaço aos vocais.`;
    
    substitutions.push({
      chord: `${baseChord}add9/${bassNote}`,
      title: 'Abertura com Nona no Topo',
      reason: `Adiciona uma nota de brilho na voz superior enquanto o baixo mantém a linha firme.`
    });
    substitutions.push({
      chord: `${baseChord}`,
      title: 'Forma Fundamental Direta',
      reason: `Opção mais simples e direta caso o contrabaixista já esteja executando a inversão de baixo sozinho.`
    });
  } else if (isMinorChord) {
    guitarTip = `Para o violão em ${cleanChord}, experimente deixar a corda Sol ou Si solta em dedilhados arpejados para criar uma ressonância contínua característica do worship.`;
    pianoTip = `No piano, toque a fundamental e quinta na mão esquerda e use a mão direita para abrir uma nona ou sétima menor, enriquecendo o preenchimento sonoro.`;
    
    substitutions.push({
      chord: `${chordRoot}m7`,
      title: 'Menor com Sétima Menor',
      reason: 'Aveluda o acorde e suaviza a rigidez da tríade menor pura.'
    });
    substitutions.push({
      chord: `${chordRoot}m(add9)`,
      title: 'Menor com Nona Adicionada',
      reason: 'Cria uma das sonoridades mais orantes e introspectivas para momentos de ministração.'
    });
  } else {
    guitarTip = `No violão em ${cleanChord}, use batidas com ênfase nas cordas centrais nos versos, liberando a amplitude total do braço somente no refrão para dar dinâmica.`;
    pianoTip = `No piano acústico, utilize o voicing Drop-2 (abrindo a terça e a nona) para criar uma base larga e arejada sem sujar o meio do arranjo.`;

    substitutions.push({
      chord: `${chordRoot}add9`,
      title: 'Maior com Nona',
      reason: 'Aumenta a doçura e a modernidade do acorde no louvor sem mudar sua função.'
    });
    substitutions.push({
      chord: `${chordRoot}sus4`,
      title: 'Suspensão de Expectativa',
      reason: 'Toque o sus4 no primeiro tempo do compasso e resolva no acorde natural no segundo tempo.'
    });
  }

  const fieldPositionText = isDiatonic
    ? `Ocupa o ${degreeNumber}º grau (${degreeRoman}) do Campo Harmônico de ${keyRoot}${isMinorKey ? 'm' : ''}.`
    : `Acorde cromático especial (${degreeRoman}), atuando como ${diatonicType.toLowerCase()} em relação ao tom de ${keyRoot}.`;

  return {
    chord: cleanChord,
    baseChord,
    bassNote,
    songKey: keyStr,
    isMinorKey,
    keyRoot,
    degreeRoman,
    degreeNumber,
    functionType,
    functionBadge,
    functionExplanation,
    spiritualMood,
    harmonicField,
    fieldPositionText,
    isDiatonic,
    diatonicType,
    cadenceContext: {
      progressionName,
      sequence,
      description: cadenceDesc,
      flowText,
      functions: functionsList,
      songFlow
    },
    notes,
    chordFormula,
    extensionsAvailable,
    guitarTip,
    pianoTip,
    substitutions
  };
}
