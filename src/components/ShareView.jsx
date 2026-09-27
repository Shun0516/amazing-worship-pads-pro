import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import SharedSetlistLiveMode from './SharedSetlistLiveMode';
import { Loader2 } from 'lucide-react';

export default function ShareView() {
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSharedSetlist() {
      // Extract the slug from the URL (e.g., /share/sunday-service -> sunday-service)
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];

      if (!slug) {
        setError("Invalid share link.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shared_setlists')
          .select('payload')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          throw new Error("Setlist not found or link has expired.");
        }

        setSharedData(data.payload);
      } catch (err) {
        setError(err.message);
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
        <p className="text-xs font-bold text-slate-400">Loading shared setlist...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white p-4 text-center">
        <h2 className="text-lg font-black text-red-400 mb-2">Oops!</h2>
        <p className="text-xs text-slate-400">{error || "Could not load setlist."}</p>
      </div>
    );
  }

  // Pass the fetched setlist and songs into your Live Mode viewer
  return (
    <SharedSetlistLiveMode 
      setlist={sharedData.setlist} 
      songs={sharedData.songs} 
    />
  );
}