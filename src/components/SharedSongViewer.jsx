import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Minus, Columns, Play, Pause, ArrowLeft, Music 
} from 'lucide-react';

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NUMBER_MAP = {
  'C': { 'C': '1', 'C#': '#1', 'Db': 'b2', 'D': '2', 'D#': '#2', 'Eb': 'b3', 'E': '3', 'F': '4', 'F#': '#4', 'Gb': 'b5', 'G': '5', 'G#': '#5', 'Ab': 'b6', 'A': '6', 'A#': '#6', 'Bb': 'b7', 'B': '7' },
  'G': { 'G': '1', 'G#': '#1', 'Ab': 'b2', 'A': '2', 'A#': '#2', 'Bb': 'b3', 'B': '3', 'C': '4', 'C#': '#4', 'Db': 'b5', 'D': '5', 'D#': '#5', 'Eb': 'b6', 'E': '6', 'F': 'b7', 'F#': '7' },
  'D': { 'D': '1', 'D#': '#1', 'Eb': 'b2', 'E': '2', 'F': 'b3', 'F#': '3', 'G': '4', 'G#': '#4', 'Ab': 'b5', 'A': '5', 'A#': '#5', 'Bb': 'b6', 'B': '6', 'C': 'b7', 'C#': '7' },
  'A': { 'A': '1', 'A#': '#1', 'Bb': 'b2', 'B': '2', 'C': 'b3', 'C#': '3', 'D': '4', 'D#': '#4', 'Eb': 'b5', 'E': '5', 'F': 'b6', 'F#': '6', 'G': 'b7', 'G#': '7' },
  'E': { 'E': '1', 'F': 'b2', 'F#': '2', 'G': 'b3', 'G#': '3', 'A': '4', 'A#': '#4', 'Bb': 'b5', 'B': '5', 'C': 'b6', 'C#': '6', 'D': 'b7', 'D#': '7' },
  'B': { 'B': '1', 'C': 'b2', 'C#': '2', 'D': 'b3', 'D#': '3', 'E': '4', 'F': 'b5', 'F#': '5', 'G': 'b6', 'G#': '6', 'A': 'b7', 'A#': '7' },
  'F': { 'F': '1', 'F#': '#1', 'Gb': 'b2', 'G': '2', 'G#': '#2', 'Ab': 'b3', 'A': '3', 'A#': '4', 'Bb': '4', 'B': '#4', 'C': '5', 'C#': '#5', 'Db': 'b6', 'D': '6', 'D#': '#6', 'Eb': 'b7', 'E': '7' },
  'Bb': { 'Bb': '1', 'B': 'b2', 'C': '2', 'C#': 'b3', 'Db': 'b3', 'D': '3', 'Eb': '4', 'E': '#4', 'F': '5', 'F#': '#5', 'Gb': 'b6', 'G': '6', 'Ab': 'b7', 'A': '7' },
  'Eb': { 'Eb': '1', 'E': 'b2', 'F': '2', 'F#': 'b3', 'Gb': 'b3', 'G': '3', 'Ab': '4', 'A': '#4', 'Bb': '5', 'B': 'b6', 'C': '6', 'Db': 'b7', 'D': '7' }
};

export default function SharedSongViewer({ songData, onBackToLibrary }) {
  const [keyOffset, setKeyOffset] = useState(0);
  const [viewMode, setViewMode] = useState('chords'); // 'chords' | 'numbers'
  const [columns, setColumns] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Auto-scroll states & refs
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const scrollContainerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Extract metadata and content dynamically
  const { title, artist, originalKey, capo, timeSignature, contentLines } = useMemo(() => {
    let rawContent = songData?.chordPro || '';
    let extractedTitle = songData?.title || 'My Edited Sample Song';
    let extractedArtist = songData?.artist || 'ME';
    let extractedKey = songData?.key || 'G';
    let extractedCapo = songData?.capo || 'None';
    let extractedTime = songData?.timeSignature || '4/4';

    const lines = rawContent.split('\n');
    const filteredLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed.match(/^\{(?:t|title):\s*([^}]+)\}/i)) {
        extractedTitle = trimmed.match(/^\{(?:t|title):\s*([^}]+)\}/i)[1].trim();
        return;
      }
      if (trimmed.match(/^\{(?:a|artist):\s*([^}]+)\}/i)) {
        extractedArtist = trimmed.match(/^\{(?:a|artist):\s*([^}]+)\}/i)[1].trim();
        return;
      }
      if (trimmed.match(/^\{(?:k|key):\s*([^}]+)\}/i)) {
        extractedKey = trimmed.match(/^\{(?:k|key):\s*([^}]+)\}/i)[1].trim();
        return;
      }
      if (trimmed.match(/^\{capo:\s*([^}]+)\}/i)) {
        extractedCapo = trimmed.match(/^\{capo:\s*([^}]+)\}/i)[1].trim();
        return;
      }

      const sectionDirectiveMatch = trimmed.match(/^\{([^}]+)\}$/);
      if (sectionDirectiveMatch) {
        filteredLines.push({ type: 'header', text: sectionDirectiveMatch[1].toUpperCase() });
        return;
      }

      if (/^(INTRO|VERSE|CHORUS|BRIDGE|OUTRO|PRE-CHORUS|TAG)$/i.test(trimmed)) {
        filteredLines.push({ type: 'header', text: trimmed.toUpperCase() });
        return;
      }

      filteredLines.push({ type: 'content', text: line });
    });

    return {
      title: songData?.title || extractedTitle,
      artist: songData?.artist || extractedArtist,
      originalKey: songData?.key || extractedKey,
      capo: songData?.capo || extractedCapo,
      timeSignature: songData?.timeSignature || extractedTime,
      contentLines: filteredLines
    };
  }, [songData]);

  // Key Transposition Logic
  const transposeChord = (chordStr, offset) => {
    if (!chordStr || offset === 0) return chordStr;
    return chordStr.replace(/[A-G][#b]?/g, (match) => {
      let isFlat = match.includes('b');
      let scale = isFlat ? FLAT_SCALE : CHROMATIC_SCALE;
      let idx = scale.indexOf(match);
      if (idx === -1) {
        scale = isFlat ? CHROMATIC_SCALE : FLAT_SCALE;
        idx = scale.indexOf(match);
      }
      if (idx === -1) return match;
      let newIdx = (idx + offset) % 12;
      if (newIdx < 0) newIdx += 12;
      return scale[newIdx];
    });
  };

  const currentKey = useMemo(() => {
    return transposeChord(originalKey, keyOffset);
  }, [originalKey, keyOffset]);

  // Convert Chords to Nashville Numbers
  const convertToNumber = (chord) => {
    const rootMatch = chord.match(/[A-G][#b]?/);
    if (!rootMatch) return chord;
    const root = rootMatch[0];
    const quality = chord.slice(root.length);
    
    const baseKey = currentKey.replace(/m$/, '');
    const map = NUMBER_MAP[baseKey] || NUMBER_MAP['G'];
    const numberRoot = map[root] || root;
    return numberRoot + quality;
  };

  // Auto-scroll loop effect
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const scrollStep = (currentTime) => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const elapsed = currentTime - lastTime;
      lastTime = currentTime;

      el.scrollTop += speed * (elapsed * 0.03);

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setIsPlaying(false);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed]);

  // Render Line Helper
  const renderLineItem = (item, idx) => {
    if (item.type === 'header') {
      return (
        <div key={idx} className="mt-8 mb-4 text-cyan-400 font-extrabold text-xs tracking-wider uppercase">
          {item.text}
        </div>
      );
    }

    const line = item.text;

    if (line.includes('[')) {
      const parts = line.split(/(\[[^\]]+\])/g);
      let chordRow = '';
      let lyricRow = '';

      parts.forEach((part) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          let rawChord = part.slice(1, -1);
          let processedChord = transposeChord(rawChord, keyOffset);
          
          if (viewMode === 'numbers') {
            processedChord = convertToNumber(processedChord);
          }

          chordRow += processedChord.padEnd(Math.max(processedChord.length + 1, 3), ' ');
        } else {
          lyricRow += part;
          chordRow += ' '.repeat(part.length);
        }
      });

      return (
        <div key={idx} className="mb-2 font-mono leading-tight">
          <div className="text-cyan-400 font-bold whitespace-pre">
            {chordRow}
          </div>
          <div className="text-slate-100 whitespace-pre">
            {lyricRow || ' '}
          </div>
        </div>
      );
    }

    return (
      <div key={idx} className="font-mono text-cyan-400 font-bold whitespace-pre my-1">
        {viewMode === 'numbers' ? line.replace(/[A-G][#b]?/g, (match) => convertToNumber(transposeChord(match, keyOffset))) : line}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#050811] text-slate-100 overflow-hidden font-sans relative">
      
      {/* UPPER LEFT APP NAVIGATION BAR */}
      <div className="px-6 py-3 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#050811]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToLibrary || (() => window.history.back())}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Music className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-extrabold tracking-wider text-white uppercase">Worship Chart</span>
          </div>
        </div>
      </div>

      {/* CENTERED HEADER AREA */}
      <div className="pt-6 px-10 pb-3 shrink-0 text-center flex flex-col items-center">
        <div className="text-[10px] font-extrabold text-cyan-400 tracking-widest uppercase mb-1">
          {artist}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          {title}
        </h1>
        <div className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
          <span>Key: <strong className="text-slate-200">{currentKey}</strong></span>
          <span>•</span>
          <span>Capo: <strong className="text-slate-200">{capo}</strong></span>
          <span>•</span>
          <span>{timeSignature}</span>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="px-10 py-3 border-b border-slate-800/80 flex items-center justify-center gap-8 shrink-0 text-xs bg-[#050811]/90 z-10">
        
        {/* KEY CONTROL */}
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-400 uppercase text-[11px]">KEY</span>
          <button 
            onClick={() => setKeyOffset(prev => prev - 1)}
            className="text-slate-400 hover:text-white px-1 font-bold cursor-pointer"
          >
            -
          </button>
          <span className="font-mono font-bold text-cyan-400 min-w-[18px] text-center">
            {currentKey}
          </span>
          <button 
            onClick={() => setKeyOffset(prev => prev + 1)}
            className="text-slate-400 hover:text-white px-1 font-bold cursor-pointer"
          >
            +
          </button>
        </div>

        {/* CHORDS / NUMBERS TOGGLE */}
        <div className="flex items-center bg-[#0a0f1d] border border-slate-800 rounded-lg p-0.5">
          <button 
            onClick={() => setViewMode('chords')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              viewMode === 'chords' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chords
          </button>
          <button 
            onClick={() => setViewMode('numbers')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              viewMode === 'numbers' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Numbers
          </button>
        </div>

        {/* COLUMNS SELECTOR */}
        <button 
          onClick={() => setColumns(prev => prev === 1 ? 2 : 1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white font-bold cursor-pointer"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>{columns} columns</span>
        </button>

        {/* ZOOM CONTROL */}
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-extrabold uppercase text-[11px]">ZOOM</span>
          <button onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))} className="hover:text-white font-bold cursor-pointer">-</button>
          <span className="font-mono font-bold text-slate-200 min-w-[36px] text-center">{zoomLevel}%</span>
          <button onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))} className="hover:text-white font-bold cursor-pointer">+</button>
        </div>
      </div>

      {/* CENTERED CONTAINER WITH LEFT-ALIGNED TEXT & FOOTER */}
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto px-10 py-8 flex flex-col items-center">
        <div 
          className={`w-full max-w-2xl text-left grid ${columns === 2 ? 'grid-cols-2 gap-12' : 'grid-cols-1'} transition-all duration-150`}
          style={{ fontSize: `${(15 * zoomLevel) / 100}px` }}
        >
          {contentLines.map((item, idx) => renderLineItem(item, idx))}
        </div>

        {/* FOOTER */}
        <div className="w-full max-w-2xl mt-16 pt-6 border-t border-slate-800/60 text-center text-xs text-slate-500 font-medium">
          Created by Hommer Angelo
        </div>
      </main>

      {/* BOTTOM RIGHT PLAY / SCROLL FLOATING BUTTON */}
      <div className="absolute bottom-6 right-8 flex items-center bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1.5 shadow-xl gap-3 z-20">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono font-bold pr-1">
          <span className="text-[10px] text-slate-500 font-sans uppercase">SPEED</span>
          <button onClick={() => setSpeed(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))} className="text-slate-400 hover:text-white cursor-pointer">-</button>
          <span>{speed}x</span>
          <button onClick={() => setSpeed(prev => Math.min(3, Number((prev + 0.25).toFixed(2))))} className="text-slate-400 hover:text-white cursor-pointer">+</button>
        </div>
      </div>

    </div>
  );
}