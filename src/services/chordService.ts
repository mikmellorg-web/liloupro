
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
const SHARPS_TO_FLATS: Record<string, string> = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };

// Comprehensive, strict regex pattern for valid musical chord quality/extensions (suffixes)
// Prevents false positive matching on non-chord Portuguese/English words like "alma", "fogo", "deus", "com"
// Accurately supports 7+, 7+(9), 7M(9), 7(9), 7+(#11), m7+(9), parenthesized extensions, and slash basses
const CHORD_SUFFIX_PATTERN = /^(?:m(?:aj|in)?|M|Δ|dim|°|º|ø|aug|\+|sus[249]?|add[0-9]{1,2}|omit[35]|no[35]|alt)?(?:[0-9]{1,2}(?:M|m|maj|\+|Δ|\-)?|\+|\-|\/)?(?:(?:\/|\+)[0-9]{1,2}[b#\+\-]?)?(?:\((?:[b#]?[0-9]{1,2}[b#\+\-]?|add[0-9]{1,2}|sus[249]?|maj7?|7\+|7M|omit[35]|no[35]|[b#]5|[b#]9|[b#]11|[b#]13|[0-9]{1,2}\/[0-9]{1,2}|[b#]?[0-9]{1,2}\/[b#]?[0-9]{1,2}|\+|\-|\-5|\+5)\))*(?:\/(?:\([A-G][#b]?\)|[A-G][#b]?|b?[1-7]M?|\#[1-7]|\([1-7]M?\)))?$/i;

// Master Chord Finder Regex - accurately extracts full musical chords (including slash chords like C/E, D/F#, G/B, Bb/D, C/3, A7+(9), etc.)
export const CHORD_FINDER_REGEX = /([A-G][#b]?(?:m(?:aj|in)?|M|Δ|dim|°|º|ø|aug|\+|sus[249]?|add[0-9]{1,2}|omit[35]|no[35]|alt)?(?:[0-9]{1,2}(?:M|m|maj|\+|Δ|\-)?|\+|\-|\/)?(?:(?:\/|\+)[0-9]{1,2}[b#\+\-]?)?(?:\((?:[b#]?[0-9]{1,2}[b#\+\-]?|add[0-9]{1,2}|sus[249]?|maj7?|7\+|7M|omit[35]|no[35]|[b#]5|[b#]9|[b#]11|[b#]13|[0-9]{1,2}\/[0-9]{1,2}|[b#]?[0-9]{1,2}\/[b#]?[0-9]{1,2}|\+|\-|\-5|\+5)\))*(?:\/(?:\([A-G][#b]?\)|[A-G][#b]?|b?[1-7]M?|\#[1-7]|\([1-7]M?\)))?)/g;

export type HarmonicDisplayMode = 'chords' | 'numbers' | 'roman' | 'functions';

export function getNoteDegreeInfo(note: string, keyRoot: string) {
  let cleanNote = note;
  if (FLATS[cleanNote]) cleanNote = FLATS[cleanNote];

  let cleanKey = keyRoot.match(/^([A-G][#b]?)/)?.[1] || 'C';
  if (FLATS[cleanKey]) cleanKey = FLATS[cleanKey];

  const noteIdx = NOTES.indexOf(cleanNote);
  const keyIdx = NOTES.indexOf(cleanKey);
  if (noteIdx === -1 || keyIdx === -1) return null;

  const semitones = (noteIdx - keyIdx + 12) % 12;

  switch (semitones) {
    case 0:
      return { num: '1', roman: 'I', func: 'Tôn', bassNum: '1', bassRoman: '1', bassFunc: '1ª' };
    case 1:
      return { num: 'b2', roman: 'bII', func: 'b2', bassNum: 'b2', bassRoman: 'b2', bassFunc: 'b2ª' };
    case 2:
      return { num: '2', roman: 'II', func: 'SubR', bassNum: '2', bassRoman: '2', bassFunc: '2ª' };
    case 3:
      return { num: 'b3', roman: 'bIII', func: 'b3', bassNum: 'b3', bassRoman: 'b3', bassFunc: 'b3ª' };
    case 4:
      return { num: '3', roman: 'III', func: 'Med', bassNum: '3', bassRoman: '3', bassFunc: '3ª' };
    case 5:
      return { num: '4', roman: 'IV', func: 'Subd', bassNum: '4', bassRoman: '4', bassFunc: '4ª' };
    case 6:
      return { num: 'b5', roman: 'bV', func: '#4', bassNum: 'b5', bassRoman: 'b5', bassFunc: '#4' };
    case 7:
      return { num: '5', roman: 'V', func: 'Dom', bassNum: '5', bassRoman: '5', bassFunc: '5ª' };
    case 8:
      return { num: 'b6', roman: 'bVI', func: 'b6', bassNum: 'b6', bassRoman: 'b6', bassFunc: 'b6ª' };
    case 9:
      return { num: '6', roman: 'VI', func: 'Rel', bassNum: '6', bassRoman: '6', bassFunc: '6ª' };
    case 10:
      return { num: 'b7', roman: 'bVII', func: 'SubT', bassNum: 'b7', bassRoman: 'b7', bassFunc: 'b7ª' };
    case 11:
      return { num: '7', roman: 'VII', func: 'Sens', bassNum: '7', bassRoman: '7', bassFunc: '7ª' };
    default:
      return { num: '1', roman: 'I', func: 'Tôn', bassNum: '1', bassRoman: '1', bassFunc: '1ª' };
  }
}

export function getChordBassIntervalInfo(bassNote: string, chordRoot: string) {
  let cleanBass = bassNote;
  if (FLATS[cleanBass]) cleanBass = FLATS[cleanBass];

  let cleanRoot = chordRoot;
  if (FLATS[cleanRoot]) cleanRoot = FLATS[cleanRoot];

  const bassIdx = NOTES.indexOf(cleanBass);
  const rootIdx = NOTES.indexOf(cleanRoot);
  if (bassIdx === -1 || rootIdx === -1) return null;

  const semitones = (bassIdx - rootIdx + 12) % 12;

  switch (semitones) {
    case 0:
      return { num: '1', roman: '1', func: '1ª' };
    case 1:
      return { num: 'b2', roman: 'b2', func: 'b2ª' };
    case 2:
      return { num: '2', roman: '2', func: '2ª' };
    case 3:
      return { num: '3', roman: '3', func: '3ª' };
    case 4:
      return { num: '3', roman: '3', func: '3ª' };
    case 5:
      return { num: '4', roman: '4', func: '4ª' };
    case 6:
      return { num: 'b5', roman: 'b5', func: '#4' };
    case 7:
      return { num: '5', roman: '5', func: '5ª' };
    case 8:
      return { num: 'b6', roman: 'b6', func: 'b6ª' };
    case 9:
      return { num: '6', roman: '6', func: '6ª' };
    case 10:
      return { num: '7', roman: '7', func: '7ª' };
    case 11:
      return { num: '7M', roman: '7M', func: '7M' };
    default:
      return { num: '1', roman: '1', func: '1ª' };
  }
}

export function convertSingleChordToHarmonicMode(chord: string, songKey: string, mode: HarmonicDisplayMode): string {
  if (!chord || mode === 'chords' || !songKey || songKey === '-') return chord;

  const cleanChordName = getCleanChordName(chord);
  if (!cleanChordName) return chord;

  const keyRoot = songKey.match(/^([A-G][#b]?)/)?.[1] || 'C';

  let prePart = cleanChordName;
  let bassPart = '';
  if (cleanChordName.includes('/')) {
    const parts = cleanChordName.split('/');
    prePart = parts[0];
    bassPart = parts[1];
  }

  const match = prePart.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const rootNote = match[1];
  const suffix = match[2] || '';

  const degInfo = getNoteDegreeInfo(rootNote, keyRoot);
  if (!degInfo) return chord;

  let formattedPre = '';

  if (mode === 'numbers') {
    const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
    if (isMinor && degInfo.num.startsWith('b')) {
      formattedPre = `${degInfo.num}${suffix.substring(1)}`;
    } else {
      formattedPre = `${degInfo.num}${suffix}`;
    }
  } else if (mode === 'roman') {
    const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
    if (isMinor) {
      formattedPre = `${degInfo.roman}m${suffix.substring(1)}`;
    } else {
      formattedPre = `${degInfo.roman}${suffix}`;
    }
  } else if (mode === 'functions') {
    const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
    const isNaturallyMinorDegree = ['SubR', 'Med', 'Rel', 'Sens', 'Cad'].includes(degInfo.func);

    if (isNaturallyMinorDegree) {
      if (isMinor) {
        // Dm -> SubR, Am -> Rel, Em -> Med (strip 'm' as function name implies minor)
        const extra = suffix.substring(1);
        formattedPre = `${degInfo.func}${extra}`;
      } else {
        // D -> SubRM, A -> RelM, E -> MedM (explicit 'M' indicates Major / Dominant)
        formattedPre = `${degInfo.func}M${suffix}`;
      }
    } else {
      // Naturally Major degrees: Tôn, Subd, Dom, SubT
      formattedPre = `${degInfo.func}${suffix}`;
    }
  }

  let formattedBass = '';
  if (bassPart) {
    const bassMatch = bassPart.match(/^([A-G][#b]?)/);
    if (bassMatch) {
      const bassNote = bassMatch[1];
      const bassInfo = getChordBassIntervalInfo(bassNote, rootNote);
      if (bassInfo) {
        if (mode === 'numbers') {
          formattedBass = `/${bassInfo.num}`;
        } else if (mode === 'roman') {
          formattedBass = `/${bassInfo.roman}`;
        } else if (mode === 'functions') {
          formattedBass = `/${bassInfo.func}`;
        }
      }
    }
  }

  return `${formattedPre}${formattedBass}`;
}

export function convertLyricsAndChordsToHarmonicMode(text: string, songKey: string, mode: HarmonicDisplayMode): string {
  if (!text || mode === 'chords' || !songKey || songKey === '-') return text;

  return text.split(/\r?\n/).map(line => {
    if (isChordLine(line)) {
      const chordRegex = new RegExp(CHORD_FINDER_REGEX);
      let match: RegExpExecArray | null;
      const matches: { chord: string; index: number; newChord: string }[] = [];
      
      while ((match = chordRegex.exec(line)) !== null) {
        if (isChordWord(match[0])) {
          matches.push({
            chord: match[0],
            index: match.index,
            newChord: convertSingleChordToHarmonicMode(match[0], songKey, mode)
          });
        }
      }

      if (matches.length === 0) return line;

      let charBuffer = line.split('');

      for (let i = matches.length - 1; i >= 0; i--) {
        const { chord, index, newChord } = matches[i];
        
        charBuffer.splice(index, chord.length);
        const newChordChars = newChord.split('');
        charBuffer.splice(index, 0, ...newChordChars);

        const diff = newChord.length - chord.length;
        if (diff > 0) {
          let searchIndex = index + newChord.length;
          let availableSpaces = 0;
          while (searchIndex + availableSpaces < charBuffer.length && charBuffer[searchIndex + availableSpaces] === ' ') {
            availableSpaces++;
          }

          const nextChar = (searchIndex + availableSpaces < charBuffer.length) 
            ? charBuffer[searchIndex + availableSpaces] 
            : '';

          let minSpacesToKeep = 2;
          if (nextChar === '|' || nextChar === ']' || nextChar === '}' || nextChar === ')' || nextChar === '/') {
            minSpacesToKeep = 1;
          } else if (!nextChar) {
            minSpacesToKeep = 0;
          }

          const maxRemovable = Math.max(0, availableSpaces - minSpacesToKeep);
          const spacesToRemove = Math.min(diff, maxRemovable);

          for (let s = 0; s < spacesToRemove; s++) {
            charBuffer.splice(searchIndex, 1);
          }

          if (availableSpaces === 0 && /[a-zA-Z0-9]/.test(nextChar)) {
            charBuffer.splice(searchIndex, 0, ' ', ' ');
          }
        } else if (diff < 0) {
          const spacesToAdd = Math.abs(diff);
          for (let s = 0; s < spacesToAdd; s++) {
            charBuffer.splice(index + newChord.length, 0, ' ');
          }
        } else {
          let searchIndex = index + newChord.length;
          let availableSpaces = 0;
          while (searchIndex + availableSpaces < charBuffer.length && charBuffer[searchIndex + availableSpaces] === ' ') {
            availableSpaces++;
          }
          const nextChar = (searchIndex + availableSpaces < charBuffer.length) 
            ? charBuffer[searchIndex + availableSpaces] 
            : '';
          if (availableSpaces === 0 && /[a-zA-Z0-9]/.test(nextChar)) {
            charBuffer.splice(searchIndex, 0, ' ', ' ');
          }
        }
      }
      
      return charBuffer.join('');
    }
    return line;
  }).join('\n');
}

function transposeSingleNote(note: string, semitones: number): string {
  if (!note) return note;
  let cleanNote = note;
  const isFlatInput = note.toLowerCase().endsWith('b');
  cleanNote = cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1);

  if (FLATS[cleanNote]) {
    cleanNote = FLATS[cleanNote];
  }
  const index = NOTES.indexOf(cleanNote);
  if (index === -1) return note;

  const newIndex = (index + semitones + 12) % 12;
  const transposedSharp = NOTES[newIndex];

  // Preserve flat format if input note was flat
  if (isFlatInput && SHARPS_TO_FLATS[transposedSharp]) {
    return SHARPS_TO_FLATS[transposedSharp];
  }
  return transposedSharp;
}

function transposeBaseChord(chord: string, semitones: number): string {
  // Regex to extract note, accidental, and suffix (case-insensitive)
  const match = chord.match(/^([a-gA-G][#b]?)(.*)$/);
  if (!match) return chord;

  const note = match[1];
  const suffix = match[2];

  const transposedNote = transposeSingleNote(note, semitones);
  return transposedNote + suffix;
}

export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  const raw = chord.trim();
  const clean = getCleanChordName(raw);
  if (!clean) return chord;

  // Split into root part and slash bass part
  let prePart = clean;
  let bassPart = '';
  const lastSlashIndex = clean.lastIndexOf('/');
  if (lastSlashIndex > 0) {
    prePart = clean.slice(0, lastSlashIndex);
    bassPart = clean.slice(lastSlashIndex + 1);
  }

  // Transpose base chord (root + quality)
  const transposedPre = transposeBaseChord(prePart, semitones);

  // Transpose slash bass note
  let transposedBass = '';
  if (bassPart) {
    const bassParenMatch = bassPart.match(/^(\()?([A-G][#b]?)(\)?)$/i);
    if (bassParenMatch) {
      const openParen = bassParenMatch[1] || '';
      const bassNote = bassParenMatch[2];
      const closeParen = bassParenMatch[3] || '';
      transposedBass = `${openParen}${transposeSingleNote(bassNote, semitones)}${closeParen}`;
    } else if (/^(b|#)?[1-7]M?$/i.test(bassPart)) {
      transposedBass = bassPart;
    } else {
      transposedBass = transposeSingleNote(bassPart, semitones);
    }
  }

  const result = bassPart ? `${transposedPre}/${transposedBass}` : transposedPre;

  // Preserve outer brackets or parens if originally present around chord
  if (raw.startsWith('[') && raw.endsWith(']') && !result.startsWith('[')) {
    return `[${result}]`;
  }
  if (raw.startsWith('(') && raw.endsWith(')') && !result.startsWith('(')) {
    return `(${result})`;
  }

  return result;
}

export function transposeLyricsAndChords(text: string, semitones: number): string {
  if (semitones === 0 || !text) return text;

  return text.split(/\r?\n/).map(line => {
    if (isChordLine(line)) {
      const chordRegex = new RegExp(CHORD_FINDER_REGEX);
      let match: RegExpExecArray | null;
      const matches: { chord: string; index: number; newChord: string }[] = [];
      
      while ((match = chordRegex.exec(line)) !== null) {
        if (isChordWord(match[0])) {
          matches.push({
            chord: match[0],
            index: match.index,
            newChord: transposeChord(match[0], semitones)
          });
        }
      }

      if (matches.length === 0) return line;

      let charBuffer = line.split('');
      
      for (let i = matches.length - 1; i >= 0; i--) {
        const { chord, index, newChord } = matches[i];
        
        charBuffer.splice(index, chord.length);
        const newChordChars = newChord.split('');
        charBuffer.splice(index, 0, ...newChordChars);

        const diff = newChord.length - chord.length;
        if (diff > 0) {
          let searchIndex = index + newChord.length;
          let availableSpaces = 0;
          while (searchIndex + availableSpaces < charBuffer.length && charBuffer[searchIndex + availableSpaces] === ' ') {
            availableSpaces++;
          }

          const nextChar = (searchIndex + availableSpaces < charBuffer.length) 
            ? charBuffer[searchIndex + availableSpaces] 
            : '';

          let minSpacesToKeep = 2;
          if (nextChar === '|' || nextChar === ']' || nextChar === '}' || nextChar === ')' || nextChar === '/') {
            minSpacesToKeep = 1;
          } else if (!nextChar) {
            minSpacesToKeep = 0;
          }

          const maxRemovable = Math.max(0, availableSpaces - minSpacesToKeep);
          const spacesToRemove = Math.min(diff, maxRemovable);

          for (let s = 0; s < spacesToRemove; s++) {
            charBuffer.splice(searchIndex, 1);
          }

          if (availableSpaces === 0 && /[a-zA-Z0-9]/.test(nextChar)) {
            charBuffer.splice(searchIndex, 0, ' ', ' ');
          }
        } else if (diff < 0) {
          const spacesToAdd = Math.abs(diff);
          for (let s = 0; s < spacesToAdd; s++) {
            charBuffer.splice(index + newChord.length, 0, ' ');
          }
        } else {
          let searchIndex = index + newChord.length;
          let availableSpaces = 0;
          while (searchIndex + availableSpaces < charBuffer.length && charBuffer[searchIndex + availableSpaces] === ' ') {
            availableSpaces++;
          }
          const nextChar = (searchIndex + availableSpaces < charBuffer.length) 
            ? charBuffer[searchIndex + availableSpaces] 
            : '';
          if (availableSpaces === 0 && /[a-zA-Z0-9]/.test(nextChar)) {
            charBuffer.splice(searchIndex, 0, ' ', ' ');
          }
        }
      }
      
      return charBuffer.join('');
    }
    return line;
  }).join('\n');
}

export function getCleanChordName(word: string): string {
  let cleanWord = word.trim();
  if (!cleanWord) return '';

  let progress = true;
  while (progress) {
    const startValue = cleanWord;

    // 1. Strip leading and trailing whitespace, punctuation, colons, pipes, etc.
    cleanWord = cleanWord.replace(/^[\s\|\:\.\,\/]+/g, '');
    cleanWord = cleanWord.replace(/[\s\|\:\.\,\/]+$/g, '');

    // 2. Strip matching wrappers
    if (cleanWord.startsWith('[') && cleanWord.endsWith(']')) {
      cleanWord = cleanWord.substring(1, cleanWord.length - 1).trim();
    } else if (cleanWord.startsWith('(') && cleanWord.endsWith(')')) {
      cleanWord = cleanWord.substring(1, cleanWord.length - 1).trim();
    } else if (cleanWord.startsWith('{') && cleanWord.endsWith('}')) {
      cleanWord = cleanWord.substring(1, cleanWord.length - 1).trim();
    }

    // 3. Strip unmatched leading characters
    cleanWord = cleanWord.replace(/^[\(\[\{]+/g, '');

    // 4. Strip unmatched trailing characters
    let openParen = 0, openBracket = 0, openBrace = 0;
    for (const char of cleanWord) {
      if (char === '(') openParen++;
      if (char === ')') openParen--;
      if (char === '[') openBracket++;
      if (char === ']') openBracket--;
      if (char === '{') openBrace++;
      if (char === '}') openBrace--;
    }

    while (openParen < 0 && cleanWord.endsWith(')')) {
      cleanWord = cleanWord.substring(0, cleanWord.length - 1);
      openParen++;
    }
    while (openBracket < 0 && cleanWord.endsWith(']')) {
      cleanWord = cleanWord.substring(0, cleanWord.length - 1);
      openBracket++;
    }
    while (openBrace < 0 && cleanWord.endsWith('}')) {
      cleanWord = cleanWord.substring(0, cleanWord.length - 1);
      openBrace++;
    }

    if (cleanWord === startValue) {
      progress = false;
    }
  }

  // Normalize common chord typos like Fm7m -> Fm7 or Bm7m -> Bm7
  cleanWord = cleanWord.replace(/([A-G][#b]?[a-zA-Z0-9]*)m7m$/i, '$1m7');

  return cleanWord;
}

export function isAnnotationOrHeaderWord(word: string): boolean {
  if (!word) return true;
  // Strip punctuation, brackets, parentheses, colons, pipes, dashes
  const clean = word.toLowerCase()
    .replace(/^[\s\[\(\{\|\,\-:]+|[\s\]\)\}\|\,\-:]+$/g, '')
    .trim();
  
  if (!clean) return true; // Empty after stripping is punctuation/separator

  const headers = [
    'intro', 'introdução', 'introducao', 'instr', 'instrumental', 
    'solo', 'bridge', 'ponte', 'interlúdio', 'interludio', 'interlude', 
    'outro', 'fim', 'final', 'coro', 'refrão', 'refrao', 'chorus',
    'ministração', 'ministracao', 'vocal', 'todos', 'part', 'parte', 'estrofe', 
    'verso', 'verse', 'pre-chorus', 'pré-refrão', 'pre-refrao', 'coda',
    'poslúdio', 'posludio', 'postlude', 'riff', 'dedilhado', 'tom', 'bpm', 'capo',
    'tab', 'tablatura', 'tag', 'hook', 'strophe', 'bis', 'dobra',
    'passagem', 'frase', 'fraseado', 'ritmo', 'batida', 'palhetada', 'abafado',
    'parada', 'caida', 'caída', 'virada', 'subida', 'muda', 'segura', 'mudo', 'pausado',
    'junto', 'juntos', 'igual', 'repetir', 'repete', 'duas', 'três', 'tres', 'quatro',
    'vezes', 'vez', 'primeira', 'segunda', 'terceira', 'quarta', '1a', '2a', '3a', '4a',
    '1ª', '2ª', '3ª', '4ª', '2x', '3x', '4x', '8x',
    'violão', 'violao', 'teclado', 'piano', 'baixo', 'bateria', 'guitarra', 'base',
    'sanfona', 'metais', 'organ', 'pad', 'synth', 'entrada', 'saida', 'saída',
    'pp', 'mp', 'mf', 'ff', 'fff', 'pianissimo', 'pianíssimo', 'suave', 'sussurro',
    'forte', 'fortissimo', 'fortíssimo', 'explosivo', 'pressão', 'crescendo', 'decrescendo', 'diminuindo', 'diminuendo', 'subindo',
    'pausa', 'pause', 'stop', 'corta', '🛑', '⏱️', '⏸️',
    'mezzo-piano', 'meio-suave', 'meio suave', 'mezzo-forte', 'meio-forte', 'meio forte',
    'acapella', 'tutti', 'só bateria', 'so bateria', 'só vozes', 'so vozes', 'groove', 'marcando',
    'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'clímax', 'climax', 'moderado', 'sutil', 'quase silêncio', 'quase silencio', 'bem suave', 'bem', 'só', 'so', 'guita', 'guitar'
  ];
  if (headers.includes(clean)) return true;

  // Repeat count annotations like (2x), (4x), 2x, 3x, bis, (2 vezes), (4 vezes)
  if (/^\(?([0-9]+x|bis|vezes|vez)\)?$/i.test(clean) || /^\(?([0-9]+x|bis)\)?$/i.test(word.trim())) {
    return true;
  }

  // Pure digits inside brackets or as section indices (e.g. [1], 1., 2], etc.)
  if (/^[0-9]+$/.test(clean)) {
    if (/[\{\[\(\}\]\)\.]/.test(word)) return true;
  }

  return false;
}

export function isChordWord(word: string): boolean {
  if (!word) return false;

  if (isAnnotationOrHeaderWord(word)) {
    return false;
  }

  const cleanWord = getCleanChordName(word);
  if (!cleanWord) return false;

  if (isAnnotationOrHeaderWord(cleanWord)) {
    return false;
  }

  // Capitalize root note letter for consistent matching
  const formattedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);

  // 1. Standard Musical Note Ciphers (A-G)
  if (/^[A-G][#b]?/i.test(formattedWord)) {
    const rootMatch = formattedWord.match(/^[A-G][#b]?/i);
    if (!rootMatch) return false;
    const root = rootMatch[0];
    const suffix = formattedWord.slice(root.length);
    if (suffix === '') {
      return true; // Single note chords like "A", "G", "C", "F#", "Eb"
    }

    // Strict suffix check against CHORD_SUFFIX_PATTERN
    if (CHORD_SUFFIX_PATTERN.test(suffix)) {
      return true;
    }
  }

  // 2. Roman Numerals / Degrees (e.g. I, V/3, VIm, Vm7/7, bVII, 1, 5/3, 1ª, 3ª, 5ª)
  const degBaseMatch = cleanWord.match(/^(b|#)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i|[1-7])/i);
  if (degBaseMatch) {
    const suffix = cleanWord.slice(degBaseMatch[0].length);
    if (suffix === '') return true;
    const degSuffixPattern = /^(m|maj|min|dim|aug|sus|add|alt|omit|no|M|[0-9]|\(|\)|\+|\-|\#|b|Δ|ø|°|º|ª|(\/(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i|[1-7]|[a-gA-G][#b]?|1ª|2ª|3ª|4ª|5ª|6ª|7ª)))+$/i;
    if (degSuffixPattern.test(suffix)) return true;
  }

  // 3. Harmonic Functions (e.g. Tôn, Dom, Rel, Subd, SubR, Med, Sens, Cad, SubT)
  const funcBaseMatch = cleanWord.match(/^(Tôn|Dom|Rel|Subd|SubR|Med|Sens|Cad|SubT|Tonic|Domin|b2|b3|b5|#4|b6|b7)/i);
  if (funcBaseMatch) {
    const suffix = cleanWord.slice(funcBaseMatch[0].length);
    if (suffix === '') return true;
    const funcSuffixPattern = /^(m|maj|min|dim|aug|sus|add|alt|omit|no|M|[0-9]|\(|\)|\+|\-|\#|b|Δ|ø|°|º|ª|(\/(Tôn|Dom|Rel|Subd|SubR|Med|Sens|Cad|SubT|Tonic|Domin|VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i|[1-7]|[a-gA-G][#b]?|1ª|2ª|3ª|4ª|5ª|6ª|7ª)))+$/i;
    if (funcSuffixPattern.test(suffix)) return true;
  }

  return false;
}

export function convertHarmonicToChordName(chord: string, songKey: string): string {
  if (!chord || !songKey || songKey === '-') return chord;

  const clean = getCleanChordName(chord);
  if (!clean) return chord;

  let prePart = clean;
  let bassPart = '';
  if (clean.includes('/')) {
    const parts = clean.split('/');
    prePart = parts[0];
    bassPart = parts[1];
  }

  // Check if prePart is a harmonic function name or roman numeral / degree FIRST!
  const isHarmonicFunc = /^(Tôn|Dom|Rel|Subd|SubR|Med|Sens|Cad|SubT|Tonic|Domin)/i.test(prePart);
  const isDegree = /^(b|#)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i|[1-7])/i.test(prePart);

  // If it's NOT a harmonic function or degree, and it starts with a standard note cipher A-G, return it directly
  if (!isHarmonicFunc && !isDegree) {
    if (/^[A-G][#b]?/.test(clean)) {
      return clean;
    }
  }

  const keyRootMatch = songKey.match(/^([A-G][#b]?)/);
  if (!keyRootMatch) return chord;
  let keyRoot = keyRootMatch[1];
  if (FLATS[keyRoot]) keyRoot = FLATS[keyRoot];

  let semitones = -1;
  let suffix = '';
  let defaultMinor = false;

  if (/^Tôn/i.test(prePart)) {
    semitones = 0;
    suffix = prePart.replace(/^Tôn(ic)?/i, '');
  } else if (/^Dom/i.test(prePart)) {
    semitones = 7;
    suffix = prePart.replace(/^Dom(in)?/i, '');
  } else if (/^Rel/i.test(prePart)) {
    semitones = 9;
    defaultMinor = true;
    suffix = prePart.replace(/^Rel/i, '');
  } else if (/^Subd/i.test(prePart)) {
    semitones = 5;
    suffix = prePart.replace(/^Subd/i, '');
  } else if (/^SubR/i.test(prePart)) {
    semitones = 2;
    defaultMinor = true;
    suffix = prePart.replace(/^SubR/i, '');
  } else if (/^Med/i.test(prePart)) {
    semitones = 4;
    defaultMinor = true;
    suffix = prePart.replace(/^Med/i, '');
  } else if (/^Sens/i.test(prePart)) {
    semitones = 11;
    defaultMinor = true;
    suffix = prePart.replace(/^Sens/i, '');
  } else if (/^Cad/i.test(prePart)) {
    semitones = 2;
    defaultMinor = true;
    suffix = prePart.replace(/^Cad/i, '');
  } else if (/^SubT/i.test(prePart)) {
    semitones = 10;
    suffix = prePart.replace(/^SubT/i, '');
  } else {
    let acc = 0;
    let mainPre = prePart;
    if (mainPre.startsWith('b')) {
      acc = -1;
      mainPre = mainPre.substring(1);
    } else if (mainPre.startsWith('#')) {
      acc = 1;
      mainPre = mainPre.substring(1);
    }

    const romanMap: Record<string, number> = {
      'I': 0, '1': 0,
      'II': 2, '2': 2,
      'III': 4, '3': 4,
      'IV': 5, '4': 5,
      'V': 7, '5': 7,
      'VI': 9, '6': 9,
      'VII': 11, '7': 11
    };

    const match = mainPre.match(/^(VII|VI|IV|V|III|II|I|7|6|5|4|3|2|1)(.*)$/i);
    if (match) {
      const romUpper = match[1].toUpperCase();
      if (romanMap[romUpper] !== undefined) {
        semitones = (romanMap[romUpper] + acc + 12) % 12;
        let rest = match[2] || '';
        const isMinorLetter = match[1] === match[1].toLowerCase() && !romUpper.startsWith('1');
        if (isMinorLetter && !rest.startsWith('m')) {
          rest = 'm' + rest;
        }
        suffix = rest;
      }
    }
  }

  if (semitones === -1) return chord;

  if (defaultMinor) {
    if (suffix.startsWith('M') && !suffix.startsWith('Maj') && !suffix.startsWith('MAJ')) {
      defaultMinor = false;
      suffix = suffix.substring(1);
    } else if (!suffix.startsWith('m') && !suffix.startsWith('maj')) {
      suffix = 'm' + suffix;
    }
  }

  const rootIndex = NOTES.indexOf(keyRoot);
  if (rootIndex === -1) return chord;

  const targetChordRootIndex = (rootIndex + semitones) % 12;
  const targetChordRoot = NOTES[targetChordRootIndex];

  let targetBass = '';
  if (bassPart) {
    const intervalMap: Record<string, number> = {
      '1': 0, '1ª': 0,
      'b2': 1, 'b2ª': 1,
      '2': 2, '2ª': 2,
      'b3': 3, 'b3ª': 3,
      '3': 4, '3ª': 4,
      '4': 5, '4ª': 5,
      'b5': 6, '#4': 6,
      '5': 7, '5ª': 7,
      'b6': 8, 'b6ª': 8,
      '6': 9, '6ª': 9,
      'b7': 10, '7': 10, '7ª': 10,
      '7M': 11
    };

    if (intervalMap[bassPart] !== undefined) {
      const bassSemitones = intervalMap[bassPart];
      const targetBassIndex = (targetChordRootIndex + bassSemitones) % 12;
      targetBass = NOTES[targetBassIndex];
    } else {
      const bassDegreeChord = convertHarmonicToChordName(bassPart, songKey);
      if (bassDegreeChord && bassDegreeChord !== bassPart) {
        targetBass = bassDegreeChord.split('/')[0];
      }
    }
  }

  return targetBass ? `${targetChordRoot}${suffix}/${targetBass}` : `${targetChordRoot}${suffix}`;
}

export function cleanCifraHtml(text: string): string {
  if (!text) return '';

  let str = text;

  // 1. Replace Cifra Club / web line break containers
  // e.g. </div><div class="kvMV"> or </div><div ...> -> \n
  str = str.replace(/<\/div>\s*<div[^>]*>/gi, '\n');
  str = str.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  str = str.replace(/<br\s*\/?>/gi, '\n');

  // 2. Extract contents of <b> tags (e.g. <b data-chord-name="A"...>A  </b>)
  // Replace <b ...>content</b> with content (preserving internal spaces)
  str = str.replace(/<b\b[^>]*>(.*?)<\/b>/gi, '$1');
  str = str.replace(/<b\b[^>]*>/gi, ''); // remove any unclosed opening <b> tags with attributes

  // 3. Replace closing tags
  str = str.replace(/<\/div>/gi, '\n');
  str = str.replace(/<\/p>/gi, '\n');
  str = str.replace(/<\/span>/gi, '');
  str = str.replace(/<\/b>/gi, '');

  // 4. Strip all remaining HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // 5. Decode common HTML entities
  str = str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // 6. Normalize newlines and trim each line's trailing whitespace
  str = str.replace(/\r/g, '');
  str = str.split('\n').map(l => l.trimEnd()).join('\n');
  str = str.replace(/\n{3,}/g, '\n\n').trim();

  return str;
}

export function isChordLine(line: string): boolean {
  const cleanLine = line.includes('<') ? cleanCifraHtml(line) : line.replace(/<\/?[biu]>/g, '');
  const trimmed = cleanLine.trim();
  if (!trimmed) return false;

  // Reject section header lines like [Verso 1], [Refrão 4x], Ponte 2x, [Intro], Intro:, [Solo], etc.
  const isHeaderLine = /^[\s\[\(\{\-]*([0-9]+\.?)?\s*(verso|refrão|refrao|chorus|intro|introdução|introducao|ponte|bridge|solo|outro|final|fim|coro|estrofe|parte|part|primeira parte|segunda parte|terceira parte|quarta parte|1ª parte|2ª parte|3ª parte|4ª parte|ministração|ministracao|interlúdio|interludio|interlude|pre-chorus|pré-refrão|pre-refrao|coda|tag|hook|vocal|todos|instr|instrumental|bis)[\s0-9a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêôÂÊÔçÇ\:\.\-\]\)\}]*$/i.test(trimmed);
  if (isHeaderLine) {
    return false;
  }
  
  // Extract all words/tokens
  const words = trimmed.split(/\s+/);
  if (words.length === 0) return false;

  // Filter out headers/annotations so they don't disqualify the chord line
  const nonAnnotationWords = words.filter(w => !isAnnotationOrHeaderWord(w));
  
  // If there are no non-annotation words left, it's not a chord line (just a header like "[Intro]")
  if (nonAnnotationWords.length === 0) return false;

  let chordCount = 0;
  for (const word of nonAnnotationWords) {
    if (isChordWord(word)) {
      chordCount++;
    }
  }

  if (chordCount === 0) return false;

  // Common words in Portuguese/English that might be mistaken for chords
  const commonWords = ['A', 'E', 'O', 'Do', 'Am', 'As', 'Os', 'I', 'He', 'She', 'It', 'We', 'My', 'Your', 'Em', 'Da', 'De', 'Na', 'No'];
  
  // If there are other words and only 1 chord word which is a common word (e.g. 'A Ti', 'E cantamos'), it's likely not a chord line
  if (nonAnnotationWords.length > 1 && chordCount === 1) {
    const mainWord = nonAnnotationWords.find(w => isChordWord(w)) || '';
    const cleanMain = mainWord.replace(/^[\s\[\(\{\|\,\-:]+|[\s\]\)\}\|\,\-:]+$/g, '');
    if (commonWords.includes(cleanMain)) {
      return false;
    }
  }

  // Non-chord words of length >= 3
  const normalWords = nonAnnotationWords.filter(w => w.length >= 3 && !isChordWord(w));

  // If a line is enclosed in pipes or brackets with chords (e.g., "| G | C9 | D/F# |" or "[G  C9]"), it's a chord grid/line
  const isGridFormat = (trimmed.includes('|') && chordCount >= 1) || (trimmed.startsWith('[') && trimmed.endsWith(']') && chordCount >= 1);
  if (isGridFormat) {
    return true;
  }

  const chordRatio = chordCount / nonAnnotationWords.length;

  // Accept if chord ratio is high (>= 40%) OR if chordCount is greater than or equal to non-chord words count
  if (chordRatio >= 0.4 || (chordCount >= 2 && normalWords.length <= chordCount)) {
    return true;
  }

  return false;
}

export function detectKey(text: string): string | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (isChordLine(line)) {
      const chordRegex = /[a-gA-G][#b]?[a-zA-Z0-9\/\(\)\+\-\Δ\ø\°\º]*/g;
      let match;
      while ((match = chordRegex.exec(line)) !== null) {
        const chord = match[0];
        if (isChordWord(chord)) {
          // Extract base note as the key candidate
          const baseNoteMatch = chord.match(/^([a-gA-G][#b]?)/);
          if (baseNoteMatch) return baseNoteMatch[1].charAt(0).toUpperCase() + baseNoteMatch[1].slice(1);
        }
      }
    }
  }
  return null;
}

export interface ChordToken {
  text: string;
  isChord: boolean;
  isSpecialChar: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export function parseChordLineIntoTokens(rawLine: string): ChordToken[] {
  const line = (rawLine.includes('<div') || rawLine.includes('<span') || rawLine.includes('data-chord') || rawLine.includes('class='))
    ? cleanCifraHtml(rawLine)
    : rawLine;

  const tokens: ChordToken[] = [];

  let isBold = false;
  let isItalic = false;
  let isUnderline = false;

  let i = 0;
  let currentGroup = '';
  let groupType: 'space' | 'chord' | 'special' | null = null;

  const pushCurrentGroup = () => {
    if (!currentGroup) return;
    tokens.push({
      text: currentGroup,
      isChord: groupType === 'chord' && isChordWord(currentGroup),
      isSpecialChar: groupType === 'special',
      bold: isBold,
      italic: isItalic,
      underline: isUnderline
    });
    currentGroup = '';
  };

  while (i < line.length) {
    if (line.substring(i, i + 3) === '<b>') {
      pushCurrentGroup();
      isBold = true;
      i += 3;
      continue;
    }
    if (line.substring(i, i + 4) === '</b>') {
      pushCurrentGroup();
      isBold = false;
      i += 4;
      continue;
    }
    if (line.substring(i, i + 3) === '<i>') {
      pushCurrentGroup();
      isItalic = true;
      i += 3;
      continue;
    }
    if (line.substring(i, i + 4) === '</i>') {
      pushCurrentGroup();
      isItalic = false;
      i += 4;
      continue;
    }
    if (line.substring(i, i + 3) === '<u>') {
      pushCurrentGroup();
      isUnderline = true;
      i += 3;
      continue;
    }
    if (line.substring(i, i + 4) === '</u>') {
      pushCurrentGroup();
      isUnderline = false;
      i += 4;
      continue;
    }

    const char = line[i];
    
    let charType: 'space' | 'chord' | 'special';
    if (char === ' ') {
      charType = 'space';
    } else if (char === '[' || char === ']' || char === '{' || char === '}' || char === '|' || char === ':' || char === ',' || char === ';') {
      charType = 'special';
    } else {
      charType = 'chord';
    }

    if (groupType === null) {
      groupType = charType;
      currentGroup = char;
    } else if (groupType === charType) {
      currentGroup += char;
    } else {
      pushCurrentGroup();
      groupType = charType;
      currentGroup = char;
    }

    i++;
  }
  pushCurrentGroup();

  return tokens;
}

export function isTablatureLine(line: string): boolean {
  // Check the raw line for tab classes, in case HTML is preserved
  if (line.includes('class="tablatura"') || line.includes("class='tablatura'") || line.includes('class="tab"') || line.includes("class='tab'")) {
    return true;
  }

  const stripped = line.replace(/<[^>]*>/g, "").trim();
  if (!stripped) return false;

  // 1. Classic string label followed by symbol like | or : e.g. e|---, B:---, G|--, 1|---, G#|---
  if (/^[a-gA-G1-9]#?[b]?\s*[\|:]/.test(stripped) && stripped.includes("-")) {
    return true;
  }

  // 2. Contains pipes with multiple hyphens or slashes simulating strings / frets
  if (stripped.includes("|") && (stripped.match(/-{2,}/) !== null)) {
    return true;
  }

  // 3. Just a divider of multiple hyphens or equals (like tab separators or grids) e.g., --------- or ======
  if (/^[\-\=~]{4,}$/.test(stripped)) {
    return true;
  }

  // 4. Multiple numbers mixed with hyphens or slashes (e.g. 2h3p2----, 12/14/12---)
  if (stripped.includes("-") && (stripped.match(/[0-9h/ps\\]{2,}/) !== null) && stripped.length > 5 && !stripped.includes(" ")) {
    return true;
  }

  // 5. Explicit tab markers / headings (e.g., [Tab - Intro], [Tab - Solo], [Tab - Primeira Parte], [Tab])
  if (/\[Tab\b/i.test(stripped)) {
    return true;
  }

  // 6. Section divider for tabs (e.g. "Parte 1 de 2", "Parte 3 de 4", or "Parte 2")
  if (/Parte\s*\d+/i.test(stripped)) {
    return true;
  }

  return false;
}

export function cleanTablatures(text: string): string {
  if (!text) return "";
  const cleanedText = cleanCifraHtml(text);
  const lines = cleanedText.split(/\r?\n/);
  
  const linesMetadata = lines.map((line) => {
    const stripped = line.replace(/<[^>]*>/g, "").trim();
    const isEmpty = stripped === "";
    const isSection = stripped.startsWith("[") && stripped.endsWith("]");
    const isTab = isTablatureLine(line);
    const hasChords = isChordLine(line);

    return {
      line,
      stripped,
      isEmpty,
      isSection,
      isTab,
      hasChords,
    };
  });

  const filteredLines: string[] = [];
  let currentSection = "";

  for (let i = 0; i < linesMetadata.length; i++) {
    const curr = linesMetadata[i];
    
    // Update the current section
    const sectionMatch = curr.stripped.match(/\[([^\]]+)\]/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase();
    }

    if (curr.isTab) {
      continue;
    }

    if (curr.hasChords) {
      const isIntroOrSoloSection = currentSection === "" || 
        currentSection.includes("intro") || 
        currentSection.includes("solo") || 
        currentSection.includes("instrumental") || 
        currentSection.includes("interludio") || 
        currentSection.includes("interlúdio") || 
        currentSection.includes("outro") || 
        currentSection.includes("fim") || 
        currentSection.includes("dedilhado") || 
        currentSection.includes("riff");

      if (!isIntroOrSoloSection) {
        let isTabChord = false;
        for (let j = i + 1; j < linesMetadata.length; j++) {
          const next = linesMetadata[j];
          if (next.isEmpty) {
            continue;
          }
          if (next.isTab) {
            isTabChord = true;
            break;
          }
          if (next.hasChords) {
            continue;
          }
          break;
        }
        if (isTabChord) {
          continue;
        }
      }
    }

    filteredLines.push(curr.line);
  }

  // Double check and clean up redundant consecutive blank lines that occur after stripping tabs
  const resultLines: string[] = [];
  for (const line of filteredLines) {
    if (line.trim() === "") {
      if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== "") {
        resultLines.push("");
      }
    } else {
      resultLines.push(line);
    }
  }

  return resultLines.join("\n").trim();
}

/**
 * Strips out dynamic marking tags (N1..N7, Sutil, Crescendo, Pausa, etc.),
 * section headers ([Intro], [Refrão], etc.), and chord lines/brackets for projection displays.
 */
export function cleanLyricsForProjection(rawLyrics: string): string {
  if (!rawLyrics) return '';

  // 1. Remove HTML tags
  let cleaned = rawLyrics.replace(/<\/?[a-zA-Z0-9]+[^>]*>/g, '');

  // 2. Split into lines
  const lines = cleaned.split(/\r?\n/);

  const processedLines = lines.map(line => {
    let trimmed = line.trim();
    if (!trimmed) return '';

    // If the line is a chord line (e.g. "C   G   Am   F"), filter it out
    if (isChordLine(trimmed)) {
      return '';
    }

    // Remove inline chord tags like [C], [G/B], [Am7], [F#m]
    trimmed = trimmed.replace(/\[[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|[0-9])*(?:\/[A-G][b#]?)?\]/g, '');

    // Remove dynamic tags in parentheses or brackets:
    // e.g., (N1 🌑 Sutil), (N1 🌑), (N1), (N2 🌘 Bem Suave), (N7 ⚡ Clímax), (Crescendo ↗), (Decrescendo ↘), (Pausa 🛑), (Acapella 🎤), (Só Bateria 🥁), (Sobe o Tom 📈)
    // also (Sutil), (Quase Silêncio), (Bem Suave), (Suave), (Moderado), (Meio Forte), (Forte), (Clímax), (Pausa), (Parada), (Acapella), (Só Bateria), (Sobe o Tom)
    // [N1 🌑 Sutil], [N1], [N7], etc.
    trimmed = trimmed.replace(/[\(\[](?:N[1-7]|Sutil|Quase Silêncio|Quase Silencio|Bem Suave|Suave|Moderado|Meio Forte|Forte|Clímax|Climax|Crescendo|Decrescendo|Pausa|Parada|Acapella|Só Bateria|Apenas Bateria|Violão Marcando|Violao Marcando|Violão|Violao|Sobe o Tom|Sobe Tom|Modulação|Modulacao|Tutti|Solo|Intro|Instrumental|Refrão|Refrao|Ponte|Verso|Primeira Parte|Segunda Parte|Terceira Parte|1ª Parte|2ª Parte|3ª Parte|Parte 1|Parte 2|Parte 3|Dobra)(?:\s+[^)\]]*)?[\)\]]/gi, '');

    // Remove unbracketed/inline dynamic patterns:
    // e.g., N1 🌑 Sutil, N1 🌑, N2 🌘, N7 ⚡, Crescendo ↗, Decrescendo ↘, Pausa 🛑, Acapella 🎤, Só Bateria 🥁, Violão Marcando 🎸, Sobe o Tom 📈
    trimmed = trimmed.replace(/\bN[1-7]\b\s*(?:🌑|🌘|🌗|🌖|🌕|🔥|⚡)?\s*(?:Sutil|Quase Silêncio|Quase Silencio|Bem Suave|Suave|Moderado|Meio Forte|Forte|Clímax|Climax)?/gi, '');
    trimmed = trimmed.replace(/(?:Crescendo\s*↗?|Decrescendo\s*↘?|Pausa\s*🛑?|Acapella\s*🎤?|Só Bateria\s*🥁?|Violão Marcando\s*🎸?|Violao Marcando\s*🎸?|Sobe o Tom\s*📈?|Sobe Tom\s*📈?|Modulação\s*📈?)/gi, '');

    // Clean up standalone emojis associated with dynamics
    trimmed = trimmed.replace(/(?:🌑|🌘|🌗|🌖|🌕|🔥|⚡|🛑|↗|↘|🎤|🥁|🎸|📈)/g, '');

    // Clean up extra double spaces created by removals
    trimmed = trimmed.replace(/\s{2,}/g, ' ').trim();

    // Filter out brackets containing section titles or repetition counts like [Intro], [Refrão 4x], [Ponte (2x)], [Solo], [Verso 1], [1ª Parte]
    if (/^\[[^\]]+\](\s*[\(\[]?([0-9]+x|bis)[\)\]]?)?$/i.test(trimmed)) {
      return '';
    }

    // Filter out standalone section labels or dynamic labels (case-insensitive, optionally followed by numbers, repetition counts like 4x, (4x), 2x, etc.)
    if (/^[\s\[\(\{\-]*([0-9]+\.?)?\s*(intro|introdução|introducao|refrão|refrao|ponte|bridge|solo|verso|coro|chorus|pre-refrão|pré-refrão|pre-refrao|ministração|ministracao|final|outro|instrumental|vocal|estribilho|dobra|primeira parte|segunda parte|terceira parte|quarta parte|1ª parte|2ª parte|3ª parte|4ª parte|1a parte|2a parte|3a parte|4a parte|parte 1|parte 2|parte 3|parte 4|n1|n2|n3|n4|n5|n6|n7|sutil|quase silêncio|quase silencio|bem suave|suave|moderado|meio forte|forte|clímax|climax|crescendo|decrescendo|pausa|parada|acapella|só bateria|so bateria|sobe o tom|sobe tom|modulação|modulacao)[\s0-9a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêôÂÊÔçÇ\:\.\-\]\)\}]*$/i.test(trimmed)) {
      return '';
    }

    return trimmed;
  });

  return processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
