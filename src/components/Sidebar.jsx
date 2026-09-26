import React, { useState } from 'react';
import { Search, Plus, Link as LinkIcon, FileUp, Trash2, ListPlus, Share2 } from 'lucide-react';

export default function Sidebar({
  activeTab,
  library,
  selectedSong,
  setSelectedSong,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedKeyFilter,
  setSelectedKeyFilter,
  searchInputRef,
  onOpenNewModal,
  onOpenLinkModal,
  onOpenFileModal,
  onDeleteSong,
  savedSetlists,
  activeSetlistId,
  setActiveSetlistId,
  onCreateNewSetlist,
  onDeleteSetlist,
  onShareSetlist
}) {
  const [newSetlistName, setNewSetlistName] = useState('');

  const filteredLibrary = library.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (song.lyrics && song.lyrics.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang = selectedLanguage === 'All' || song.lang === selectedLanguage;
    const matchesKey = selectedKeyFilter === 'All' || song.key === selectedKeyFilter;
    return matchesSearch && matchesLang && matchesKey;
  });

  const languages = ['All', ...new Set(library.map(s => s.lang).filter(Boolean))];
  const keys = ['All', ...new Set(library.map(s => s.key).filter(Boolean))];

  return (
    <aside className="w-80 bg-[#090d16] border-r border-slate-800 flex flex-col h-full shrink-0">
      {activeTab === 'library' ? (
        <div className="p-4 flex flex-col h-full space-y-4">
          
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={onOpenNewModal}
              className="p-2 bg-cyan-400 hover:bg-white text-slate-950 font-bold text-[11px] rounded-lg flex flex-col items-center gap-1 transition-all shadow-md shadow-cyan-400/10"
            >
              <Plus className="w-4 h-4" /> New Chart
            </button>
            <button 
              onClick={onOpenLinkModal}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-[11px] rounded-lg flex flex-col items-center gap-1 transition-all"
            >
              <LinkIcon className="w-4 h-4 text-cyan-400" /> Web Link
            </button>
            <button 
              onClick={onOpenFileModal}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-[11px] rounded-lg flex flex-col items-center gap-1 transition-all"
            >
              <FileUp className="w-4 h-4 text-cyan-400" /> PDF / Text
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search title, chords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-2 text-xs">
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-800 text-slate-400 p-1.5 rounded-lg text-[11px]"
            >
              {languages.map(lang => <option key={lang} value={lang}>{lang === 'All' ? 'All Languages' : lang}</option>)}
            </select>
            <select 
              value={selectedKeyFilter} 
              onChange={(e) => setSelectedKeyFilter(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-800 text-slate-400 p-1.5 rounded-lg text-[11px]"
            >
              {keys.map(k => <option key={k} value={k}>{k === 'All' ? 'All Keys' : `Key: ${k}`}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredLibrary.length === 0 ? (
              <div className="text-center py-10 text-slate-600 text-xs">
                No songs match search.
              </div>
            ) : (
              filteredLibrary.map(song => {
                const isSelected = selectedSong?.id === song.id;
                return (
                  <div 
                    key={song.id}
                    onClick={() => {
                      setSelectedSong(song);
                      setActiveTab('library');
                    }}
                    className={`group w-full p-2.5 rounded-xl text-left border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/50 text-white shadow-md' 
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-bold text-xs truncate">{song.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{song.lang || 'English'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] font-bold bg-slate-950 text-cyan-400 border border-slate-800 px-1.5 py-0.5 rounded">
                        {song.key || 'C'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteSong) onDeleteSong(song.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 rounded transition-opacity"
                        title="Delete Song"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
        /* SETLISTS TAB */
        <div className="p-4 flex flex-col h-full space-y-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (newSetlistName.trim()) {
              onCreateNewSetlist(newSetlistName);
              setNewSetlistName('');
            }
          }} className="flex gap-2">
            <input 
              type="text" 
              placeholder="New Setlist Title..." 
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 p-2 text-xs rounded-lg text-white"
            />
            <button type="submit" className="px-3 bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1">
              <ListPlus className="w-4 h-4" /> Add
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2">
            {savedSetlists.map(list => {
              const isActive = list.id === activeSetlistId;
              return (
                <div 
                  key={list.id} 
                  onClick={() => setActiveSetlistId(list.id)}
                  className={`group p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isActive ? 'bg-cyan-950/60 border-cyan-500/50 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-white">{list.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{list.items?.length || 0} Songs</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onShareSetlist) onShareSetlist(list);
                      }}
                      className="p-1 hover:text-cyan-400 text-slate-500 rounded"
                      title="Share Setlist Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSetlist(list.id);
                      }}
                      className="p-1 hover:text-rose-400 text-slate-600 rounded"
                      title="Delete Setlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}