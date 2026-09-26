import React from 'react';
import { X, Upload } from 'lucide-react';

export default function SongModal({
  showModal,
  setShowModal,
  modalMode,
  setModalMode,
  formTitle,
  setFormTitle,
  formKey,
  setFormKey,
  formLang,
  setFormLang,
  formTags,
  setFormTags,
  formContent,
  setFormContent,
  importUrl,
  setImportUrl,
  handleSaveChart,
  handleProcessImportLink,
  handleReadFile
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-[#0d1322] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">
            {modalMode === 'edit' && 'Edit Song Chart'}
            {modalMode === 'new' && 'Add New Song Chart'}
            {modalMode === 'import-link' && 'Import Chart from Link'}
            {modalMode === 'import-file' && 'Import Chart from Local File'}
          </h3>
          <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {modalMode === 'import-link' && (
          <form onSubmit={handleProcessImportLink} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Web Page URL</label>
              <input 
                type="url" 
                placeholder="https://example.com/chords/song-title" 
                value={importUrl} 
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-church-bright-cyan"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">Fetches text and loads it directly into the song editor.</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-church-bright-cyan text-slate-950 font-black rounded-lg text-xs hover:bg-white">Fetch & Edit</button>
            </div>
          </form>
        )}

        {modalMode === 'import-file' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-800 hover:border-church-bright-cyan/50 rounded-xl p-8 text-center space-y-2 cursor-pointer transition-colors relative">
              <Upload className="w-8 h-8 text-church-bright-cyan mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">Click to select a chord sheet file</p>
              <p className="text-[10px] text-slate-500">Supports .txt, .chopro, and plain chord files</p>
              <input type="file" accept=".txt,.chopro,.chordpro" onChange={handleReadFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
            </div>
          </div>
        )}

        {(modalMode === 'new' || modalMode === 'edit') && (
          <form onSubmit={handleSaveChart} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Song Title</label>
              <input 
                type="text" 
                placeholder="e.g. Goodness of God" 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-church-bright-cyan"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Original Key</label>
                <input 
                  type="text" 
                  value={formKey} 
                  onChange={(e) => setFormKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-church-bright-cyan"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Language</label>
                <select 
                  value={formLang} 
                  onChange={(e) => setFormLang(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-church-bright-cyan"
                >
                  <option value="English">English</option>
                  <option value="Tagalog">Tagalog</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Category Tag</label>
                <select 
                  value={formTags} 
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-church-bright-cyan"
                >
                  <option value="Worship">Worship</option>
                  <option value="Praise">Praise</option>
                  <option value="Upbeat">Upbeat</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Chords & Lyrics (Use [G] bracket format)</label>
              <textarea 
                rows="6" 
                placeholder="[G] I love You Lord..." 
                value={formContent} 
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-church-bright-cyan"
              ></textarea>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-church-bright-cyan text-slate-950 font-black rounded-lg text-xs hover:bg-white"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}