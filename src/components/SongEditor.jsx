import React, { useState, useRef } from 'react';
import { parseChordPro } from '../utils/chordProParser';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

// COMPLETE LIST OF 24 KEYS (MAJOR & MINOR)
const ALL_KEYS = [
  // Major Keys
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  // Minor Keys
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

// DIATONIC CHORD MAPPER FOR EVERY KEY
const DIATONIC_CHORDS_MAP = {
  // MAJOR KEYS
  'C':  ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'Gsus4', 'C/E', 'Fsus2'],
  'Db': ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim', 'Absus4', 'Db/F', 'Gbsus2'],
  'D':  ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim', 'Asus4', 'D/F#', 'Gsus2'],
  'Eb': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim', 'Bbsus4', 'Eb/G', 'Absus2'],
  'E':  ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim', 'Bsus4', 'E/G#', 'Asus2'],
  'F':  ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim', 'Csus4', 'F/A', 'Bbsus2'],
  'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim', 'C#sus4', 'F#/A#', 'Bsus2'],
  'G':  ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim', 'Dsus4', 'G/B', 'Csus2'],
  'Ab': ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim', 'Ebsus4', 'Ab/C', 'Dbsus2'],
  'A':  ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim', 'Esus4', 'A/C#', 'Dsus2'],
  'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim', 'Fsus4', 'Bb/D', 'Ebsus2'],
  'B':  ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim', 'F#sus4', 'B/D#', 'Esus2'],

  // MINOR KEYS
  'Cm':  ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'G', 'Ab', 'Bb', 'Ebsus4', 'Cm/Eb'],
  'C#m': ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'G#', 'A', 'B', 'Esus4', 'C#m/E'],
  'Dm':  ['Dm', 'Edim', 'F', 'Gm', 'Am', 'A', 'Bb', 'C', 'Fsus4', 'Dm/F'],
  'Ebm': ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'Bb', 'Cb', 'Db', 'Gbsus4', 'Ebm/Gb'],
  'Em':  ['Em', 'F#dim', 'G', 'Am', 'Bm', 'B', 'C', 'D', 'Gsus4', 'Em/G'],
  'Fm':  ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'C', 'Db', 'Eb', 'Absus4', 'Fm/Ab'],
  'F#m': ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'C#', 'D', 'E', 'Asus4', 'F#m/A'],
  'Gm':  ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'D', 'Eb', 'F', 'Bbsus4', 'Gm/Bb'],
  'G#m': ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'D#', 'E', 'F#', 'Bsus4', 'G#m/B'],
  'Am':  ['Am', 'Bdim', 'C', 'Dm', 'Em', 'E', 'F', 'G', 'Csus4', 'Am/C'],
  'Bbm': ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'F', 'Gb', 'Ab', 'Dbsus4', 'Bbm/Db'],
  'Bm':  ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'F#', 'G', 'A', 'Dsus4', 'Bm/D']
};

const SECTION_PRESETS = [
  'Verse', 'Verse II', 'Verse III', 'Verse IV', 'Repeat Verse', 
  'Pre-Chorus', 'Chorus', 'Chorus II', 'Repeat Chorus', 
  'Refrain', 'Bridge', 'Tag', 'Interlude', 'Vamp', 'Repeat Vamp', 'Outro'
];

export default function SongEditor({ song, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    id: song?.id || Date.now().toString(),
    title: song?.title || 'Untitled Song',
    artist: song?.artist || '',
    key: song?.key || 'G',
    capo: song?.capo || 'None',
    tempo: song?.tempo || '',
    timeSignature: song?.timeSignature || '4/4',
    language: song?.language || 'English',
    tag: song?.tag || '',
    referenceUrl: song?.referenceUrl || '',
    chordPro: song?.chordPro || `{title: ${song?.title || 'Untitled Song'}}\n{key: ${song?.key || 'G'}}\n{verse}\n[G]Start typing here[Em]`,
    notes: song?.notes || ''
  });

  const textareaRef = useRef(null);

  // Quick insertion helper at cursor position
  const insertAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = formData.chordPro;

    const updated = current.substring(0, start) + textToInsert + current.substring(end);
    
    setFormData(prev => ({ ...prev, chordPro: updated }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  // Get active key chord preset or default fallback
  const activeChordPresets = DIATONIC_CHORDS_MAP[formData.key] || DIATONIC_CHORDS_MAP['G'];

  const parsedLines = parseChordPro(formData.chordPro);

  return (
    <div className="fixed inset-0 z-50 bg-[#010719] text-white flex flex-col overflow-hidden font-sans">
      
      {/* HEADER BAR */}
      <header className="h-14 bg-[#070a12] border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </button>
          <div className="h-4 w-px bg-slate-800"></div>
          <h1 className="text-sm font-black text-white tracking-wide">
            {formData.title ? formData.title : 'New Song Chart'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {song?.id && (
            <button 
              onClick={() => onDelete(formData.id)}
              className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Chart"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-cyan-400 hover:bg-white text-slate-950 font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <Save className="w-3.5 h-3.5" /> Save Chart
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* METADATA FORM FIELDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 bg-[#070a12] p-4 rounded-xl border border-slate-800/80">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Song Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              placeholder="e.g. Amazing Grace"
            />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Artist</label>
            <input 
              type="text" 
              value={formData.artist} 
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              placeholder="e.g. John Newton"
            />
          </div>

          {/* DYNAMIC KEY DROPDOWN INCLUDING ALL MAJOR & MINOR KEYS */}
          <div>
            <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Key</label>
            <select 
              value={formData.key} 
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full bg-[#0a0f1d] border border-cyan-500/50 rounded-lg px-2 py-1.5 text-xs text-cyan-300 font-extrabold focus:border-cyan-400 focus:outline-none font-mono"
            >
              <optgroup label="Major Keys">
                {ALL_KEYS.slice(0, 12).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </optgroup>
              <optgroup label="Minor Keys">
                {ALL_KEYS.slice(12).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Capo</label>
            <input 
              type="text" 
              value={formData.capo} 
              onChange={(e) => setFormData({ ...formData, capo: e.target.value })}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Capo 1"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Language</label>
            <select 
              value={formData.language} 
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Tagalog">Tagalog</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tag</label>
            <input 
              type="text" 
              value={formData.tag} 
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              placeholder="e.g. Praise"
            />
          </div>
        </div>

        {/* TOOLBAR: CHORDS (UPDATED AUTOMATICALLY BASED ON SELECTED KEY) */}
        <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800/80 space-y-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-[90px]">
              <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">CHORDS</span>
              <span className="text-[9px] font-mono text-slate-500 font-bold">({formData.key})</span>
            </div>
            
            {/* CLICKABLE CHORDS AUTOMATICALLY DYNAMIC TO KEY */}
            <div className="flex flex-wrap gap-1.5">
              {activeChordPresets.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  onClick={() => insertAtCursor(`[${chord}]`)}
                  className="px-2.5 py-1 bg-[#0a0f1d] hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-800 text-slate-200 text-xs font-mono font-bold rounded transition-colors shadow-sm"
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>

          {/* SECTIONS STRIP */}
          <div className="flex items-baseline gap-2 flex-wrap pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider min-w-[90px]">SECTIONS</span>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_PRESETS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => insertAtCursor(`\n{${sec.toLowerCase()}}\n`)}
                  className="px-2.5 py-1 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold rounded transition-colors"
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* SPLIT SCREEN: LEFT EDITOR / RIGHT LIVE PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[420px]">
          
          {/* LEFT: EDITOR INPUT */}
          <div className="flex flex-col bg-[#070a12] border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="bg-[#0a0f1d] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                CHORDPRO-COMPATIBLE SOURCE
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Click any chord button above to insert automatically
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={formData.chordPro}
              onChange={(e) => setFormData({ ...formData, chordPro: e.target.value })}
              className="flex-1 w-full bg-[#030712] p-4 text-xs font-mono text-cyan-300 leading-relaxed focus:outline-none resize-none"
              placeholder="{verse}&#10;[G]Start typing here[Em]"
            />
          </div>

          {/* RIGHT: LIVE PREVIEW MODE */}
          <div className="flex flex-col bg-[#070a12] border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="bg-[#0a0f1d] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                LIVE PREVIEW
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-time sync</span>
            </div>

            <div className="flex-1 bg-[#010613] p-6 overflow-y-auto space-y-4 font-mono text-xs">
              {parsedLines.map((item, idx) => {
                if (item.type === 'section') {
                  return (
                    <div key={idx} className="pt-2 text-cyan-400 font-black tracking-widest text-[11px] uppercase">
                      {item.label}
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex flex-wrap items-end gap-x-1 leading-loose">
                    {item.parts.map((p, pIdx) => (
                      <span key={pIdx} className="inline-flex flex-col justify-end">
                        {p.chord && (
                          <span className="text-cyan-400 font-extrabold text-[11px] -mb-1">
                            {p.chord}
                          </span>
                        )}
                        <span className="text-slate-200 whitespace-pre">{p.text || ' '}</span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* SONG / REHEARSAL NOTES */}
        <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800/80">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            REHEARSAL & ARRANGEMENT NOTES
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add transition cues, instrumental cues, or specific team instructions..."
            className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none resize-none"
          />
        </div>

      </div>

    </div>
  );
}