import React, { useState } from 'react';
import { 
  Printer, Share2, Play, Plus, X, Trash2, Edit2, GripVertical 
} from 'lucide-react';
import SetlistLiveMode from './SetlistLiveMode';

export default function SetlistManager({ 
  setlist, 
  setlists, 
  setSetlists, 
  librarySongs, 
  activeSetlistId, 
  setActiveSetlistId 
}) {
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(setlist?.title || '');
  const [copied, setCopied] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // LIVE MODE TOGGLE STATE
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);

  if (!setlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-bold mb-2">No Setlist Selected</p>
        <p className="text-xs">Select or create a setlist from the sidebar to start editing.</p>
      </div>
    );
  }

  // If Live Mode is active, render the dedicated separate component instead!
  if (isLiveModeOpen) {
    return (
      <SetlistLiveMode 
        setlist={setlist} 
        librarySongs={librarySongs} 
        onClose={() => setIsLiveModeOpen(false)} 
      />
    );
  }

  const handleTitleSave = () => {
    if (!titleInput.trim()) return;
    setSetlists(prev => prev.map(s => s.id === setlist.id ? { ...s, title: titleInput } : s));
    setIsEditingTitle(false);
  };

  const handleAddSongToSetlist = (song) => {
    const newItem = {
      id: 'item-' + Date.now(),
      songId: song.id,
      title: song.title,
      artist: song.artist || 'Unknown Artist',
      key: song.key || 'C',
      chordPro: song.chordPro || ''
    };

    setSetlists(prev => prev.map(s => {
      if (s.id === setlist.id) {
        return { ...s, items: [...(s.items || []), newItem] };
      }
      return s;
    }));
    setIsSongModalOpen(false);
  };

  const handleRemoveSong = (itemId) => {
    setSetlists(prev => prev.map(s => {
      if (s.id === setlist.id) {
        return { ...s, items: (s.items || []).filter(item => item.id !== itemId) };
      }
      return s;
    }));
  };

  const handleDeleteSetlist = () => {
    if (window.confirm("Are you sure you want to delete this setlist?")) {
      setSetlists(prev => prev.filter(s => s.id !== setlist.id));
      const remaining = setlists.filter(s => s.id !== setlist.id);
      if (remaining.length > 0) {
        setActiveSetlistId(remaining[0].id);
      } else {
        setActiveSetlistId(null);
      }
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...(setlist.items || [])];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setDraggedIndex(index);

    setSetlists(prev => prev.map(s => {
      if (s.id === setlist.id) {
        return { ...s, items };
      }
      return s;
    }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // UPDATED SHARE HANDLER: Packs full setlist items & library songs for Live Mode display
  const handleShareSetlist = () => {
    const setlistSongIds = (setlist.items || []).map(i => i.songId);
    const setlistSongs = librarySongs.filter(s => setlistSongIds.includes(s.id));

    const shareablePayload = {
      setlist,
      songs: setlistSongs,
      footer: "Created by Hommer Angelo"
    };

    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(shareablePayload)));
      const shareUrl = `${window.location.origin}${window.location.pathname}?sharedSetlist=${encoded}`;

      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      alert("Failed to generate share link.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#010719] overflow-y-auto p-8 relative">
      
      <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest mb-1 block">
        SETLIST BUILDER
      </span>

      {/* HEADER TITLE & ACTIONS */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="bg-[#0a0f1d] border border-cyan-400 text-3xl font-black text-white px-3 py-1 rounded focus:outline-none"
              autoFocus
            />
            <button 
              onClick={handleTitleSave}
              className="px-3 py-1 bg-cyan-400 text-slate-950 font-bold text-xs rounded"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
            setTitleInput(setlist.title);
            setIsEditingTitle(true);
          }}>
            <h1 className="text-4xl font-black text-white tracking-tight">{setlist.title}</h1>
            <Edit2 className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>

          <button 
            onClick={handleShareSetlist}
            className={`px-3 py-1.5 border font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
              copied 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-[#0a0f1d] hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> {copied ? 'Link Copied!' : 'Share setlist'}
          </button>

          {/* OPEN SETLIST LIVE BUTTON */}
          <button 
            onClick={() => setIsLiveModeOpen(true)}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Open setlist live
          </button>
        </div>
      </div>

      {/* RUNNING ORDER SECTION */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
          RUNNING ORDER ({setlist.items?.length || 0} songs)
        </span>
        <button 
          onClick={() => setIsSongModalOpen(true)}
          className="p-1.5 bg-cyan-400 hover:bg-white text-slate-950 rounded-lg transition-colors"
          title="Add song to setlist"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* SONG LIST WITH DRAG HANDLE */}
      <div className="space-y-2 mb-12">
        {(setlist.items || []).map((item, idx) => (
          <div 
            key={item.id || idx}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className="flex items-center justify-between p-3 bg-[#0a0f1d]/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-3">
              <div className="text-slate-600 hover:text-slate-400 cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 w-5">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                {item.key}
              </span>
              <button 
                onClick={() => handleRemoveSong(item.id)}
                className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                title="Remove song"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {(!setlist.items || setlist.items.length === 0) && (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-[#0a0f1d]/30">
            <p className="text-xs text-slate-500">No songs in this setlist yet. Click '+' to add from your library.</p>
          </div>
        )}
      </div>

      {/* DELETE SETLIST FOOTER ACTION */}
      <div className="mt-auto pt-6 border-t border-slate-900 flex justify-end">
        <button 
          onClick={handleDeleteSetlist}
          className="text-xs text-red-500 hover:text-red-400 font-bold transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete setlist
        </button>
      </div>

      {/* ADD SONG FROM LIBRARY MODAL */}
      {isSongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f141e] border border-slate-800 w-full max-w-md rounded-xl p-6 relative flex flex-col max-h-[80vh]">
            <button 
              onClick={() => setIsSongModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-4">Add Song to Setlist</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {librarySongs.map(song => (
                <div 
                  key={song.id}
                  onClick={() => handleAddSongToSetlist(song)}
                  className="p-3 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{song.title}</h4>
                    <p className="text-[11px] text-slate-400">{song.artist}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">{song.key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}