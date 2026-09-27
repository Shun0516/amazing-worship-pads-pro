import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loader2, Music } from 'lucide-react';
import SongViewer from './SongViewer'; // Or your dedicated shared song viewer component

export default function SharedSongView() {
  const [songData, setSongData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSharedSong() {
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.indexOf('song-share') + 1];

      if (!slug) {
        setError("Invalid share link.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shared_songs')
          .select('payload')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          throw new Error("Song chart not found or link has expired.");
        }

        setSongData(data.payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSharedSong();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Loading shared chart...</p>
      </div>
    );
  }

  if (error || !songData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white p-4 text-center">
        <Music className="w-10 h-10 text-red-400 mb-3" />
        <h2 className="text-lg font-black text-white mb-1">Unable to load chart</h2>
        <p className="text-xs text-slate-400">{error || "Could not load song chart."}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#010719] overflow-hidden">
      <SongViewer song={songData} readOnly={true} />
    </div>
  );
}
