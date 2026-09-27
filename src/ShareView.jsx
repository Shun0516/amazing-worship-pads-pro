import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import SetlistLiveMode from './SetlistLiveMode';
import { Loader2 } from 'lucide-react';

export default function ShareView() {
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSharedSetlist() {
      // Extract the slug from the URL path (e.g., /share/my-setlist-abc1 -> my-setlist-abc1)
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];

      if (!slug || slug === 'share') {
        setError("Invalid or missing share link path.");
        setLoading(false);
        return;
      }

      try {
        // Query Supabase for the shared setlist using the database slug column
        const { data, error: sbError } = await supabase
          .from('shared_setlists')
          .select('payload')
          .eq('slug', slug)
          .single();

        if (sbError) {
          throw sbError;
        }

        if (!data || !data.payload) {
          throw new Error("Setlist data payload is empty.");
        }

        setSharedData(data.payload);
      } catch (err) {
        console.error("Supabase fetch error:", err.message || err);
        setError(`Could not load setlist from database. (${err.message || 'Check table structure'})`);
      } finally {
        setLoading(false);
      }
    }

    fetchSharedSetlist();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Loading shared setlist from database...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white p-4 text-center">
        <h2 className="text-lg font-black text-red-400 mb-2">Database Error</h2>
        <p className="text-xs text-slate-300 max-w-md mb-4 bg-slate-900 p-3 rounded border border-slate-800 font-mono">
          {error}
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg"
        >
          Return to App
        </button>
      </div>
    );
  }

  return (
    <SetlistLiveMode 
      setlist={sharedData.setlist} 
      librarySongs={sharedData.songs} 
      onClose={() => window.location.href = '/'} 
    />
  );
}
