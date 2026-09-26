import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Printer, User, FileText } from 'lucide-react';

export default function SetlistPlanner({ 
  activeSetlist, 
  setlistItems = [], 
  setSetlistItems = () => {}, 
  library = [], 
  setSelectedSong, 
  setActiveTab 
}) {
  // Safe array fallback so .filter() or .map() never throw undefined errors
  const items = Array.isArray(setlistItems) ? setlistItems : [];
  const songsLibrary = Array.isArray(library) ? library : [];

  const handleAddSong = (songId) => {
    const songToAdd = songsLibrary.find(s => s.id === songId);
    if (!songToAdd) return;
    const newItem = {
      id: Date.now().toString(),
      songId: songToAdd.id,
      title: songToAdd.title,
      key: songToAdd.key || 'C',
      lead: '',
      notes: ''
    };
    setSetlistItems([...items, newItem]);
  };

  const handleRemoveItem = (id) => {
    setSetlistItems(items.filter(item => item?.id !== id));
  };

  const handleMove = (index, direction) => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setSetlistItems(newItems);
  };

  const handleUpdateItem = (id, field, value) => {
    setSetlistItems(items.map(item => item?.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#070a12] text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Service Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{activeSetlist?.name || 'Service Lineup'}</h2>
            <p className="text-xs text-slate-400 mt-1">{items.length} song(s) in this setlist</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4 text-cyan-400" /> Print Sheet
          </button>
        </div>

        {/* Add Song Dropdown */}
        <div className="flex gap-2 print:hidden">
          <select 
            onChange={(e) => { if (e.target.value) { handleAddSong(e.target.value); e.target.value = ''; } }}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">+ Add song from repertoire...</option>
            {songsLibrary.map(song => (
              <option key={song.id} value={song.id}>[{song.key || 'N/A'}] {song.title}</option>
            ))}
          </select>
        </div>

        {/* Lineup List */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
              <p className="text-sm font-medium">No songs in this setlist yet.</p>
              <p className="text-xs text-slate-600 mt-1">Select a song above to add it to this service lineup.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div 
                key={item.id || index} 
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <button 
                      onClick={() => {
                        const matchedSong = songsLibrary.find(s => s.id === item.songId);
                        if (matchedSong) { setSelectedSong?.(matchedSong); setActiveTab?.('library'); }
                      }}
                      className="font-bold text-white hover:text-cyan-400 text-sm text-left block"
                    >
                      {item.title}
                    </button>
                    <span className="text-xs font-mono text-cyan-400">Key of {item.key}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  {/* Lead Vocal Input */}
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Worship lead..."
                      value={item.lead || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'lead', e.target.value)}
                      className="bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none w-28"
                    />
                  </div>

                  {/* Notes Input */}
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Notes (e.g. key shift, tempo)..."
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                      className="bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none w-36"
                    />
                  </div>

                  {/* Move & Delete Controls */}
                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}