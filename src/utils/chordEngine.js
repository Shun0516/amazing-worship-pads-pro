// Chromatic scales for transposing chords
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Regex pattern to identify musical chords inside brackets like [G], [C#m], [F#/A]
const CHORD_REGEX = /\[([A-G][b#]?(?:m\vert{}maj\vert{}min\vert{}dim\vert{}aug\vert{}sus\vert{}add)?[0-9]*(?:\/[A-G][b#]?)?)\]/g;

/**
 * Transposes a single chord name (e.g., "G", "C#m", "F#/A") by a given number of semitones
 */
export function transposeChord(chord, semitones) {
  if (!chord || semitones === 0) return chord;

  // Handle slash chords like F#/A
  if (chord.includes('/')) {
    const [mainChord, bassNote] = chord.split('/');
    return `${transposeChord(mainChord, semitones)}/${transposeChord(bassNote, semitones)}`;
  }

  // Extract root note (e.g., "C#", "G", "Bb") and quality (e.g., "m7", "sus4")
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const [, root, quality] = match;

  // Find position in scale
  let index = CHROMATIC_SHARPS.indexOf(root);
  if (index === -1) index = CHROMATIC_FLATS.indexOf(root);
  if (index === -1) return chord;

  // Calculate new root note position
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Pick sharp or flat representation based on original format
  const scale = root.includes('b') ? CHROMATIC_FLATS : CHROMATIC_SHARPS;
  return scale[newIndex] + quality;
}

/**
 * Scans a full text sheet and transposes every [Chord] bracket inside it
 */
export function transposeTextChart(text, semitones) {
  if (!text || semitones === 0) return text;

  return text.replace(CHORD_REGEX, (match, chord) => {
    const newChord = transposeChord(chord, semitones);
    return `[${newChord}]`;
  });
}

/**
 * Converts bracketed song text into clean HTML lines for displaying chords over lyrics
 */
export function parseChartToLines(text) {
  if (!text) return [];

  const lines = text.split('\n');
  return lines.map((line, index) => {
    // Check if line contains bracketed chords
    const hasChords = CHORD_REGEX.test(line);

    if (!hasChords) {
      return { id: index, type: 'lyric-only', text: line };
    }

    // Split line into chord segments and lyric segments
    const parts = [];
    let lastIdx = 0;
    const regex = new RegExp(CHORD_REGEX);
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'lyric', text: line.substring(lastIdx, match.index) });
      }
      parts.push({ type: 'chord', text: match[1] });
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push({ type: 'lyric', text: line.substring(lastIdx) });
    }

    return { id: index, type: 'chord-line', parts };
  });
}