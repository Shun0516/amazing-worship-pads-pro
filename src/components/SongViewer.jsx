import React, { useState, useEffect, useRef } from 'react';
import { parseChordPro } from '../utils/chordProParser';
import { supabase } from '../supabase';
import { 
  Printer, Share2, Edit3, Play, Pause, Plus, Minus, 
  Columns, Music, Check 
} from 'lucide-react';

// --- CHROMATIC & NASHVILLE UTILITIES ---
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_INDEX = {
  'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4, 'F': 5, 'E#': 5, 'F#': 6, 'Gb': 6, 'G': 7,
  'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
};

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const NUMBER_MAP = ['1', '2', '3', '4', '5', '6', '7'];

function transposeChord(chord, semiSteps) {
  if (!semiSteps || semiSteps === 0 || !chord) return chord;
  if (chord.includes('/')) {
    const [root, bass] = chord.split('/');
    return `${transposeChord(root, semiSteps)}/${transposeChord(bass, semiSteps)}`;
  }
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const [, root, quality] = match;
  const rootIndex = NOTE_INDEX[root];
  if (rootIndex === undefined) return chord;
  const newIndex = (rootIndex + semiSteps + 1200) % 12;
  return CHROMATIC_SCALE[newIndex] + quality;
}

function chordToNashville(chord, keyRoot) {
  if (!chord || !keyRoot) return chord;
  if (chord.includes('/')) {
    const [root, bass] = chord.split('/');
    return `${chordToNashville(root, keyRoot)}/${chordToNashville(bass, keyRoot)}`;
  }
  const cleanKey = keyRoot.replace(/m$/g, '');
  const keyIndex = NOTE_INDEX[cleanKey];
  if (keyIndex === undefined) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const [, root, quality] = match;
  const chordIndex = NOTE_INDEX[root];
  if (chordIndex === undefined) return chord;
  const interval = (chordIndex - keyIndex + 1200) % 12;
  const scaleDegreeIndex = MAJOR_SCALE_INTERVALS.indexOf(interval);
  if (scaleDegreeIndex !== -1) {
    return NUMBER_MAP[scaleDegreeIndex] + quality;
  }
  return chord;
}

export default function SongViewer({ song, onEdit }) {
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [notationMode, setNotationMode] = useState('chords');
  const [columnLayout, setColumnLayout] = useState(1);
  const [chordZoom, setChordZoom] = useState(100);
  const [copied, setCopied] = useState(false);

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    setTransposeSteps(0);
  }, [song?.id]);

  useEffect(() => {
    let scrollInterval = null;
    if (isAutoScrolling) {
      scrollInterval = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    } else {
      clearInterval(scrollInterval);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling, scrollSpeed]);

  if (!song) return null;

  const originalKey = song.key || 'C';
  const activeKeyDisplay = transposeChord(originalKey, transposeSteps);

  const handleTransposeDown = () => setTransposeSteps(prev => prev - 1);
  const handleTransposeUp = () => setTransposeSteps(prev => prev + 1);

  const formatChordDisplay = (rawChord) => {
    if (!rawChord) return '';
    const transposed = transposeChord(rawChord, transposeSteps);
    if (notationMode === 'numbers') {
      return chordToNashville(transposed, activeKeyDisplay);
    }
    return transposed;
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const baseSlug = (song.title || 'worship-song')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const payload = {
      id: song.id || 'shared-' + Date.now(),
      title: song.title || 'Untitled Song',
      artist: song.artist || 'Unknown Artist',
      key: song.key || 'C',
      tempo: song.tempo || '',
      timeSignature: song.timeSignature || '',
      capo: song.capo || '0',
      chordPro: song.chordPro || '',
      notes: song.notes || ''
    };

    try {
      const { error } = await supabase
        .from('shared_songs')
        .insert([{ slug, title: payload.title, payload }]);

      if (error) throw error;

      const shortUrl = `${window.location.origin}/song-share/${slug}`;
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Failed to generate short link.");
    }
  };

  const parsedLines = parseChordPro(song.chordPro || '');

  return (
    <div className="relative flex-1 flex flex-col bg-[#02050a] text-slate-100 overflow-hidden font-mono">

      {/* GLOBAL EMBEDDED PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 15mm 15mm 15mm 15mm;
          }
          
          body, html, #root {
            background-color: #000000 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          header, aside, .print-hide, .no-print {
            display: none !important;
          }

          .printable-area {
            padding: 0 !important;
            margin: 0 !important;
            background-color: #000000 !important;
            width: 100% !important;
            overflow: visible !important;
          }

          .print-header-brand {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }

          .song-section-label {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 18px !important;
            color: #38bdf8 !important;
          }

          .song-line {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }

        .print-header-brand {
          display: none;
        }
      `}</style>

      {/* SCROLLABLE MAIN CONTENT */}
      <div ref={containerRef} className="printable-area flex-1 overflow-y-auto p-6 md:p-10 space-y-6">

        {/* BRAND HEADER FOR PDF PRINT */}
        <div className="print-header-brand">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <span className="font-extrabold text-xs text-white uppercase tracking-wider font-sans">
              Amazing Worship Pads Pro
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date().toLocaleDateString()}
          </span>
        </div>

        {/* SONG TITLE HEADER */}
        <div className="space-y-1.5 border-b border-slate-800/60 pb-5 font-sans">
          <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">
            {song.artist || 'Unknown Artist'}
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {song.title || 'Untitled Song'}
          </h1>

          <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-slate-400 font-mono">
            <span>Key: <strong className="text-cyan-400 font-bold">{activeKeyDisplay}</strong></span>
            {song.capo && song.capo !== '0' && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span>Capo: <strong className="text-white">{song.capo}</strong></span>
              </>
            )}
            {song.tempo && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span>{song.tempo} BPM</span>
              </>
            )}
            {song.timeSignature && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span>{song.timeSignature}</span>
              </>
            )}
          </div>
        </div>

        {/* ACTION BUTTON BAR (HIDDEN IN PRINT) */}
        <div className="print-hide flex items-center gap-3 pt-1 font-sans">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print / PDF
          </button>

          <button 
            onClick={handleShare}
            className={`px-4 py-2 border border-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow ${
              copied 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' 
                : 'bg-[#0a0f1d] hover:bg-slate-800 text-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Live chart link copied!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" /> Share live chart
              </>
            )}
          </button>

          <button 
            onClick={onEdit}
            className="px-4 py-2 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Edit chart
          </button>
        </div>

        {/* PERFORMANCE CONTROLS TOOLBAR (HIDDEN IN PRINT) */}
        <div className="print-hide bg-[#070c18] border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between flex-wrap gap-4 font-sans">

          {/* KEY TRANSPOSE CONTROLS */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">KEY</span>
            <div className="flex items-center bg-[#0a0f1d] border border-slate-800 rounded-lg p-0.5">
              <button 
                onClick={handleTransposeDown} 
                className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-black transition-colors"
              >
                -
              </button>
              <span className="px-3 text-xs font-black text-cyan-400 font-mono min-w-[36px] text-center">
                {activeKeyDisplay}
              </span>
              <button 
                onClick={handleTransposeUp} 
                className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded text-xs font-mono font-black transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* CHORDS VS NASHVILLE NUMBERS TOGGLE */}
          <div className="flex items-center bg-[#0a0f1d] border border-slate-800 rounded-lg p-0.5 text-xs font-bold">
            <button 
              onClick={() => setNotationMode('chords')}
              className={`px-3 py-1 rounded-md transition-colors ${
                notationMode === 'chords' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chords
            </button>
            <button 
              onClick={() => setNotationMode('numbers')}
              className={`px-3 py-1 rounded-md transition-colors ${
                notationMode === 'numbers' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Numbers
            </button>
          </div>

          {/* COLUMN LAYOUT TOGGLE */}
          <button 
            onClick={() => setColumnLayout(columnLayout === 1 ? 2 : 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors"
          >
            <Columns className="w-3.5 h-3.5 text-cyan-400" />
            <span>{columnLayout} columns</span>
          </button>

          {/* CHORD ZOOM LEVEL */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ZOOM</span>
            <div className="flex items-center bg-[#0a0f1d] border border-slate-800 rounded-lg p-0.5">
              <button 
                onClick={() => setChordZoom(prev => Math.max(70, prev - 10))}
                className="px-2 py-0.5 text-slate-400 hover:text-white text-xs font-mono font-bold"
              >
                -
              </button>
              <span className="px-2 text-xs font-bold text-slate-300 font-mono">
                {chordZoom}%
              </span>
              <button 
                onClick={() => setChordZoom(prev => Math.min(150, prev + 10))}
                className="px-2 py-0.5 text-slate-400 hover:text-white text-xs font-mono font-bold"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* CHART RENDER - MATCHED TO YOUR DESIGN IMAGE */}
        <div className={`pt-2 ${columnLayout === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6' : 'space-y-6'}`}>
          {parsedLines.map((item, idx) => {
            if (item.type === 'section') {
              return (
                <div 
                  key={idx} 
                  className="song-section-label pt-4 text-cyan-400 font-black tracking-widest text-sm uppercase font-mono"
                >
                  {item.label}
                </div>
              );
            }

            return (
              <div 
                key={idx} 
                style={{ fontSize: `${(15 * chordZoom) / 100}px` }}
                className="song-line flex flex-wrap items-end leading-relaxed font-mono tracking-normal my-1"
              >
                {item.parts.map((p, pIdx) => {
                  const chordText = formatChordDisplay(p.chord);

                  return (
                    <span key={pIdx} className="inline-flex flex-col justify-end">
                      {/* CHORD ROW */}
                      <span className="text-cyan-400 font-black tracking-wider h-6 flex items-end">
                        {chordText || '\u00A0'}
                      </span>
                      {/* LYRIC ROW */}
                      <span className="text-slate-100 font-medium whitespace-pre">
                        {p.text || '\u00A0'}
                      </span>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* NOTES SECTION */}
        {song.notes && (
          <div className="mt-8 p-4 bg-[#070c18] border border-slate-800/80 rounded-xl space-y-1 font-mono">
            <h4 className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider font-sans">
              REHEARSAL & ARRANGEMENT NOTES
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {song.notes}
            </p>
          </div>
        )}

      </div>

      {/* STICKY AUTOSCROLL WIDGET (HIDDEN IN PRINT) */}
      <div className="print-hide absolute bottom-6 right-6 z-40 bg-[#0a0f1d]/90 backdrop-blur border border-slate-800 p-2 rounded-xl shadow-2xl flex items-center gap-3 font-sans">
        <button
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
          className="p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold transition-colors"
          title={isAutoScrolling ? 'Pause Auto-scroll' : 'Start Auto-scroll'}
        >
          {isAutoScrolling ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
        </button>

        <div className="flex items-center gap-2 pr-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">SPEED</span>

          <button 
            onClick={() => setScrollSpeed(prev => Math.max(1, prev - 1))}
            className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="text-xs font-mono font-bold text-white min-w-[20px] text-center">
            {scrollSpeed}x
          </span>

          <button 
            onClick={() => setScrollSpeed(prev => Math.min(5, prev + 1))}
            className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
}
