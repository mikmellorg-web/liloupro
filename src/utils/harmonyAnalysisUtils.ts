/**
 * LiLouPro - Engine Determinístico de Teoria Musical e Análise Harmônica
 * Garante 100% de disponibilidade, tolerância a falhas e resposta instantânea (0ms)
 * para os Recursos Exclusivos LiLouPro ("Aprenda com a Música - Harmonia").
 */

export interface HarmonicDegreeInfo {
  degree: string;
  chord: string;
  functionType: string;
  explanation: string;
}

export interface ChordAnalysisItem {
  chord: string;
  degree: string;
  role: string;
  description: string;
}

export interface CadenceItem {
  name: string;
  progression: string;
  description: string;
}

export interface SpecialChordItem {
  chord: string;
  concept: string;
  explanation: string;
}

export interface MusicianTips {
  keyboardist: string;
  guitarist: string;
  vocalist: string;
  bassist: string;
}

export interface HarmonyAnalysisResult {
  detectedKey: string;
  scaleNotes: string[];
  scaleType: string;
  harmonicField: HarmonicDegreeInfo[];
  chordsAnalysis: ChordAnalysisItem[];
  cadencesFound: CadenceItem[];
  specialChords: SpecialChordItem[];
  musicianTips: MusicianTips;
}

const MAJOR_SCALES: Record<string, { notes: string[]; chords: string[] }> = {
  'C':  { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'] },
  'G':  { notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'], chords: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'] },
  'D':  { notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'], chords: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'] },
  'A':  { notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'], chords: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'] },
  'E':  { notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'], chords: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'] },
  'B':  { notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'], chords: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'] },
  'F#': { notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'], chords: ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'] },
  'Gb': { notes: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'], chords: ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim'] },
  'F':  { notes: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'], chords: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'] },
  'Bb': { notes: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'], chords: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'] },
  'Eb': { notes: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'], chords: ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'] },
  'Ab': { notes: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'], chords: ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'] },
  'Db': { notes: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'], chords: ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'] },
  'C#': { notes: ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'], chords: ['C#', 'D#m', 'E#m', 'F#', 'G#', 'A#m', 'B#dim'] }
};

const MINOR_SCALES: Record<string, { notes: string[]; chords: string[] }> = {
  'Am':  { notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], chords: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'] },
  'Em':  { notes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'], chords: ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'] },
  'Bm':  { notes: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'], chords: ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A'] },
  'F#m': { notes: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'], chords: ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E'] },
  'C#m': { notes: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'], chords: ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B'] },
  'G#m': { notes: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'], chords: ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#'] },
  'Dm':  { notes: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'], chords: ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'] },
  'Gm':  { notes: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'], chords: ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F'] },
  'Cm':  { notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'], chords: ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'] },
  'Fm':  { notes: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'], chords: ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb'] },
  'Bbm': { notes: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'], chords: ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab'] },
  'Ebm': { notes: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'], chords: ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'Cb', 'Db'] }
};

export function generateDeterministicHarmonyAnalysis(
  title: string,
  content: string,
  baseKey?: string
): HarmonyAnalysisResult {
  let keyStr = (baseKey || '').trim().replace(/^Tom:\s*/i, '').replace(/\s+(Major|Maior|Minor|Menor)/i, '');
  let isMinor = false;
  let root = 'C';

  const m = keyStr.match(/^([A-G][#b]?)(m(?:enor|in)?)?/i);
  if (m) {
    root = m[1].charAt(0).toUpperCase() + (m[1].charAt(1) ? m[1].charAt(1).toLowerCase() : '');
    isMinor = !!m[2];
  } else {
    const chordMatches = (content || '').match(/\b([A-G][#b]?)(m(?:[a-zA-Z0-9]*)?)?/g) || [];
    if (chordMatches.length > 0) {
      const first = chordMatches[0].match(/^([A-G][#b]?)(m)?/);
      if (first) {
        root = first[1].charAt(0).toUpperCase() + (first[1].charAt(1) ? first[1].charAt(1).toLowerCase() : '');
        isMinor = !!first[2];
      }
    }
  }

  const lookupKey = isMinor ? `${root}m` : root;
  const scaleInfo = (isMinor ? MINOR_SCALES[lookupKey] : MAJOR_SCALES[lookupKey]) ||
    MAJOR_SCALES['C'] || { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'] };
  const detectedKeyDisplay = isMinor ? `${root}m` : root;
  const scaleType = isMinor ? 'Menor Natural' : 'Maior Diatônica';

  const majorDegrees = [
    { degree: 'I', func: 'Tônica', desc: 'O centro tonal de repouso e paz onde a melodia encontra descanso e segurança espiritual.' },
    { degree: 'ii', func: 'Subdominante', desc: 'Acorde menor preparatório suave que gera movimento sutil em direção ao clímax.' },
    { degree: 'iii', func: 'Tônica', desc: 'Tônica secundária meditativa que confere um tom introspectivo e intimista.' },
    { degree: 'IV', func: 'Subdominante', desc: 'Acorde de abertura emocional e expansão da adoração no altar.' },
    { degree: 'V', func: 'Dominante', desc: 'Gera tensão harmônica direcional que clama com força pela resolução na Tônica.' },
    { degree: 'vi', func: 'Tônica', desc: 'Relativa menor de profunda contrição, reflexão e reverência congregacional.' },
    { degree: 'vii°', func: 'Dominante', desc: 'Tensão máxima contendo o trítono, direcionando com intensidade à Tônica.' }
  ];

  const minorDegrees = [
    { degree: 'Im', func: 'Tônica', desc: 'Centro tonal menor, transmitindo reverência profunda e solenidade.' },
    { degree: 'ii°', func: 'Subdominante', desc: 'Tensão intermediária que prepara a transição para a dominante ou relativa maior.' },
    { degree: 'bIII', func: 'Tônica', desc: 'Relativa maior do tom menor, introduzindo alívio, brilho e esperança na melodia.' },
    { degree: 'iv', func: 'Subdominante', desc: 'Afastamento reflexivo e orante que aprofunda a expressão vocal.' },
    { degree: 'v', func: 'Dominante', desc: 'Tensão direcional suave que guia o retorno ao centro tonal menor.' },
    { degree: 'bVI', func: 'Subdominante', desc: 'Acorde de grande impacto dramático e decolagem congregacional.' },
    { degree: 'bVII', func: 'Dominante', desc: 'Subtom inspirador e resolutivo, característico do worship moderno.' }
  ];

  const degConfigs = isMinor ? minorDegrees : majorDegrees;
  const harmonicField: HarmonicDegreeInfo[] = scaleInfo.chords.map((ch, idx) => ({
    degree: degConfigs[idx].degree,
    chord: ch,
    functionType: degConfigs[idx].func,
    explanation: degConfigs[idx].desc
  }));

  // Extrai acordes da canção
  const rawTokens = (content || '').match(/\b([A-G][#b]?(?:m|maj|M|dim|aug|sus[24]?|add[9]?|[0-9]+)*(?:\/[A-G][#b]?)?)/g) || [];
  const uniqueChords = Array.from(new Set(rawTokens.filter(t => !['A', 'E', 'O'].includes(t) || rawTokens.length <= 3))).slice(0, 10);

  const chordsAnalysis: ChordAnalysisItem[] = uniqueChords.map(ch => {
    const foundIdx = scaleInfo.chords.findIndex(sc => ch.startsWith(sc) || sc.startsWith(ch));
    if (foundIdx !== -1) {
      return {
        chord: ch,
        degree: degConfigs[foundIdx].degree,
        role: degConfigs[foundIdx].func === 'Tônica' ? 'Repouso / Estabilidade' : degConfigs[foundIdx].func === 'Subdominante' ? 'Movimento / Abertura' : 'Tensão / Preparação',
        description: degConfigs[foundIdx].desc
      };
    }
    return {
      chord: ch,
      degree: ch.includes('/') ? 'Inversão' : 'Acorde de Passagem',
      role: ch.includes('/') ? 'Condução Melódica do Baixo' : 'Coloração Harmônica',
      description: `Enriquece a harmonia tonal com nuances melódicas e sustentação dinâmica.`
    };
  });

  if (chordsAnalysis.length === 0) {
    harmonicField.slice(0, 4).forEach(hf => {
      chordsAnalysis.push({
        chord: hf.chord,
        degree: hf.degree,
        role: hf.functionType,
        description: hf.explanation
      });
    });
  }

  // Cadências
  const cadencesFound: CadenceItem[] = [];
  if (!isMinor) {
    const I = scaleInfo.chords[0];
    const IV = scaleInfo.chords[3];
    const V = scaleInfo.chords[4];
    const vi = scaleInfo.chords[5];
    const ii = scaleInfo.chords[1];

    cadencesFound.push({
      name: `Progressão de Ouro do Louvor (I - V - vi - IV)`,
      progression: `${I} -> ${V} -> ${vi} -> ${IV}`,
      description: `A cadência mais consagrada do louvor contemporâneo. Cria uma jornada emocional perfeita entre celebração, reverência e entrega congregacional.`
    });

    cadencesFound.push({
      name: `Cadência Autêntica Preparada (ii - V - I)`,
      progression: `${ii} -> ${V} -> ${I}`,
      description: `Move com suavidade da subdominante para a máxima tensão da dominante, resolvendo em plenitude de paz na tônica.`
    });

    cadencesFound.push({
      name: `Cadência Plagal de Altar (IV - I)`,
      progression: `${IV} -> ${I}`,
      description: `Tradicionalmente conhecida como a 'Cadência do Amém', confere uma sensação bíblica de encerramento doce e solene.`
    });
  } else {
    const Im = scaleInfo.chords[0];
    const bVI = scaleInfo.chords[5];
    const bIII = scaleInfo.chords[2];
    const bVII = scaleInfo.chords[6];
    const iv = scaleInfo.chords[3];

    cadencesFound.push({
      name: `Cadência de Adoração Menor Épica (Im - bVI - bIII - bVII)`,
      progression: `${Im} -> ${bVI} -> ${bIII} -> ${bVII}`,
      description: `Gera grande dinâmica e profundidade espiritual, levando a congregação do quebrantamento inicial a um clímax triunfante.`
    });

    cadencesFound.push({
      name: `Movimento de Contrição (iv - Im)`,
      progression: `${iv} -> ${Im}`,
      description: `Subdominante menor que reforça o sentimento orante e de súplica antes da confirmação da fé.`
    });
  }

  // Acordes especiais
  const specialChords: SpecialChordItem[] = [];
  if (!isMinor) {
    const IVm = scaleInfo.chords[3] + 'm';
    const V_over_bass = `${scaleInfo.chords[4]}/${scaleInfo.notes[6]}`;
    specialChords.push({
      chord: IVm,
      concept: `Dica de Arranjo: A.E.M. (Acorde de Empréstimo Modal - iv menor)`,
      explanation: `Sugestão rica para o altar: experimente tocar ${scaleInfo.chords[3]} seguido por ${IVm} antes de resolver na tônica ${scaleInfo.chords[0]}. Esse empréstimo modal do homônimo menor injeta uma emoção profunda de comoção e entrega no refrão.`
    });
    specialChords.push({
      chord: V_over_bass,
      concept: `Dica de Condução: Inversão com Baixo Descendente`,
      explanation: `Substitua a passagem direta da Tônica ${scaleInfo.chords[0]} para a Relativa ${scaleInfo.chords[5]} por ${scaleInfo.chords[0]} → ${V_over_bass} → ${scaleInfo.chords[5]}. A linha de baixo descendente traz elegância instantânea.`
    });
  } else {
    const V7 = scaleInfo.notes[4] + '7';
    specialChords.push({
      chord: V7,
      concept: `Dica de Arranjo: Dominante Maior com Sétima (V7)`,
      explanation: `Experimente usar a dominante maior ${V7} em vez do v menor para criar uma atração magnética e imediata de volta à tônica ${scaleInfo.chords[0]}.`
    });
  }

  const tipsRoot = detectedKeyDisplay;
  const musicianTips: MusicianTips = {
    keyboardist: `Para a tonalidade de ${tipsRoot}, utilize voicings abertos (Drop 2) no piano acústico. Na mão esquerda, sustente a fundamental oitavada ou com quinta, e na mão direita explore terças e nonas adicionadas (add9) para abrir o som do louvor.`,
    guitarist: `No violão no tom de ${tipsRoot}, prefira dedilhados arpejados nas estrofes mais intimistas. Deixe as cordas soltas ressoarem para preencher o ambiente sonoro sem disputar espaço com os vocais.`,
    vocalist: `A tonalidade de ${tipsRoot} possui momentos de descanso e tensão bem definidos. Inicie os versos com emissão suave e deixe a abertura de vozes (segunda e terça) para o ápice do refrão.`,
    bassist: `Marque com firmeza os tempos fortes nas tônicas de ${tipsRoot}. Em momentos de dinâmica alta, conecte os acordes com notas de passagem pela escala pentatônica ou pela quinta justa.`
  };

  return {
    detectedKey: detectedKeyDisplay,
    scaleNotes: scaleInfo.notes,
    scaleType,
    harmonicField,
    chordsAnalysis,
    cadencesFound,
    specialChords,
    musicianTips
  };
}
