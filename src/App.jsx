import React, { useState, useEffect, useRef } from 'react';
import EmptyLandingState from './components/EmptyLandingState';
import SongViewer from './components/SongViewer';
import SharedSongViewer from './components/SharedSongViewer';
import SongEditor from './components/SongEditor';
import SetlistManager from './components/SetlistManager';
import LiveModeViewer from './components/LiveModeViewer';
import SharedSetlistLiveMode from './components/SharedSetlistLiveMode'; // <-- Newly linked component
import AuthModal from './components/AuthModal';
import { 
  Plus, Link as LinkIcon, Upload, HelpCircle, Music, 
  PanelLeftClose, PanelLeft, Search, BookOpen, ListFilter, Loader2,
  FileText, AlertCircle, X, Check, List, Calendar
} from 'lucide-react';

export default function App() {
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('worship_songs');
    return saved ? JSON.parse(saved) : [];
  });

  const [setlists, setSetlists] = useState(() => {
    const saved = localStorage.getItem('worship_setlists');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'setlists'
  const [activeSongId, setActiveSongId] = useState(null);
  const [activeSetlistId, setActiveSetlistId] = useState(null);
  
  // Full screen Live Mode & Shared View State
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [sharedLiveSetlist, setSharedLiveSetlist] = useState(null);
  const [sharedSongData, setSharedSongData] = useState(null);

  // Full screen Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // File Import Modal State & Input Ref
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Functional Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [keyFilter, setKeyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Modals & Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('worship_songs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('worship_setlists', JSON.stringify(setlists));
  }, [setlists]);

  // Handle URL shared setlist or individual song live chart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedSetlistData = params.get('sharedSetlist');
    const sharedSongDataParam = params.get('sharedSong');

    if (sharedSetlistData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedSetlistData)));
        setSharedLiveSetlist(decoded);
      } catch (e) {
        console.error("Failed to parse shared setlist link", e);
      }
    } else if (sharedSongDataParam) {
      try {
        const decodedSong = JSON.parse(decodeURIComponent(atob(sharedSongDataParam)));
        setSharedSongData(decodedSong);
      } catch (e) {
        console.error("Failed to parse shared song link", e);
      }
    }
  }, []);

  // Ensure active setlist defaults to first item if unselected
  useEffect(() => {
    if (setlists.length > 0 && !activeSetlistId) {
      setActiveSetlistId(setlists[0].id);
    }
  }, [setlists, activeSetlistId]);

  const availableKeys = Array.from(new Set(songs.map(s => s.key).filter(Boolean)));
  const availableTags = Array.from(new Set(songs.map(s => s.tag).filter(Boolean)));

  const filteredSongs = songs.filter(song => {
    const matchesSearch = 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (song.chordPro && song.chordPro.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLang = langFilter === 'All' || song.language === langFilter;
    const matchesKey = !keyFilter || song.key === keyFilter;
    const matchesTag = !tagFilter || song.tag === tagFilter;

    return matchesSearch && matchesLang && matchesKey && matchesTag;
  });

  const activeSong = songs.find(s => s.id === activeSongId);
  const activeSetlist = setlists.find(s => s.id === activeSetlistId) || setlists[0];

  // Save chart handler
  const handleSaveSong = (songData) => {
    const enrichedSongData = {
      ...songData,
      sourceType: songData.sourceType || 'custom chart'
    };

    setSongs(prev => {
      const exists = prev.some(s => s.id === enrichedSongData.id);
      if (exists) {
        return prev.map(s => s.id === enrichedSongData.id ? enrichedSongData : s);
      }
      return [enrichedSongData, ...prev];
    });

    setActiveSongId(enrichedSongData.id);
    setIsEditorOpen(false);
    setEditingSong(null);
  };

  const handleDeleteSong = (songId) => {
    setSongs(prev => prev.filter(s => s.id !== songId));
    if (activeSongId === songId) setActiveSongId(null);
    setIsEditorOpen(false);
    setEditingSong(null);
  };

  const handleCreateNewSetlist = () => {
    const name = window.prompt("Enter new setlist name:", "Sunday Service");
    if (!name) return;
    const newSetlist = {
      id: 'setlist-' + Date.now(),
      title: name,
      date: new Date().toISOString().split('T')[0],
      items: []
    };
    setSetlists(prev => [newSetlist, ...prev]);
    setActiveSetlistId(newSetlist.id);
  };

  // URL IMPORT HANDLER
  const handleImportLink = async () => {
    const url = window.prompt("Paste the URL of the song chart or web page:");
    if (!url) return;

    try {
      setIsImporting(true);

      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      let parsedTitle = '';
      let parsedArtist = '';
      let parsedKey = 'G';
      let parsedCapo = '0';
      let parsedChordPro = '';

      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');

        const rawTitle = doc.title || '';
        if (rawTitle) {
          const parts = rawTitle.split(/[-|–]/);
          parsedTitle = parts[0]?.trim() || '';
          parsedArtist = parts[1]?.trim().replace(/chords|tab|lyrics/gi, '').trim() || '';
        }

        const preTag = doc.querySelector('pre');
        if (preTag) {
          parsedChordPro = preTag.textContent;
        } else {
          const bodyText = doc.body?.innerText || doc.body?.textContent || '';
          parsedChordPro = bodyText.slice(0, 3000);
        }

        const keyMatch = data.contents.match(/key[:\s]+([A-[#b]+)/i);
        if (keyMatch) parsedKey = keyMatch[1].toUpperCase();

        const capoMatch = data.contents.match(/capo[:\s]+(\d+)/i);
        if (capoMatch) parsedCapo = capoMatch[1];
      }

      if (parsedChordPro && !parsedChordPro.includes('[')) {
        parsedChordPro = parsedChordPro.replace(/\b([A-G][#b]?(?:m|maj|dim|aug|sus)?\d*)\b/g, '[$1]');
      }

      setEditingSong({
        id: 'imported-' + Date.now(),
        title: parsedTitle || 'Imported Song',
        artist: parsedArtist || 'Unknown Artist',
        key: parsedKey,
        capo: parsedCapo,
        timeSignature: '4/4',
        tempo: '120',
        language: 'English',
        sourceType: 'imported',
        chordPro: parsedChordPro || `{title: ${parsedTitle || 'Imported Song'}}\n{key: ${parsedKey}}\n\n[G]Sample imported chart line [C]here`
      });

      setIsEditorOpen(true);
    } catch (err) {
      alert('Unable to import from this link directly. Opening editor with template.');
      setEditingSong({
        id: 'imported-' + Date.now(),
        title: 'Imported Song',
        artist: 'Unknown Artist',
        key: 'G',
        capo: '0',
        sourceType: 'imported',
        chordPro: '{title: Imported Song}\n{key: G}\n\n[G]Enter your chords [C]here'
      });
      setIsEditorOpen(true);
    } finally {
      setIsImporting(false);
    }
  };

  // FILE IMPORT HANDLER
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      alert('PDF files are not supported. Please select a text or ChordPro file (.txt, .pro, .chordpro, .chopro, .crd).');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target?.result || '';
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      
      let parsedTitle = fileNameWithoutExt;
      let parsedArtist = '';
      let parsedKey = 'C';
      let parsedCapo = '0';

      const titleDirective = content.match(/\{(?:t|title):\s*([^}]+)\}/i);
      if (titleDirective) parsedTitle = titleDirective[1].trim();

      const artistDirective = content.match(/\{(?:a|artist):\s*([^}]+)\}/i);
      if (artistDirective) parsedArtist = artistDirective[1].trim();

      const keyDirective = content.match(/\{(?:k|key):\s*([^}]+)\}/i);
      if (keyDirective) parsedKey = keyDirective[1].trim().toUpperCase();

      const capoDirective = content.match(/\{capo:\s*([^}]+)\}/i);
      if (capoDirective) parsedCapo = capoDirective[1].trim();

      if (!content.includes('[')) {
        content = content.replace(/\b([A-G][#b]?(?:m|maj|dim|aug|sus)?\d*)\b/g, '[$1]');
      }

      setEditingSong({
        id: 'file-' + Date.now(),
        title: parsedTitle,
        artist: parsedArtist || 'Unknown Artist',
        key: parsedKey,
        capo: parsedCapo,
        timeSignature: '4/4',
        tempo: '120',
        language: 'English',
        sourceType: 'imported',
        chordPro: content
      });

      setIsFileModalOpen(false);
      setIsEditorOpen(true);
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  // IF RECEIVING A SHARED SINGLE SONG LINK
  if (sharedSongData) {
    return <SharedSongViewer songData={sharedSongData} />;
  }

  // IF RECEIVING A SHARED SETLIST URL, DIRECTLY SHOW SHARED LIVE MODE VIEWER
  if (sharedLiveSetlist) {
    return <SharedSetlistLiveMode />;
  }

  if (isEditorOpen) {
    return (
      <SongEditor 
        song={editingSong} 
        onSave={handleSaveSong} 
        onCancel={() => {
          setIsEditorOpen(false);
          setEditingSong(null);
        }} 
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#010719] text-slate-100 overflow-hidden font-sans">
      
      {/* LIVE MODE VIEWER OVERLAY */}
      {isLiveModeOpen && (
        <LiveModeViewer 
          setlist={activeSetlist}
          librarySongs={songs}
          onClose={() => setIsLiveModeOpen(false)}
        />
      )}

      {/* HIDDEN FILE INPUT */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".txt,.pro,.chordpro,.chopro,.crd,.text"
        className="hidden" 
      />

      {/* TOP HEADER */}
      <header className="h-12 bg-[#0a0f1d] border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-400 text-slate-950 rounded-lg font-black text-xs flex items-center justify-center">
            <Music className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">Amazing Worship Pads Pro</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-bold">
          <button 
            onClick={() => {
              setActiveTab('library');
              setActiveSongId(null);
            }}
            className={`transition-colors ${
              activeTab === 'library' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Library
          </button>
          <button 
            onClick={() => setActiveTab('setlists')}
            className={`transition-colors ${
              activeTab === 'setlists' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Setlists
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Local only</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* DYNAMIC LEFT SIDEBAR */}
        <aside className={`bg-[#070a12] border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-72'
        }`}>
          
          {isSidebarCollapsed ? (
            <div className="flex-1 flex flex-col items-center py-4 space-y-6">
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>

              <div className="w-8 h-px bg-slate-800"></div>

              <button 
                onClick={() => {
                  setActiveTab('library');
                  setIsSidebarCollapsed(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'library' ? 'bg-cyan-400/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Song Library"
              >
                <BookOpen className="w-5 h-5" />
              </button>

              <button 
                onClick={() => {
                  setActiveTab('setlists');
                  setIsSidebarCollapsed(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'setlists' ? 'bg-cyan-400/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Setlists"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded transition-colors"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase">
                    {activeTab === 'library' ? 'YOUR REPERTOIRE' : 'YOUR SETLISTS'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeTab === 'library' ? filteredSongs.length : setlists.length}
                </span>
              </div>

              <h2 className="text-xl font-black text-white mb-4">
                {activeTab === 'library' ? 'Song library' : 'All setlists'}
              </h2>

              {/* SETLIST SIDEBAR VIEW */}
              {activeTab === 'setlists' ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-2 mb-4 overflow-y-auto pr-1">
                    {setlists.map(sl => (
                      <div 
                        key={sl.id}
                        onClick={() => setActiveSetlistId(sl.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          activeSetlistId === sl.id 
                            ? 'bg-cyan-950/30 border-cyan-500/40' 
                            : 'bg-[#0a0f1d]/50 border-slate-800/80 hover:bg-[#0a0f1d]'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-white truncate mb-1">{sl.title}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {sl.date || 'No date'}
                          </span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {(sl.items || []).length} songs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleCreateNewSetlist}
                    className="w-full py-2 bg-cyan-400 hover:bg-white text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow mt-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> New setlist
                  </button>
                </div>
              ) : (
                /* SONG LIBRARY SIDEBAR VIEW */
                <div className="flex-1 flex flex-col">
                  <div className="relative mb-3">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search songs, artists, or lyrics"
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-3 top-2 text-slate-600 text-xs font-mono">/</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold mb-4">
                    {['All', 'English', 'Tagalog'].map(lang => (
                      <button 
                        key={lang}
                        onClick={() => setLangFilter(lang)}
                        className={langFilter === lang ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">KEY</label>
                      <select 
                        value={keyFilter}
                        onChange={(e) => setKeyFilter(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">All keys</option>
                        {availableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">TAG</label>
                      <select 
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">All tags</option>
                        {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {filteredSongs.length > 0 ? (
                    <div className="flex-1 space-y-2 mb-4 overflow-y-auto pr-1">
                      {filteredSongs.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => setActiveSongId(s.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            activeSongId === s.id 
                              ? 'bg-cyan-950/30 border-cyan-500/40' 
                              : 'bg-[#0a0f1d]/50 border-slate-800/80 hover:bg-[#0a0f1d]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 bg-cyan-950/60 rounded">
                              {s.key}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{s.artist || 'Unknown Artist'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl mb-4 bg-[#0a0f1d]/40">
                      <span className="p-2 bg-cyan-950/40 text-cyan-400 font-mono font-bold text-xs rounded-md mb-3 border border-cyan-500/20">
                        [G]
                      </span>
                      <h3 className="text-xs font-bold text-white mb-1">Your charts live here.</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px]">
                        Add songs from repertoire or import a file.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 mb-3 mt-auto">
                    <button 
                      onClick={() => {
                        setEditingSong(null);
                        setIsEditorOpen(true);
                      }}
                      className="w-full py-2 bg-cyan-400 hover:bg-white text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> New chart
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleImportLink}
                        disabled={isImporting}
                        className="py-2 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isImporting ? (
                          <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                        ) : (
                          <LinkIcon className="w-3 h-3 text-cyan-400" />
                        )}
                        Import link
                      </button>
                      
                      <button 
                        onClick={() => setIsFileModalOpen(true)}
                        className="py-2 bg-[#0a0f1d] hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Upload className="w-3 h-3 text-cyan-400" /> Import file
                      </button>
                    </div>
                  </div>

                  <button className="text-[11px] font-semibold text-slate-500 hover:text-cyan-400 flex items-center gap-1 self-start transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" /> Quick guide
                  </button>
                </div>
              )}

            </div>
          )}
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'library' ? (
            activeSong ? (
              <SongViewer 
                song={activeSong} 
                onEdit={() => {
                  setEditingSong(activeSong);
                  setIsEditorOpen(true);
                }}
                onDelete={() => handleDeleteSong(activeSong.id)}
              />
            ) : (
              <EmptyLandingState view="library" />
            )
          ) : (
            <SetlistManager 
              setlist={activeSetlist}
              setlists={setlists}
              setSetlists={setSetlists}
              librarySongs={songs}
              activeSetlistId={activeSetlistId}
              setActiveSetlistId={setActiveSetlistId}
              onOpenLiveMode={() => setIsLiveModeOpen(true)}
            />
          )}
        </main>
      </div>

      {/* FILE IMPORT MODAL */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f141e] border border-slate-800 w-full max-w-sm rounded-xl p-6 relative">
            <button 
              onClick={() => setIsFileModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-2">Import File</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select a text or ChordPro file (.txt, .pro, .chordpro, .chopro, .crd).
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-cyan-400 hover:bg-white text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Select File
            </button>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      )}

    </div>
  );
}