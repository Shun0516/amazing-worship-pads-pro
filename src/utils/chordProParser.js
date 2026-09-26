// CHROMATIC SCALE (SHARPS & FLATS)
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map equivalent enharmonics to index
const NOTE_INDEX = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

// MAJOR SCALE INTERVALS FOR NASHVILLE NUMBERS
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const NUMBER_MAP = ['1', '2', '3', '4', '5', '6', '7'];

/**
 * Transposes a single note by semiSteps
 */
export function transposeNote(note, semiSteps) {
  const baseNote = note.replace(/m|dim|aug|sus|add|\d|\/.*$/g, '');
  const suffix = note.slice(baseNote.length);
  
  if (NOTE_INDEX[baseNote] === undefined) return note;

  let currentIndex = NOTE_INDEX[baseNote];
  let newIndex = (currentIndex + semiSteps + 12) % 12;
  return CHROMATIC_SCALE[newIndex] + suffix;
}

/**
 * Transposes a chord (including bass note slash chords e.g., G/B -> A/C#)
 */
export function transposeChord(chord, semiSteps) {
  if (!semiSteps || semiSteps === 0) return chord;
  
  if (chord.includes('/')) {
    const [root, bass] = chord.split('/');
    return `${transposeChord(root, semiSteps)}/${transposeChord(bass, semiSteps)}`;
  }

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, quality] = match;
  const rootIndex = NOTE_INDEX[root];
  if (rootIndex === undefined) return chord;

  const newIndex = (rootIndex + semiSteps + 12) % 12;
  return CHROMATIC_SCALE[newIndex] + quality;
}

/**
 * Converts a chord into Nashville Number System relative to root key (e.g. C -> 1, Am -> 6m)
 */
export function chordToNashville(chord, keyRoot) {
  if (!chord || !keyRoot) return chord;

  // Handle slash chords (e.g., C/E -> 1/3)
  if (chord.includes('/')) {
    const [root, bass] = chord.split('/');
    return `${chordToNashville(root, keyRoot)}/${chordToNashville(bass, keyRoot)}`;
  }

  const cleanKey = keyRoot.replace(/m$/g, ''); // Extract key root
  const keyIndex = NOTE_INDEX[cleanKey];
  if (keyIndex === undefined) return chord;

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, quality] = match;
  const chordIndex = NOTE_INDEX[root];
  if (chordIndex === undefined) return chord;

  // Calculate interval distance relative to key root
  const interval = (chordIndex - keyIndex + 12) % 12;
  const scaleDegreeIndex = MAJOR_SCALE_INTERVALS.indexOf(interval);

  if (scaleDegreeIndex !== -1) {
    return NUMBER_MAP[scaleDegreeIndex] + quality;
  }

  // Non-diatonic / accidental fallback (e.g. b7)
  return chord;
}

export function parseChordPro(text) {
  if (!text) return [];

  const lines = text.split('\n');
  const parsed = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Check directives like {title:...}, {key:...}, {verse}, {chorus}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const directive = trimmed.slice(1, -1).trim();
      
      if (directive.includes(':')) {
        // Ignored in body render as metadata handled above
        return;
      } else {
        // Section header like {verse}, {chorus}, {bridge}
        parsed.push({
          type: 'section',
          label: directive.toUpperCase()
        });
        return;
      }
    }

    // Parse inline chords [G], [Em], etc.
    const regex = /\[(.*?)\]/g;
    let match;
    let chords = [];
    let lyrics = line;
    let lastIndex = 0;
    let cleanLine = '';

    const parts = [];
    let currentIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      const chord = match[1];
      const matchIndex = match.index;

      // Text before chord
      const textBefore = line.substring(currentIdx, matchIndex);
      parts.push({ chord: '', text: textBefore });

      // Save chord at this position
      parts.push({ chord: chord, text: '' });
      currentIdx = regex.lastIndex;
    }

    if (currentIdx < line.length) {
      parts.push({ chord: '', text: line.substring(currentIdx) });
    }

    if (parts.length === 0) {
      parsed.push({ type: 'line', parts: [{ chord: '', text: line }] });
    } else {
      parsed.push({ type: 'line', parts });
    }
  });

  return parsed;
}