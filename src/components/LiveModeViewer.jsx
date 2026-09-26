import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Plus, Minus, Hash, Music, Type
} from 'lucide-react';

// Chromatic Scale for Transposition
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const KEY_TO_NUM = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

export default function LiveModeViewer({ setlist, librarySongs, onClose }) {
  // Map setlist item IDs to full library song data
  const setlistSongs = (setlist?.items || []).map(item => {
    const fullSong = librarySongs.find(s => s.id === item.songId);
    return {
      ...item,
      chordPro: fullSong?.chordPro || `[${item.key || 'C'}] No chart available for ${item.title}`
    };
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSong = setlistSongs[currentIndex];

  // Persistent / Sticky Display Settings
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const [useNashville, setUseNashville] = useState(false);
  const [fontSize, setFontSize] = useState(18); // in px
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1-5

  const chartContainerRef = useRef(null);

  // Reset transposition per song switch if needed, or keep relative shift
  const handleSongChange = (index) => {
    if (index >= 0 && index < setlistSongs.length) {
      setCurrentIndex(index);
      setIsAutoScrolling(false);
      if (chartContainerRef.current) {
        chartContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Auto-scroll loop
  useEffect(() => {
    let interval = null;
    if (isAutoScrolling) {
      interval = setInterval(() => {
        if (chartContainerRef.current) {
          chartContainerRef.current.scrollTop += scrollSpeed * 0.5;
        }
      }, 50);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  // Transpose helper
  const transposeChord = (chordStr, semitones) => {
    return chordStr.replace(/([A-G][#b]?)(.*)/, (match, root, ext) => {
      let rootIdx = KEY_TO_NUM[root];
      if (rootIdx === undefined) return chordStr;
      
      if (useNashville) {
        // Simple Nashville mapping relative to active song default key
        const baseKeyIdx = KEY_TO_NUM[currentSong?.key || 'C'] || 0;
        const targetIdx = (rootIdx + semitones + 12) % 12;
        const interval = (targetIdx - baseKeyIdx + 12) % 12;
        const nashvilleMap = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
        return nashvilleMap[interval] + ext;
      }

      const newIdx = (rootIdx + semitones + 12) % 12;
      return CHROMATIC[newIdx] + ext;
    });
  };

  // ChordPro Renderer
  const renderChartContent = (chordProText) => {
    if (!chordProText) return null;

    const lines = chordProText.split('\n');
    return lines.map((line, idx) => {
      // Directives like {title: ...} or {comment: ...}
      if (line.trim().startsWith('{')) {
        const commentMatch = line.match(/\{(?:c|comment):\s*([^}]+)\}/i);
        if (commentMatch) {
          return (
            <div key={idx} className="my-3 font-bold text-amber-400 uppercase tracking-wider text-xs border-b border-amber-500/20 pb-1">
              {commentMatch[1]}
            </div>
          );
        }
        return null;
      }

      // Bracketed Chord/Lyric Line Parser
      const parts = line.split(/(\[[^\]]+\])/g);
      const hasChords = line.includes('[');

      return (
        <div key={idx} className="leading-relaxed flex flex-wrap items-end my-1">
          {parts.map((part, pIdx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              const chordName = part.slice(1, -1);
              const transposed = transposeChord(chordName, transposeSemitones);
              return (
                <span key={pIdx} className="inline-flex flex-col inline-block mr-1">
                  <span className="font-mono font-black text-cyan-400 select-none leading-none mb-1">
                    {transposed}
                  </span>
                </span>
              );
            }
            return (
              <span key={pIdx} className="text-slate-100 font-sans whitespace-pre">
                {part}
              </span>
            );
          })}
        </div>
      );
    });
  };

  if (!setlistSongs.length) {
    return (
      <div className="fixed inset-0 z-50 bg-[#010719] flex flex-col items-center justify-center text-slate-400 p-4">
        <p className="mb-4 text-sm font-semibold">This setlist has no songs added yet.</p>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
        >
          Exit Live Mode
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#040711] text-slate-100 flex flex-col overflow-hidden">
      
      {/* FIXED / STICKY TOP CONTROL BAR */}
      <header className="sticky top-0 z-20 bg-[#0a0f1d] border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-xl shrink-0">
        
        {/* SONG & SETLIST SELECTOR */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Exit Live Mode"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
              {setlist.title} ({currentIndex + 1}/{setlistSongs.length})
            </span>
            <div className="flex items-center gap-2">
              <select 
                value={currentIndex}
                onChange={(e) => handleSongChange(Number(e.target.value))}
                className="bg-[#040711] border border-slate-700 text-white font-bold text-sm rounded px-2 py-1 focus:outline-none focus:border-cyan-400"
              >
                {setlistSongs.map((s, idx) => (
                  <option key={s.id || idx} value={idx}>
                    {idx + 1}. {s.title} ({s.key})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CONTROLS (TRANSPOSE, NASHVILLE, FONT SIZE, SCROLL) */}
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* Transpose Controls */}
          <div className="flex items-center gap-1 bg-[#040711] border border-slate-800 rounded-lg p-1">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Key</span>
            <button 
              onClick={() => setTransposeSemitones(prev => prev - 1)}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Transpose Down"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400 min-w-[28px] text-center">
              {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
            </span>
            <button 
              onClick={() => setTransposeSemitones(prev => prev + 1)}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Transpose Up"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nashville Notation Toggle */}
          <button 
            onClick={() => setUseNashville(!useNashville)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1 ${
              useNashville 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                : 'bg-[#040711] border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Nashville Numbers"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{useNashville ? 'Nashville' : 'Chords'}</span>
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1 bg-[#040711] border border-slate-800 rounded-lg p-1">
            <Type className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button 
              onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Decrease Text Size"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 min-w-[24px] text-center">
              {fontSize}
            </span>
            <button 
              onClick={() => setFontSize(prev => Math.min(36, prev + 2))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Increase Text Size"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto Scroll Controls */}
          <div className="flex items-center gap-1 bg-[#040711] border border-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`p-1.5 rounded font-bold text-xs flex items-center gap-1 ${
                isAutoScrolling ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>Roll</span>
            </button>
            <select 
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-300 font-mono focus:outline-none pr-1"
            >
              <option value={1} className="bg-[#0a0f1d]">1x</option>
              <option value={2} className="bg-[#0a0f1d]">2x</option>
              <option value={3} className="bg-[#0a0f1d]">3x</option>
              <option value={5} className="bg-[#0a0f1d]">5x</option>
            </select>
          </div>

        </div>

        {/* SONG PREV / NEXT */}
        <div className="flex items-center gap-1">
          <button 
            disabled={currentIndex === 0}
            onClick={() => handleSongChange(currentIndex - 1)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors"
            title="Previous Song"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            disabled={currentIndex === setlistSongs.length - 1}
            onClick={() => handleSongChange(currentIndex + 1)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white rounded-lg transition-colors"
            title="Next Song"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* SCROLLABLE LIVE CHART CONTENT */}
      <main 
        ref={chartContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full scroll-smooth"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="mb-6 pb-4 border-b border-slate-800">
          <h1 className="text-3xl font-extrabold text-white">{currentSong?.title}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Artist: {currentSong?.artist || 'Unknown'} | Default Key: <span className="text-cyan-400 font-bold">{currentSong?.key}</span>
          </p>
        </div>

        <div className="space-y-1 font-mono">
          {renderChartContent(currentSong?.chordPro)}
        </div>
      </main>

    </div>
  );
}