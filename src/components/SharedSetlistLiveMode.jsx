import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Type, Hash, ListFilter, ArrowLeft 
} from 'lucide-react';

export default function SharedSetlistLiveMode({ setlist, songs: initialSongs }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songKeyOffsets, setSongKeyOffsets] = useState({});
  const [chordMode, setChordMode] = useState('chords');
  const [showSections, setShowSections] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);

  const scrollRef = useRef(null);

  // Auto-scroll effect
  useEffect(() => {
    let interval;
    if (isScrolling) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isScrolling, scrollSpeed]);

  if (!setlist || !initialSongs) {
    return (
      <div className="fixed inset-0 z-50 bg-[#010719] text-white flex flex-col items-center justify-center p-4">
        <p className="text-sm font-bold text-slate-400 mb-2">Loading Shared Setlist...</p>
        <p className="text-xs text-slate-600">Please verify your link is correct.</p>
      </div>
    );
  }

  const songs = initialSongs || [];
  const currentSong = songs[currentIndex] || songs[0];
  const currentKeyOffset = songKeyOffsets[currentIndex] || 0;

  const handleTranspose = (delta) => {
    setSongKeyOffsets(prev => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + delta
    }));
  };

  const handleBackToSetlist = () => {
    window.location.href = '/';
  };

  if (!currentSong) {
    return (
      <div className="fixed inset-0 z-50 bg-[#010719] text-white flex items-center justify-center">
        <p className="text-xs text-slate-400">No songs found in this shared setlist.</p>
      </div>
    );
  }

  const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const transposeChord = (chordStr, semitones) => {
    if (!chordStr) return chordStr;
    return chordStr.replace(/([A-G][b#]?)/g, (match) => {
      let idx = NOTES_SHARP.indexOf(match);
      if (idx === -1) idx = NOTES_FLAT.indexOf(match);
      if (idx === -1) return match;
      let newIdx = (idx + semitones) % 12;
      if (newIdx < 0) newIdx += 12;
      return NOTES_SHARP[newIdx];
    });
  };

  const getNashvilleNumber = (chordStr, currentKey) => {
    if (!chordStr) return chordStr;
    const match = chordStr.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return chordStr;
    const root = match[1];
    const quality = match[2];

    let keyRoot = (currentKey || 'G').trim();
    let keyIdx = NOTES_SHARP.indexOf(keyRoot);
    if (keyIdx === -1) keyIdx = NOTES_FLAT.indexOf(keyRoot);
    if (keyIdx === -1) keyIdx = 7;

    let rootIdx = NOTES_SHARP.indexOf(root);
    if (rootIdx === -1) rootIdx = NOTES_FLAT.indexOf(root);
    if (rootIdx === -1) return chordStr;

    let semitoneDiff = (rootIdx - keyIdx + 12) % 12;

    const scaleMap = {
      0: '1', 2: '2', 4: '3', 5: '4', 7: '5', 9: '6', 11: '7',
      1: 'b2', 3: 'b3', 6: '#4', 8: 'b6', 10: 'b7'
    };

    const degree = scaleMap[semitoneDiff] || root;
    return degree + quality;
  };

  const formatChordDisplay = (chordStr, baseKey, semitones) => {
    const transposed = transposeChord(chordStr, semitones);
    if (chordMode === 'nashville') {
      const activeKey = transposeChord(baseKey || 'G', semitones);
      return getNashvilleNumber(transposed, activeKey);
    }
    return transposed;
  };

  const parseChordPro = (content = '') => {
    const lines = content.split('\n');
    const parsed = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\{(?:t|title|a|artist|k|key|capo):\s*([^}]+)\}/i)) return;

      const directiveMatch = trimmed.match(/^\{([^}]+)\}$/);
      if (directiveMatch) {
        parsed.push({ type: 'section', text: directiveMatch[1].toUpperCase() });
        return;
      }

      if (/^(INTRO|VERSE|CHORUS|BRIDGE|OUTRO|PRE-CHORUS|TAG|INTERLUDE)[:]?$/i.test(trimmed)) {
        parsed.push({ type: 'section', text: trimmed.replace(':', '').toUpperCase() });
        return;
      }

      const parts = [];
      const regex = /\[([^\]]+)\]([^[]*)/g;
      let match;
      const firstBracket = line.indexOf('[');

      if (firstBracket > 0) {
        parts.push({ chord: '', lyric: line.substring(0, firstBracket) });
      } else if (firstBracket === -1 && line.trim() !== '') {
        parsed.push({ type: 'text', text: line });
        return;
      }

      while ((match = regex.exec(line)) !== null) {
        parts.push({ chord: match[1], lyric: match[2] });
      }

      if (parts.length > 0) {
        parsed.push({ type: 'chordLine', parts });
      } else {
        parsed.push({ type: 'text', text: line });
      }
    });

    return parsed;
  };

  const structuralLines = parseChordPro(currentSong.chordPro || '');
  const activeKeyDisplay = transposeChord(currentSong.key || 'G', currentKeyOffset);

  return (
    <div className="fixed inset-0 z-50 bg-[#010719] text-white flex flex-col overflow-hidden">
      {/* TOP CONTROL BAR */}
      <div className="bg-[#0a0f1d] border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackToSetlist}
            className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-[#050811] hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" /> Back to App
          </button>

          <div className="flex items-center gap-2 bg-[#050811] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-amber-500">{currentIndex + 1}.</span>
            <select 
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {songs.map((s, idx) => {
                const songOffset = songKeyOffsets[idx] || 0;
                return (
                  <option key={s.id || idx} value={idx} className="bg-[#0a0f1d] text-white">
                    {s.title} ({transposeChord(s.key || 'G', songOffset)})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5 bg-[#050811] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span>KEY</span>
            <button onClick={() => handleTranspose(-1)} className="hover:text-cyan-400 px-1 text-sm">-</button>
            <span className="text-cyan-400 font-mono">{activeKeyDisplay}</span>
            <button onClick={() => handleTranspose(1)} className="hover:text-cyan-400 px-1 text-sm">+</button>
          </div>

          <button 
            onClick={() => {
              if (chordMode === 'chords') setChordMode('nashville');
              else if (chordMode === 'nashville') setChordMode('off');
              else setChordMode('chords');
            }}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              chordMode !== 'off' ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400' : 'bg-[#050811] border-slate-800 text-slate-500'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>
              {chordMode === 'chords' && 'Chords'}
              {chordMode === 'nashville' && 'Nashville'}
              {chordMode === 'off' && 'Singers (No Chords)'}
            </span>
          </button>

          <button 
            onClick={() => setShowSections(!showSections)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              showSections ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400' : 'bg-[#050811] border-slate-800 text-slate-500'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Sections</span>
          </button>

          <div className="flex items-center gap-1.5 bg-[#050811] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <button onClick={() => setFontSize(prev => Math.max(12, prev - 2))} className="hover:text-cyan-400 px-1">-</button>
            <span className="font-mono text-cyan-400">{fontSize}</span>
            <button onClick={() => setFontSize(prev => Math.min(32, prev + 2))} className="hover:text-cyan-400 px-1">+</button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#050811] px-2.5 py-1.5 rounded-lg border border-slate-800">
            <button onClick={() => setIsScrolling(!isScrolling)} className="flex items-center gap-1 hover:text-cyan-400">
              {isScrolling ? <Pause className="w-3 h-3 text-amber-400 fill-current" /> : <Play className="w-3 h-3 text-cyan-400 fill-current" />}
              <span>Roll</span>
            </button>
            <select 
              value={scrollSpeed} 
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="bg-transparent text-cyan-400 focus:outline-none cursor-pointer font-mono"
            >
              <option value={1} className="bg-[#0a0f1d]">1x</option>
              <option value={2} className="bg-[#0a0f1d]">2x</option>
              <option value={3} className="bg-[#0a0f1d]">3x</option>
            </select>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(songs.length - 1, prev + 1))}
              disabled={currentIndex === songs.length - 1}
              className="p-1 hover:bg-slate-800 rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SONG CONTENT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8 pb-20">
          <div className="text-left border-b border-slate-800/80 pb-4">
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">{currentSong.title}</h1>
            <p className="text-xs text-slate-400 font-semibold">
              Artist: <strong className="text-slate-200">{currentSong.artist || 'Unknown'}</strong> | Key: <strong className="text-cyan-400">{activeKeyDisplay}</strong>
            </p>
          </div>

          <div className="space-y-3 font-mono" style={{ fontSize: `${fontSize}px` }}>
            {structuralLines.map((lineObj, idx) => {
              if (lineObj.type === 'section') {
                if (!showSections) return null;
                return (
                  <div key={idx} className="mt-8 mb-2 text-cyan-400 font-extrabold text-xs tracking-widest uppercase">
                    {lineObj.text}
                  </div>
                );
              }

              if (lineObj.type === 'chordLine') {
                return (
                  <div key={idx} className="mb-2 flex flex-wrap items-end leading-tight">
                    {lineObj.parts.map((part, pIdx) => (
                      <div key={pIdx} className="relative flex flex-col mr-1.5 mb-1">
                        {chordMode !== 'off' && (
                          <span className="text-cyan-400 font-bold tracking-wide select-none" style={{ fontSize: `${Math.max(12, fontSize - 2)}px` }}>
                            {formatChordDisplay(part.chord, currentSong.key || 'G', currentKeyOffset)}
                          </span>
                        )}
                        <span className="text-slate-100 font-normal whitespace-pre">
                          {part.lyric || '\u00A0'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div key={idx} className="text-slate-300 my-1 whitespace-pre-wrap">
                  {lineObj.text}
                </div>
              );
            })}
          </div>

          <div className="mt-20 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 font-sans font-medium">
            {setlist?.footer || "Created by Hommer Angelo"}
          </div>
        </div>
      </div>
    </div>
  );
}
