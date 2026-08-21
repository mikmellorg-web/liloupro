export function adaptToNAA(text: string): string {
  return text;
}

export function getLocalBiblePassage(book: string, chapter: number | string, version: string = 'BLIVRE'): any {
  return {
    verses: [],
    isFallback: false,
    warning: ''
  };
}

